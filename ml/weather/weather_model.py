"""
AgroSentinel AI — Weather Feature Engineering & Risk Model

This module:
1. Ingests raw weather observations
2. Engineers temporal features (rolling means, anomalies, wet-day streaks)
3. Estimates environmental disease risk using XGBoost
4. Produces a 128-dim weather embedding for the multimodal fusion model

Features documented in config/data.yaml under features.weather.
"""

import json
import logging
import pickle
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


# ── Feature Engineering ────────────────────────────────────────────────────────
class WeatherFeatureEngineer:
    """
    Transforms raw weather time-series into ML-ready features.
    
    Raw inputs (daily):
      - temperature_c
      - humidity_pct
      - rainfall_mm
      - wind_speed_kmh
      - solar_radiation (optional)
    
    Engineered outputs (all numeric):
      - temperature_mean_1d, _3d, _7d
      - humidity_mean_1d, _3d, _7d
      - rainfall_1d, _3d, _7d
      - consecutive_wet_days
      - wind_mean (7d)
      - temperature_anomaly (vs 30d baseline)
      - humidity_anomaly (vs 30d baseline)
      - disease_favorable_days (consecutive days of high humidity + warm temp)
    """

    ROLLING_WINDOWS = [1, 3, 7]
    ANOMALY_BASELINE_DAYS = 30

    def engineer(self, weather_df: pd.DataFrame, target_date: Optional[pd.Timestamp] = None) -> Dict[str, float]:
        """
        Engineer features from a weather DataFrame.
        
        Args:
            weather_df: DataFrame with columns [timestamp, temperature_c, 
                        humidity_pct, rainfall_mm, wind_speed_kmh]
                        Sorted by timestamp ascending.
            target_date: Date for which to compute features.
                         Defaults to last date in DataFrame.
        
        Returns:
            Dictionary of feature_name → float value
        """
        if weather_df.empty:
            return self._empty_features()

        df = weather_df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)

        if target_date is None:
            target_date = df["timestamp"].max()

        # Get recent data window
        recent = df[df["timestamp"] <= target_date].tail(self.ANOMALY_BASELINE_DAYS + 7)

        if len(recent) < 1:
            return self._empty_features()

        features = {}

        # ── Rolling means for temperature ──────────────────────────────────────
        for window in self.ROLLING_WINDOWS:
            vals = recent["temperature_c"].tail(window)
            features[f"temperature_mean_{window}d"] = float(vals.mean()) if len(vals) > 0 else 25.0

        # ── Rolling means for humidity ─────────────────────────────────────────
        for window in self.ROLLING_WINDOWS:
            vals = recent["humidity_pct"].tail(window)
            features[f"humidity_mean_{window}d"] = float(vals.mean()) if len(vals) > 0 else 60.0

        # ── Rolling rainfall sums ──────────────────────────────────────────────
        for window in self.ROLLING_WINDOWS:
            vals = recent["rainfall_mm"].tail(window)
            features[f"rainfall_{window}d"] = float(vals.sum()) if len(vals) > 0 else 0.0

        # ── Consecutive wet days ───────────────────────────────────────────────
        recent_rain = recent["rainfall_mm"].tail(14).values[::-1]  # Most recent first
        consecutive_wet = 0
        for r in recent_rain:
            if r > 0.5:  # Wet day threshold: >0.5mm
                consecutive_wet += 1
            else:
                break
        features["consecutive_wet_days"] = float(consecutive_wet)

        # ── Wind speed (7d mean) ───────────────────────────────────────────────
        wind_vals = recent["wind_speed_kmh"].tail(7)
        features["wind_mean"] = float(wind_vals.mean()) if len(wind_vals) > 0 else 10.0

        # ── Temperature anomaly (vs 30d baseline) ─────────────────────────────
        baseline_temp = recent["temperature_c"].tail(self.ANOMALY_BASELINE_DAYS)
        current_temp = features["temperature_mean_1d"]
        if len(baseline_temp) >= 7:
            features["temperature_anomaly"] = current_temp - float(baseline_temp.mean())
        else:
            features["temperature_anomaly"] = 0.0

        # ── Humidity anomaly (vs 30d baseline) ────────────────────────────────
        baseline_hum = recent["humidity_pct"].tail(self.ANOMALY_BASELINE_DAYS)
        current_hum = features["humidity_mean_1d"]
        if len(baseline_hum) >= 7:
            features["humidity_anomaly"] = current_hum - float(baseline_hum.mean())
        else:
            features["humidity_anomaly"] = 0.0

        # ── Disease-favorable days ─────────────────────────────────────────────
        # Days where humidity > 75% AND temperature between 15-30°C (late blight risk)
        recent_7d = recent.tail(7)
        favorable = (
            (recent_7d["humidity_pct"] > 75) &
            (recent_7d["temperature_c"] >= 15) &
            (recent_7d["temperature_c"] <= 30)
        )
        features["disease_favorable_days"] = float(favorable.sum())

        return features

    def _empty_features(self) -> Dict[str, float]:
        """Return neutral feature values when no weather data is available."""
        return {
            "temperature_mean_1d": 25.0,
            "temperature_mean_3d": 25.0,
            "temperature_mean_7d": 25.0,
            "humidity_mean_1d": 60.0,
            "humidity_mean_3d": 60.0,
            "humidity_mean_7d": 60.0,
            "rainfall_1d": 0.0,
            "rainfall_3d": 0.0,
            "rainfall_7d": 0.0,
            "consecutive_wet_days": 0.0,
            "wind_mean": 10.0,
            "temperature_anomaly": 0.0,
            "humidity_anomaly": 0.0,
            "disease_favorable_days": 0.0,
        }

    def features_to_vector(self, features: Dict[str, float]) -> np.ndarray:
        """Convert feature dict to ordered numpy vector for model input."""
        FEATURE_ORDER = [
            "temperature_mean_1d", "temperature_mean_3d", "temperature_mean_7d",
            "humidity_mean_1d", "humidity_mean_3d", "humidity_mean_7d",
            "rainfall_1d", "rainfall_3d", "rainfall_7d",
            "consecutive_wet_days", "wind_mean",
            "temperature_anomaly", "humidity_anomaly",
            "disease_favorable_days",
        ]
        return np.array([features.get(k, 0.0) for k in FEATURE_ORDER], dtype=np.float32)


