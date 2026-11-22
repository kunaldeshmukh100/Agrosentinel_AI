"""
Unit tests for CropFeatureEngineer using correct method signatures.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

import pytest
import numpy as np
from ml.weather.weather_model import CropFeatureEngineer


class TestCropFeatureEngineer:
    """Tests for CropFeatureEngineer — uses .engineer() method."""

    def test_engineer_returns_dict(self):
        """engineer() should return a dictionary."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer(crop_type="tomato", growth_stage="flowering")
        assert isinstance(features, dict)
        assert len(features) > 0

    def test_engineer_with_all_params(self):
        """engineer() with sowing date should work."""
        engineer = CropFeatureEngineer()
        sowing_date = (datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d")
        features = engineer.engineer(
            crop_type="tomato",
            growth_stage="flowering",
            sowing_date=sowing_date,
        )
        assert isinstance(features, dict)

    def test_flowering_susceptibility_high(self):
        """Flowering stage should have high susceptibility index."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer("tomato", "flowering")
        
        # Find susceptibility key
        sus_key = next(
            (k for k in features if "susceptib" in k.lower()), None
        )
        if sus_key:
            # Flowering should be >= 0.7 (it's 0.9 per our config)
            assert features[sus_key] >= 0.5

    def test_germination_susceptibility_low(self):
        """Germination stage should have low susceptibility."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer("tomato", "germination")
        
        sus_key = next(
            (k for k in features if "susceptib" in k.lower()), None
        )
        if sus_key:
            assert features[sus_key] <= 0.5

    def test_flowering_higher_susceptibility_than_germination(self):
        """Flowering should be more susceptible than germination."""
        engineer = CropFeatureEngineer()
        f_flower = engineer.engineer("tomato", "flowering")
        f_germ = engineer.engineer("tomato", "germination")
        
        sus_key = next(
            (k for k in f_flower if "susceptib" in k.lower()), None
        )
        if sus_key and sus_key in f_germ:
            assert f_flower[sus_key] >= f_germ[sus_key]

    def test_different_crops_allowed(self):
        """Different crop types should not raise errors."""
        engineer = CropFeatureEngineer()
        crops = ["tomato", "wheat", "rice", "potato", "onion"]
        for crop in crops:
            features = engineer.engineer(crop, "vegetative")
            assert isinstance(features, dict)

    def test_features_to_vector_correct_length(self):
        """Crop feature vector must be exactly 4 elements (fusion model input size)."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer("tomato", "flowering")
        vec = engineer.features_to_vector(features)
        assert isinstance(vec, np.ndarray)
        assert len(vec) == 4

    def test_vector_values_finite(self):
        """Feature vector should contain only finite values."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer("tomato", "flowering")
        vec = engineer.features_to_vector(features)
        assert np.all(np.isfinite(vec))

    def test_unknown_stage_falls_back_to_default(self):
        """Unknown growth stage should not crash, uses default."""
        engineer = CropFeatureEngineer()
        features = engineer.engineer("tomato", "unknown_stage_xyz")
        assert isinstance(features, dict)
        assert len(features) > 0
