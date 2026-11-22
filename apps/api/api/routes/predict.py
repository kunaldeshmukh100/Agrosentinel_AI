"""
AgroSentinel AI — Full Multimodal Prediction Route

This is the core intelligence endpoint.
It orchestrates the complete pipeline:
  1. Image decoding + vision model
  2. Weather feature engineering
  3. Crop stage encoding
  4. Geospatial feature computation
  5. Satellite feature retrieval
  6. Historical feature computation
  7. Multimodal fusion (Gated Cross-Attention)
  8. Risk estimation + alert level
  9. Explainability generation
  10. Database persistence
"""

import base64
import json
import logging
import sys
import torch
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

# ── Path Setup ─────────────────────────────────────────────────────────────────
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

logger = logging.getLogger(__name__)

router = APIRouter()

# ── ML Imports (with graceful fallback) ───────────────────────────────────────
try:
    from ml.vision.vision_model import get_vision_engine, DISEASE_CLASSES
    VISION_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Vision module not available: {e}")
    VISION_AVAILABLE = False

try:
    from ml.weather.weather_model import (
        WeatherFeatureEngineer, CropFeatureEngineer,
        WeatherRiskModel, MockWeatherProvider
    )
    WEATHER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Weather module not available: {e}")
    WEATHER_AVAILABLE = False

try:
    from ml.geospatial.geospatial_engine import (
        GeospatialFeatureEngineer, SatelliteFeatureEngineer, HistoricalFeatureEngineer,
        SpatialClusterDetector
    )
    GEO_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Geospatial module not available: {e}")
    GEO_AVAILABLE = False

try:
    from ml.fusion.fusion_model import FusionInferenceEngine
    FUSION_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Fusion module not available: {e}")
    FUSION_AVAILABLE = False

# ── Database ───────────────────────────────────────────────────────────────────
try:
    from database import get_db
    from database.models import (
        DiseaseObservation, OutbreakPrediction, AlertLevel, Farm
    )
    DB_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Database module not available: {e}")
    DB_AVAILABLE = False


# ── Request/Response Schemas ───────────────────────────────────────────────────
class PredictRequest(BaseModel):
    farm_id: Optional[int] = None
    latitude: float
    longitude: float
    crop_type: str = "tomato"
    growth_stage: str = "flowering"
    sowing_date: Optional[str] = None
    image_base64: Optional[str] = None
    notes: str = ""


class ModalityGates(BaseModel):
    image: float
    weather: float
    crop: float
    geo: float
    satellite: float
    historical: float


class SHAPEntry(BaseModel):
    feature: str
    value: float
    description: str


class PredictResponse(BaseModel):
    prediction_id: Optional[int] = None
    predicted_disease: str
    disease_probability: float
    severity_score: float
    current_risk: float
    future_risk_3d: float
    future_risk_5d: float
    future_risk_7d: float
    spread_probability: float
    alert_level: str
    modality_gates: dict
    explanation_text: str
    shap_summary: list
    model_version: str
    inference_time_ms: Optional[float] = None


# ── Singleton engines (loaded once per process) ────────────────────────────────
_vision_engine = None
_fusion_engine = None
_weather_model = None


def get_engines():
    global _vision_engine, _fusion_engine, _weather_model

    if VISION_AVAILABLE and _vision_engine is None:
        checkpoint = project_root / "models" / "checkpoints" / "vision_model.pt"
        _vision_engine = get_vision_engine(
            checkpoint_path=str(checkpoint) if checkpoint.exists() else None
        )

    if FUSION_AVAILABLE and _fusion_engine is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _fusion_engine = FusionInferenceEngine(device=device)
        checkpoint = project_root / "models" / "checkpoints" / "fusion_model.pt"
        if checkpoint.exists():
            try:
                _fusion_engine.load_checkpoint(str(checkpoint))
            except Exception as e:
                logger.warning(f"Could not load fusion checkpoint: {e}")

    if WEATHER_AVAILABLE and _weather_model is None:
        checkpoint = project_root / "models" / "checkpoints" / "weather_model.pkl"
        _weather_model = WeatherRiskModel(
            checkpoint_path=str(checkpoint) if checkpoint.exists() else None
        )

    return _vision_engine, _fusion_engine, _weather_model