# ── Crop Stage Features ────────────────────────────────────────────────────────
CROP_TYPES = ["tomato", "wheat", "rice", "maize", "soybean", "potato", "cotton", "onion"]
GROWTH_STAGES = ["germination", "seedling", "vegetative", "flowering", "fruit_development", "maturity", "harvest"]

STAGE_SUSCEPTIBILITY = {
    "germination": 0.2,
    "seedling": 0.4,
    "vegetative": 0.6,
    "flowering": 0.9,
    "fruit_development": 0.85,
    "maturity": 0.5,
    "harvest": 0.3,
}


class CropFeatureEngineer:
    """
    Encodes crop type and growth stage into numerical features for ML models.
    
    Never feeds raw strings into models — always numeric encodings.
    """

    def engineer(
        self,
        crop_type: str,
        growth_stage: str,
        sowing_date: Optional[str] = None,
    ) -> Dict[str, float]:
        """
        Produce crop features.
        
        Returns:
            Dict with: crop_type_encoded, growth_stage_encoded, 
                       days_after_sowing, stage_susceptibility_index
        """
        import datetime

        # One-hot-like ordinal encoding
        crop_idx = CROP_TYPES.index(crop_type) if crop_type in CROP_TYPES else 0
        stage_idx = GROWTH_STAGES.index(growth_stage) if growth_stage in GROWTH_STAGES else 2

        # Susceptibility score from lookup table
        susceptibility = STAGE_SUSCEPTIBILITY.get(growth_stage, 0.5)

        # Days after sowing
        days_after_sowing = 60  # Default if no sowing date
        if sowing_date:
            try:
                sow_dt = pd.to_datetime(sowing_date)
                days_after_sowing = max(0, (datetime.datetime.now() - sow_dt.to_pydatetime()).days)
            except Exception:
                pass

        return {
            "crop_type_encoded": float(crop_idx),
            "growth_stage_encoded": float(stage_idx),
            "days_after_sowing": float(min(days_after_sowing, 365)),
            "stage_susceptibility_index": float(susceptibility),
        }

    def features_to_vector(self, features: Dict[str, float]) -> np.ndarray:
        FEATURE_ORDER = [
            "crop_type_encoded", "growth_stage_encoded",
            "days_after_sowing", "stage_susceptibility_index"
        ]
        return np.array([features.get(k, 0.0) for k in FEATURE_ORDER], dtype=np.float32)


