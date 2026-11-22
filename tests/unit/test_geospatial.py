"""
Unit tests for geospatial engine using correct method signatures.
"""
import sys
from pathlib import Path
from datetime import datetime

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

import pytest
import numpy as np
import pandas as pd
from ml.geospatial.geospatial_engine import (
    haversine_distance,
    SpatialClusterDetector,
    GeospatialFeatureEngineer,
    SatelliteFeatureEngineer,
    HistoricalFeatureEngineer,
)


# ── Haversine Distance Tests ───────────────────────────────────────────────────
class TestHaversineDistance:
    def test_same_point_is_zero(self):
        """Distance from a point to itself should be zero."""
        dist = haversine_distance(20.0, 74.0, 20.0, 74.0)
        assert dist == pytest.approx(0.0, abs=0.001)

    def test_nashik_to_mumbai_approx_160km(self):
        """Nashik (20.0, 73.8) to Mumbai (19.08, 72.88) ≈ 155-170km."""
        # Nashik (approximate): 20.0, 73.8
        # Mumbai: 19.08, 72.88
        dist = haversine_distance(20.0, 73.8, 19.08, 72.88)
        assert 140 <= dist <= 200, f"Expected ~155-170km, got {dist:.1f}km"

    def test_distance_is_symmetric(self):
        """Distance A→B should equal distance B→A."""
        d1 = haversine_distance(20.0, 74.0, 19.0, 73.5)
        d2 = haversine_distance(19.0, 73.5, 20.0, 74.0)
        assert d1 == pytest.approx(d2, rel=0.01)

    def test_distance_is_non_negative(self):
        """Distance should always be non-negative."""
        dist = haversine_distance(20.0, 74.0, 18.0, 72.0)
        assert dist >= 0


# ── SpatialClusterDetector Tests ───────────────────────────────────────────────
class TestSpatialClusterDetector:
    def _make_obs_df(self, coords, probabilities=None):
        """Create a minimal observations DataFrame."""
        if probabilities is None:
            probabilities = [0.7] * len(coords)
        
        return pd.DataFrame({
            "latitude": [c[0] for c in coords],
            "longitude": [c[1] for c in coords],
            "disease_probability": probabilities,
            "timestamp": [datetime.utcnow()] * len(coords),
        })

    def test_clusters_formed_from_nearby_points(self):
        """10 tightly clustered points should form at least 1 cluster."""
        # 10 points within 1km of each other
        coords = [(20.0 + i * 0.005, 74.0 + i * 0.005) for i in range(10)]
        df = self._make_obs_df(coords)
        
        detector = SpatialClusterDetector(eps_km=3.0, min_samples=3)
        result_df = detector.fit_predict(df)
        
        assert "cluster_id" in result_df.columns
        cluster_ids = result_df["cluster_id"].unique()
        # At least one non-noise cluster
        valid_clusters = [c for c in cluster_ids if c != -1]
        assert len(valid_clusters) >= 1

    def test_isolated_points_are_noise(self):
        """Points far apart should all be labeled as noise (-1)."""
        # 4 points spread 100km apart
        coords = [
            (19.0, 72.0),
            (20.0, 73.0),
            (21.0, 74.0),
            (22.0, 75.0),
        ]
        df = self._make_obs_df(coords)
        
        detector = SpatialClusterDetector(eps_km=2.0, min_samples=3)
        result_df = detector.fit_predict(df)
        
        # All should be noise
        assert (result_df["cluster_id"] == -1).all()

    def test_returns_dataframe_with_cluster_id(self):
        """fit_predict should always return DataFrame with cluster_id column."""
        coords = [(20.0, 74.0)] * 5
        df = self._make_obs_df(coords)
        
        detector = SpatialClusterDetector()
        result = detector.fit_predict(df)
        
        assert isinstance(result, pd.DataFrame)
        assert "cluster_id" in result.columns

    def test_get_cluster_stats_returns_list(self):
        """get_cluster_stats should return a list of dicts."""
        coords = [(20.0 + i * 0.002, 74.0 + i * 0.002) for i in range(8)]
        df = self._make_obs_df(coords)
        
        detector = SpatialClusterDetector(eps_km=5.0, min_samples=3)
        clustered = detector.fit_predict(df)
        stats = detector.get_cluster_stats(clustered)
        
        assert isinstance(stats, list)