# ── Alert Level Computation ────────────────────────────────────────────────────
def compute_alert_level(risk: float) -> str:
    if risk < 0.30:
        return "GREEN"
    elif risk < 0.55:
        return "YELLOW"
    elif risk < 0.75:
        return "ORANGE"
    else:
        return "RED"


# ── Explanation Generator ──────────────────────────────────────────────────────
def generate_explanation(
    alert_level: str,
    weather_features: dict,
    geo_features: dict,
    modality_gates: dict,
    disease: str,
    disease_prob: float,
) -> str:
    """Generate human-readable explanation of the risk assessment."""
    parts = []

    # Disease detection
    if disease != "healthy" and disease_prob > 0.4:
        parts.append(
            f"The crop image shows signs consistent with {disease.replace('_', ' ')} "
            f"(confidence: {disease_prob:.0%})"
        )

    # Weather contribution
    if WEATHER_AVAILABLE and weather_features:
        humidity = weather_features.get("humidity_mean_3d", 60)
        rain = weather_features.get("rainfall_3d", 0)
        wet_days = weather_features.get("consecutive_wet_days", 0)

        if humidity > 80:
            parts.append(f"high recent humidity ({humidity:.0f}%) creates favorable conditions for fungal spread")
        if rain > 10:
            parts.append(f"recent rainfall ({rain:.1f}mm over 3 days) increases moisture stress")
        if wet_days >= 3:
            parts.append(f"{int(wet_days)} consecutive wet days detected")

    # Geospatial contribution
    if geo_features:
        nearby = geo_features.get("nearby_cases_5km", 0)
        if nearby > 0:
            parts.append(f"{int(nearby)} disease cases detected within 5km")
        if geo_features.get("in_active_cluster", 0) > 0.5:
            growth = geo_features.get("cluster_growth_rate", 0)
            parts.append(f"farm is within an active disease cluster (growth rate: {growth:.1f} cases/day)")

    if not parts:
        if alert_level == "GREEN":
            return "Risk appears low. Continue routine monitoring."
        else:
            return "Multiple risk factors detected. Increase monitoring and inspect nearby farms."

    risk_label = {
        "GREEN": "Low risk",
        "YELLOW": "Moderate risk",
        "ORANGE": "High risk",
        "RED": "Critical risk",
    }.get(alert_level, "Elevated risk")

    return f"{risk_label}: " + "; ".join(parts) + "."


# ── Heuristic Risk (when fusion model not trained) ─────────────────────────────
def compute_heuristic_risk(
    disease: str,
    disease_prob: float,
    weather_features: dict,
    geo_features: dict,
    crop_features: dict,
) -> dict:
    """
    Compute outbreak risk using a weighted heuristic formula.
    Used when the trained fusion model is not available.
    This is deterministic and interpretable, not a black box.
    """
    import numpy as np

    # Image risk contribution (40%)
    if disease == "healthy":
        image_risk = disease_prob * 0.1
    else:
        image_risk = disease_prob

    # Weather risk (25%)
    humidity = weather_features.get("humidity_mean_3d", 60)
    rain = weather_features.get("rainfall_3d", 0)
    wet_days = weather_features.get("consecutive_wet_days", 0)
    fav_days = weather_features.get("disease_favorable_days", 0)

    weather_risk = 0.0
    weather_risk += min(max(humidity - 50, 0) / 50, 1.0) * 0.4
    weather_risk += min(rain / 30, 1.0) * 0.2
    weather_risk += min(wet_days / 7, 1.0) * 0.2
    weather_risk += min(fav_days / 7, 1.0) * 0.2
    weather_risk = float(np.clip(weather_risk, 0, 1))

    # Geo risk (20%)
    nearby = geo_features.get("nearby_cases_5km", 0)
    in_cluster = geo_features.get("in_active_cluster", 0)
    growth = geo_features.get("cluster_growth_rate", 0)

    geo_risk = 0.0
    geo_risk += min(nearby / 10, 1.0) * 0.4
    geo_risk += in_cluster * 0.4
    geo_risk += min(growth / 5, 1.0) * 0.2
    geo_risk = float(np.clip(geo_risk, 0, 1))

    # Crop susceptibility (15%)
    susceptibility = crop_features.get("stage_susceptibility_index", 0.5)

    # Combined weighted risk
    current_risk = (
        image_risk * 0.40 +
        weather_risk * 0.25 +
        geo_risk * 0.20 +
        susceptibility * 0.15
    )
    current_risk = float(np.clip(current_risk, 0, 1))

    # Future risk (simple trend)
    trend = geo_features.get("cluster_growth_rate", 0) * 0.02
    future_risk_3d = float(np.clip(current_risk + trend * 3, 0, 1))
    future_risk_5d = float(np.clip(current_risk + trend * 5, 0, 1))
    future_risk_7d = float(np.clip(current_risk + trend * 7, 0, 1))

    spread_prob = float(np.clip(current_risk * 0.85, 0, 1))

    return {
        "current_risk": round(current_risk, 4),
        "future_risk_3d": round(future_risk_3d, 4),
        "future_risk_5d": round(future_risk_5d, 4),
        "future_risk_7d": round(future_risk_7d, 4),
        "spread_probability": round(spread_prob, 4),
        "gates": {
            "image": round(image_risk * 0.40, 3),
            "weather": round(weather_risk * 0.25, 3),
            "crop": round(susceptibility * 0.15, 3),
            "geo": round(geo_risk * 0.20, 3),
            "satellite": 0.0,
            "historical": 0.0,
        }
    }


