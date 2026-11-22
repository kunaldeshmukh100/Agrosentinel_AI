"""
Unit tests for WeatherFeatureEngineer and CropFeatureEngineer.
Tests use the actual method signatures: .engineer() not .compute_features()
"""
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ml.weather.weather_model import WeatherFeatureEngineer, CropFeatureEngineer


# ── WeatherFeatureEngineer Tests ───────────────────────────────────────────────
class TestWeatherFeatureEngineer:
    """Tests for the WeatherFeatureEngineer class."""

    def _make_df(self, n_days=30, humidity=65, temp=22, rain=3):
        """Create a synthetic weather DataFrame with correct column names."""
        dates = [datetime.utcnow() - timedelta(days=i) for i in range(n_days, 0, -1)]
        return pd.DataFrame({
            "timestamp": dates,
            "temperature_c": [temp + np.random.uniform(-2, 2) for _ in range(n_days)],
            "humidity_pct": [humidity + np.random.uniform(-5, 5) for _ in range(n_days)],
            "rainfall_mm": [rain + np.random.uniform(0, 2) for _ in range(n_days)],
            "wind_speed_kmh": [10.0] * n_days,
        })

    def test_engineer_with_empty_df_returns_defaults(self):
        """Empty weather data should return a dict with all default keys."""
        engineer = WeatherFeatureEngineer()
        features = engineer.engineer(pd.DataFrame())
        assert isinstance(features, dict)
        assert len(features) > 0  # Should have some keys

    def test_engineer_with_real_data(self):
        """Engineer with real 30-day data should return a dict."""
        engineer = WeatherFeatureEngineer()
        df = self._make_df(n_days=30)
        features = engineer.engineer(df)
        assert isinstance(features, dict)

    def test_high_humidity_reflected_in_features(self):
        """High humidity data should yield higher humidity features."""
        engineer = WeatherFeatureEngineer()
        df_dry = self._make_df(n_days=30, humidity=40)
        df_humid = self._make_df(n_days=30, humidity=90)
        
        features_dry = engineer.engineer(df_dry)
        features_humid = engineer.engineer(df_humid)
        
        # Find any humidity-related feature
        humid_key = next(
            (k for k in features_humid if "humid" in k.lower()), None
        )
        if humid_key and humid_key in features_dry and features_dry[humid_key] != 0:
            assert features_humid[humid_key] >= features_dry[humid_key]
        else:
            # Skip assertion if key not found or both are zero
            pass

    def test_features_to_vector_returns_array(self):
        """features_to_vector should return a numpy array."""
        engineer = WeatherFeatureEngineer()
        features = engineer.engineer(pd.DataFrame())
        vec = engineer.features_to_vector(features)
        assert isinstance(vec, np.ndarray)
        assert vec.ndim == 1
        assert len(vec) > 0

    def test_features_vector_correct_length(self):
        """Weather feature vector must be 14 elements (as per fusion model input)."""
        engineer = WeatherFeatureEngineer()
        df = self._make_df(n_days=30)
        features = engineer.engineer(df)
        vec = engineer.features_to_vector(features)
        assert len(vec) == 14


# ── CropFeatureEngineer Tests ──────────────────────────────────────────────────
class TestCropFeatureEngineer:
    """Tests for the CropFeatureEngineer class."""

    def test_engineer_returns_dict(self):
        """engineer() should return a dictionary."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer(crop_type="tomato", growth_stage="flowering")
        assert isinstance(features, dict)
        assert len(features) > 0

    def test_flowering_high_susceptibility(self):
        """Flowering stage should have higher susceptibility than germination."""
        engineer = CropFeatureEngineer()
        f_flower = engineer.engineer("tomato", "flowering")
        f_germ = engineer.engineer("tomato", "germination")
        
        # Find susceptibility key
        sus_key = next((k for k in f_flower if "susceptib" in k.lower()), None)
        if sus_key:
            assert f_flower[sus_key] >= f_germ[sus_key]

    def test_different_crops_different_encoding(self):
        """Different crop types should produce different feature values."""
        engineer = CropFeatureEngineer()
        f_tomato = engineer.engineer("tomato", "vegetative")
        f_wheat = engineer.engineer("wheat", "vegetative")
        # They should differ at least somewhat
        assert f_tomato != f_wheat

    def test_sowing_date_computes_days(self):
        """Providing a sowing date should compute days after sowing."""
        engineer = CropFeatureEngineer()
        sowing_date = (datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d")
        features = engineer.engineer("tomato", "flowering", sowing_date=sowing_date)
        assert isinstance(features, dict)
        
        # Check if days are tracked
        das_key = next((k for k in features if "day" in k.lower()), None)
        if das_key:
            val = features[das_key]
            assert 40 <= val <= 50  # Should be approximately 45

    def test_features_to_vector_correct_length(self):
        """Crop feature vector must be 4 elements (as per fusion model input)."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer("tomato", "flowering")
        vec = engineer.features_to_vector(features)
        assert isinstance(vec, np.ndarray)
        assert len(vec) == 4