# ── GeospatialFeatureEngineer Tests ───────────────────────────────────────────
class TestGeospatialFeatureEngineer:
    def test_engineer_with_empty_observations(self):
        """engineer() with empty DataFrame should return dict with default values."""
        engineer = GeospatialFeatureEngineer()
        features = engineer.engineer(
            lat=20.0,
            lon=74.0,
            observations_df=pd.DataFrame(),
            cluster_assignments=pd.Series(dtype=float),
        )
        assert isinstance(features, dict)
        assert len(features) > 0

    def test_nearby_cases_count_correct(self):
        """Points within 5km should be counted as nearby cases."""
        engineer = GeospatialFeatureEngineer()
        
        # 5 points 1km away, 2 points 50km away
        nearby = [(20.005, 74.005)] * 5
        far = [(20.5, 74.5)] * 2
        all_coords = nearby + far
        
        obs_df = pd.DataFrame({
            "latitude": [c[0] for c in all_coords],
            "longitude": [c[1] for c in all_coords],
            "disease_probability": [0.8] * len(all_coords),
            "timestamp": [datetime.utcnow()] * len(all_coords),
            "cluster_id": [-1] * len(all_coords),
        })
        
        features = engineer.engineer(
            lat=20.0, lon=74.0,
            observations_df=obs_df,
            cluster_assignments=obs_df["cluster_id"],
        )
        
        nearby_count = features.get("nearby_cases_5km", 0)
        assert nearby_count >= 5  # At least the 5 close points

    def test_features_to_vector_length(self):
        """Geospatial feature vector must be 6 elements."""
        engineer = GeospatialFeatureEngineer()
        features = engineer.engineer(
            lat=20.0, lon=74.0,
            observations_df=pd.DataFrame(),
            cluster_assignments=pd.Series(dtype=float),
        )
        vec = engineer.features_to_vector(features)
        assert isinstance(vec, np.ndarray)
        assert len(vec) == 6


# ── SatelliteFeatureEngineer Tests ────────────────────────────────────────────
class TestSatelliteFeatureEngineer:
    def test_mock_features_returns_dict(self):
        """get_mock_satellite_features should return a dict."""
        engineer = SatelliteFeatureEngineer()
        features = engineer.get_mock_satellite_features(20.0, 74.0)
        assert isinstance(features, dict)

    def test_mock_features_has_required_keys(self):
        """Satellite features must include NDVI, NDWI, EVI, and change metrics."""
        engineer = SatelliteFeatureEngineer()
        features = engineer.get_mock_satellite_features(20.0, 74.0)
        
        required = ["ndvi_current", "ndwi_current", "evi_current",
                    "ndvi_7d_change", "ndvi_14d_change", "vegetation_anomaly"]
        for key in required:
            assert key in features, f"Missing key: {key}"

    def test_ndvi_in_valid_range(self):
        """NDVI should be between -1 and 1."""
        engineer = SatelliteFeatureEngineer()
        features = engineer.get_mock_satellite_features(20.0, 74.0)
        ndvi = features["ndvi_current"]
        assert -1.0 <= ndvi <= 1.0

    def test_features_to_vector_length(self):
        """Satellite feature vector must be 6 elements."""
        engineer = SatelliteFeatureEngineer()
        features = engineer.get_mock_satellite_features(20.0, 74.0)
        vec = engineer.features_to_vector(features)
        assert isinstance(vec, np.ndarray)
        assert len(vec) == 6

    def test_different_locations_different_features(self):
        """Different geographic locations should produce different features."""
        engineer = SatelliteFeatureEngineer()
        f1 = engineer.get_mock_satellite_features(20.0, 74.0)
        f2 = engineer.get_mock_satellite_features(18.5, 73.5)
        # At least one feature should differ
        assert any(f1[k] != f2[k] for k in f1 if k in f2)


# ── HistoricalFeatureEngineer Tests ───────────────────────────────────────────
class TestHistoricalFeatureEngineer:
    def test_features_with_no_history(self):
        """No historical data should return defaults with zeros."""
        engineer = HistoricalFeatureEngineer()
        features = engineer.engineer(
            farm_id=1,
            all_observations_df=pd.DataFrame(),
            current_date=datetime.utcnow(),
        )
        assert isinstance(features, dict)

    def test_features_vector_length(self):
        """Historical feature vector must be 5 elements."""
        engineer = HistoricalFeatureEngineer()
        features = engineer.engineer(
            farm_id=1,
            all_observations_df=pd.DataFrame(),
            current_date=datetime.utcnow(),
        )
        vec = engineer.features_to_vector(features)
        assert isinstance(vec, np.ndarray)
        assert len(vec) == 5