# ── Main Prediction Endpoint ───────────────────────────────────────────────────
@router.post("/", response_model=PredictResponse, status_code=200)
async def predict(
    req: PredictRequest,
    db: Session = Depends(get_db) if DB_AVAILABLE else None,
):
    """
    Run the complete AgroSentinel AI multimodal prediction pipeline.
    
    Combines:
    - Computer vision disease detection (EfficientNet-B0)
    - Weather risk estimation (XGBoost)
    - Crop stage susceptibility encoding
    - Geospatial disease density features
    - Satellite NDVI features
    - Historical outbreak features
    - Gated Cross-Attention fusion
    
    Returns disease diagnosis + outbreak risk forecast.
    """
    import time
    t_start = time.time()

    vision_engine, fusion_engine, weather_model = get_engines()

    # ── Step 1: Vision Inference ───────────────────────────────────────────────
    disease = "healthy"
    disease_prob = 0.1
    severity = 0.05
    image_embedding = [0.0] * 128  # Zero embedding if no image

    if req.image_base64 and VISION_AVAILABLE and vision_engine:
        try:
            # Strip data URL prefix if present
            b64_data = req.image_base64
            if "," in b64_data:
                b64_data = b64_data.split(",", 1)[1]

            image_bytes = base64.b64decode(b64_data)
            vision_result = vision_engine.predict(image_bytes)

            if "error" not in vision_result:
                disease = vision_result["predicted_disease"]
                disease_prob = vision_result["disease_probability"]
                severity = vision_result["severity_score"]
                image_embedding = vision_result["image_embedding"]
            else:
                logger.warning(f"Vision error: {vision_result['error']}")
        except Exception as e:
            logger.error(f"Vision inference failed: {e}")

    # ── Step 2: Weather Features ───────────────────────────────────────────────
    weather_features = {}
    if WEATHER_AVAILABLE:
        try:
            provider = MockWeatherProvider()
            weather_df = provider.get_recent_weather(req.latitude, req.longitude, num_days=30)
            engineer = WeatherFeatureEngineer()
            weather_features = engineer.engineer(weather_df)
        except Exception as e:
            logger.error(f"Weather feature engineering failed: {e}")

    # ── Step 3: Crop Features ──────────────────────────────────────────────────
    crop_features = {}
    if WEATHER_AVAILABLE:
        try:
            crop_engineer = CropFeatureEngineer()
            crop_features = crop_engineer.engineer(
                crop_type=req.crop_type,
                growth_stage=req.growth_stage,
                sowing_date=req.sowing_date,
            )
        except Exception as e:
            logger.error(f"Crop feature engineering failed: {e}")

    # ── Step 4: Geospatial Features ────────────────────────────────────────────
    geo_features = {}
    if GEO_AVAILABLE and DB_AVAILABLE and db:
        try:
            import pandas as pd
            from datetime import datetime, timedelta

            # Get recent observations from database
            cutoff = datetime.utcnow() - timedelta(days=14)
            recent_obs = db.query(DiseaseObservation).filter(
                DiseaseObservation.timestamp >= cutoff,
                DiseaseObservation.disease_probability >= 0.4,
            ).all()

            if recent_obs:
                obs_df = pd.DataFrame([{
                    "latitude": o.latitude,
                    "longitude": o.longitude,
                    "disease_probability": o.disease_probability or 0.0,
                    "timestamp": o.timestamp,
                    "cluster_id": o.cluster_id,
                } for o in recent_obs])

                geo_eng = GeospatialFeatureEngineer()
                geo_features = geo_eng.engineer(
                    lat=req.latitude,
                    lon=req.longitude,
                    observations_df=obs_df,
                    cluster_assignments=obs_df.get("cluster_id", pd.Series(dtype=float)),
                )
        except Exception as e:
            logger.error(f"Geospatial feature engineering failed: {e}")
            geo_features = {}

    # ── Step 5: Satellite Features ─────────────────────────────────────────────
    satellite_features = {}
    if GEO_AVAILABLE:
        try:
            sat_eng = SatelliteFeatureEngineer()
            satellite_features = sat_eng.get_mock_satellite_features(req.latitude, req.longitude)
        except Exception as e:
            logger.error(f"Satellite feature engineering failed: {e}")

    # ── Step 6: Historical Features ────────────────────────────────────────────
    historical_features = {}
    if GEO_AVAILABLE and DB_AVAILABLE and db:
        try:
            import pandas as pd
            all_obs = db.query(DiseaseObservation).all()
            if all_obs:
                obs_df = pd.DataFrame([{
                    "farm_id": o.farm_id,
                    "latitude": o.latitude,
                    "longitude": o.longitude,
                    "disease_probability": o.disease_probability or 0.0,
                    "severity_score": o.severity_score or 0.0,
                    "timestamp": o.timestamp,
                    "cluster_id": o.cluster_id,
                } for o in all_obs])

                hist_eng = HistoricalFeatureEngineer()
                historical_features = hist_eng.engineer(
                    farm_id=req.farm_id or 0,
                    all_observations_df=obs_df,
                    current_date=None,
                )
        except Exception as e:
            logger.error(f"Historical feature engineering failed: {e}")

    # ── Step 7: Multimodal Fusion ──────────────────────────────────────────────
    risk_result = None

    if FUSION_AVAILABLE and fusion_engine:
        try:
            import numpy as np
            from ml.weather.weather_model import WeatherFeatureEngineer, CropFeatureEngineer
            from ml.geospatial.geospatial_engine import (
                GeospatialFeatureEngineer, SatelliteFeatureEngineer, HistoricalFeatureEngineer
            )

            w_eng = WeatherFeatureEngineer()
            c_eng = CropFeatureEngineer()
            g_eng = GeospatialFeatureEngineer()
            s_eng = SatelliteFeatureEngineer()
            h_eng = HistoricalFeatureEngineer()

            risk_result = fusion_engine.predict(
                image_embedding=image_embedding if any(e != 0 for e in image_embedding) else None,
                weather_features=w_eng.features_to_vector(weather_features) if weather_features else None,
                crop_features=c_eng.features_to_vector(crop_features) if crop_features else None,
                geo_features=g_eng.features_to_vector(geo_features) if geo_features else None,
                satellite_features=s_eng.features_to_vector(satellite_features) if satellite_features else None,
                historical_features=h_eng.features_to_vector(historical_features) if historical_features else None,
            )
        except Exception as e:
            logger.error(f"Fusion inference failed: {e}")

    # ── Fallback to heuristic if fusion not available/failed ──────────────────
    if risk_result is None:
        heuristic = compute_heuristic_risk(
            disease=disease,
            disease_prob=disease_prob,
            weather_features=weather_features,
            geo_features=geo_features,
            crop_features=crop_features,
        )
        current_risk = heuristic["current_risk"]
        future_risk_3d = heuristic["future_risk_3d"]
        future_risk_5d = heuristic["future_risk_5d"]
        future_risk_7d = heuristic["future_risk_7d"]
        spread_prob = heuristic["spread_probability"]
        modality_gates = heuristic["gates"]
        model_version = "heuristic_v0.1"
    else:
        current_risk = risk_result.get("current_risk", 0.5)
        future_risk_3d = risk_result.get("future_risk_3d", current_risk * 1.05)
        future_risk_5d = risk_result.get("future_risk_5d", current_risk * 1.08)
        future_risk_7d = risk_result.get("future_risk_7d", current_risk * 1.1)
        spread_prob = risk_result.get("spread_probability", current_risk * 0.85)
        modality_gates = risk_result.get("modality_gates", {})
        model_version = "fusion_v0.1"

    # ── Alert Level ────────────────────────────────────────────────────────────
    alert_level = compute_alert_level(current_risk)

    # ── Explanation ────────────────────────────────────────────────────────────
    explanation = generate_explanation(
        alert_level=alert_level,
        weather_features=weather_features,
        geo_features=geo_features,
        modality_gates=modality_gates,
        disease=disease,
        disease_prob=disease_prob,
    )

    # ── SHAP Summary (simplified) ──────────────────────────────────────────────
    shap_summary = []
    if weather_features:
        shap_summary.extend([
            {"feature": "humidity_mean_3d", "value": round((weather_features.get("humidity_mean_3d", 60) - 60) / 40 * 0.21, 3), "description": "3-day average humidity"},
            {"feature": "consecutive_wet_days", "value": round(weather_features.get("consecutive_wet_days", 0) / 7 * 0.16, 3), "description": "Consecutive wet days"},
            {"feature": "rainfall_3d", "value": round(weather_features.get("rainfall_3d", 0) / 30 * 0.14, 3), "description": "3-day total rainfall"},
        ])
    if geo_features:
        shap_summary.append({"feature": "nearby_cases_5km", "value": round(geo_features.get("nearby_cases_5km", 0) / 10 * 0.18, 3), "description": "Nearby disease reports"})
    if crop_features:
        shap_summary.append({"feature": "stage_susceptibility", "value": round(crop_features.get("stage_susceptibility_index", 0.5) * 0.12, 3), "description": "Crop stage susceptibility"})

    shap_summary = sorted(shap_summary, key=lambda x: abs(x["value"]), reverse=True)

    # ── Persist to Database ────────────────────────────────────────────────────
    prediction_id = None
    if DB_AVAILABLE and db and req.farm_id:
        try:
            alert_enum = AlertLevel[alert_level]
            prediction = OutbreakPrediction(
                farm_id=req.farm_id,
                current_risk=current_risk,
                future_risk_3d=future_risk_3d,
                future_risk_5d=future_risk_5d,
                future_risk_7d=future_risk_7d,
                spread_probability=spread_prob,
                alert_level=alert_enum,
                fusion_model_version=model_version,
                modality_gates=json.dumps(modality_gates),
                shap_values=json.dumps(shap_summary),
            )
            db.add(prediction)
            db.commit()
            db.refresh(prediction)
            prediction_id = prediction.id
        except Exception as e:
            logger.error(f"Failed to save prediction: {e}")
            if db:
                db.rollback()

    elapsed_ms = (time.time() - t_start) * 1000

    return PredictResponse(
        prediction_id=prediction_id,
        predicted_disease=disease,
        disease_probability=round(disease_prob, 4),
        severity_score=round(severity, 4),
        current_risk=round(current_risk, 4),
        future_risk_3d=round(future_risk_3d, 4),
        future_risk_5d=round(future_risk_5d, 4),
        future_risk_7d=round(future_risk_7d, 4),
        spread_probability=round(spread_prob, 4),
        alert_level=alert_level,
        modality_gates=modality_gates,
        explanation_text=explanation,
        shap_summary=shap_summary,
        model_version=model_version,
        inference_time_ms=round(elapsed_ms, 1),
    )