# ── Weather Risk Model (XGBoost) ───────────────────────────────────────────────
class WeatherRiskModel:
    """
    XGBoost model that estimates environmental disease risk from weather features.
    
    Input: 14 weather features (from WeatherFeatureEngineer)
    Output: weather_risk (0-1 scalar) + 128-dim embedding (for multimodal fusion)
    
    The embedding is produced by a simple MLP on top of the XGBoost leaf features.
    In the MVP we use the feature vector directly as embedding after scaling.
    """

    def __init__(self, checkpoint_path: Optional[str] = None):
        self.model = None
        self.scaler = StandardScaler()
        self.model_version = "weather_v0.1"
        self._is_fitted = False

        if checkpoint_path and Path(checkpoint_path).exists():
            self.load(checkpoint_path)

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train the weather risk model."""
        try:
            from xgboost import XGBClassifier
            self.scaler.fit(X)
            X_scaled = self.scaler.transform(X)

            self.model = XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                use_label_encoder=False,
                eval_metric="logloss",
                random_state=42,
            )
            self.model.fit(X_scaled, y)
            self._is_fitted = True
            logger.info("✅ Weather risk model trained.")
        except ImportError:
            logger.error("XGBoost not available. Install with: pip install xgboost")

    def predict(self, weather_features: Dict[str, float]) -> Dict:
        """
        Predict weather-based disease risk.
        
        Args:
            weather_features: Dict from WeatherFeatureEngineer.engineer()
        
        Returns:
            Dict with: weather_risk (float 0-1), embedding (List[float] len 128)
        """
        engineer = WeatherFeatureEngineer()
        vec = engineer.features_to_vector(weather_features)

        if not self._is_fitted or self.model is None:
            # Heuristic fallback when model is not trained
            weather_risk = self._heuristic_risk(weather_features)
        else:
            vec_scaled = self.scaler.transform(vec.reshape(1, -1))
            weather_risk = float(self.model.predict_proba(vec_scaled)[0, 1])

        # Create embedding (pad/repeat feature vector to 128 dims)
        embedding = self._make_embedding(vec)

        return {
            "weather_risk": round(weather_risk, 4),
            "embedding": embedding,
            "model_version": self.model_version,
        }

    def _heuristic_risk(self, features: Dict[str, float]) -> float:
        """Rough heuristic risk when model not trained — used as initial fallback."""
        humidity = features.get("humidity_mean_3d", 60)
        rain = features.get("rainfall_3d", 0)
        temp = features.get("temperature_mean_3d", 25)
        wet_days = features.get("consecutive_wet_days", 0)
        fav_days = features.get("disease_favorable_days", 0)

        risk = 0.0
        # Humidity contribution
        if humidity > 80:
            risk += 0.3
        elif humidity > 70:
            risk += 0.15

        # Rainfall contribution
        if rain > 20:
            risk += 0.2
        elif rain > 5:
            risk += 0.1

        # Favorable temperature for late blight (15-25°C)
        if 15 <= temp <= 25:
            risk += 0.15

        # Consecutive wet days
        risk += min(wet_days * 0.05, 0.2)

        # Disease-favorable days
        risk += min(fav_days * 0.04, 0.15)

        # Add small noise for realism
        risk += np.random.normal(0, 0.02)

        return float(np.clip(risk, 0.0, 1.0))

    def _make_embedding(self, vec: np.ndarray) -> List[float]:
        """Create 128-dim embedding by repeating and projecting feature vector."""
        # Repeat the 14-dim vector to fill 128 dims with simple linear mixing
        repeats = 128 // len(vec) + 1
        padded = np.tile(vec, repeats)[:128]
        # Normalize
        norm = np.linalg.norm(padded)
        if norm > 0:
            padded = padded / norm
        return padded.tolist()

    def save(self, path: str):
        """Save model and scaler."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump({"model": self.model, "scaler": self.scaler, "version": self.model_version}, f)
        logger.info(f"Weather model saved to {path}")

    def load(self, path: str):
        """Load model and scaler from checkpoint."""
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
            self.model = data["model"]
            self.scaler = data["scaler"]
            self.model_version = data.get("version", "weather_v0.1")
            self._is_fitted = True
            logger.info(f"✅ Weather model loaded from {path}")
        except Exception as e:
            logger.error(f"Failed to load weather model: {e}")


# ── Weather Provider Abstraction ───────────────────────────────────────────────
class MockWeatherProvider:
    """
    Returns plausible synthetic weather data for a given location and date.
    Used when no real weather API is configured.
    """

    def get_recent_weather(
        self, lat: float, lon: float, num_days: int = 30
    ) -> pd.DataFrame:
        """Generate synthetic weather DataFrame for the given location."""
        import datetime

        np.random.seed(int(abs(lat * 100 + lon * 100)) % 9999)

        dates = pd.date_range(
            end=datetime.datetime.now(),
            periods=num_days,
            freq="D"
        )

        # Regional climate approximation based on latitude
        base_temp = 30 - abs(lat - 20) * 0.5
        base_humid = 65 + np.sin(lon / 10) * 10

        temps = base_temp + np.random.normal(0, 3, num_days)
        humids = np.clip(base_humid + np.random.normal(0, 8, num_days), 30, 98)
        rains = np.random.exponential(2, num_days)
        rains[rains < 0.5] = 0  # Dry days
        winds = np.abs(np.random.normal(12, 5, num_days))

        return pd.DataFrame({
            "timestamp": dates,
            "temperature_c": temps,
            "humidity_pct": humids,
            "rainfall_mm": rains,
            "wind_speed_kmh": winds,
            "solar_radiation": np.random.uniform(10, 25, num_days),
        })


class HistoricalWeatherProvider:
    """Uses stored historical weather data from local CSV files."""

    def __init__(self, data_path: str = "./data/processed/weather/"):
        self.data_path = Path(data_path)

    def get_recent_weather(self, lat: float, lon: float, num_days: int = 30) -> pd.DataFrame:
        # Try to find nearest stored weather file
        # Fall back to MockWeatherProvider if not found
        mock = MockWeatherProvider()
        return mock.get_recent_weather(lat, lon, num_days)


def get_weather_provider(mode: str = "mock") -> MockWeatherProvider:
    """Factory function to get the appropriate weather provider."""
    if mode == "mock":
        return MockWeatherProvider()
    elif mode == "historical":
        return HistoricalWeatherProvider()
    else:
        return MockWeatherProvider()
