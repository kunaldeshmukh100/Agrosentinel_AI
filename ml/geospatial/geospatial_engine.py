"""
AgroSentinel AI — Geospatial Engine
Using DBSCAN for spatial clustering and GeoPandas/Shapely for spatial calculations.
"""
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Optional, Tuple, Any
import logging
import math
from math import radians, cos, sin, asin, sqrt
from datetime import datetime

logger = logging.getLogger(__name__)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Return distance in kilometers between two GPS points.
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371.0 # Radius of earth in kilometers
    return c * r

class SpatialClusterDetector:
    def __init__(self, eps_km: float = 5.0, min_samples: int = 3, min_disease_prob: float = 0.4):
        self.eps_km = eps_km
        self.min_samples = min_samples
        self.min_disease_prob = min_disease_prob
        self.earth_radius_km = 6371.0

    def fit_predict(self, observations_df: pd.DataFrame) -> pd.DataFrame:
        """
        Input df needs: latitude, longitude, disease_probability, timestamp columns
        Filter by min_disease_prob before clustering
        Convert km to radians for DBSCAN haversine metric
        Return df with cluster_id (-1 means noise/no cluster)
        """
        try:
            if observations_df.empty:
                logger.warning("Empty dataframe provided to fit_predict")
                observations_df['cluster_id'] = []
                return observations_df
            
            # Filter low-confidence observations
            df = observations_df[observations_df['disease_probability'] >= self.min_disease_prob].copy()
            if df.empty:
                return df
                
            coords = np.radians(df[['latitude', 'longitude']].values)
            
            # DBSCAN using haversine metric
            eps_radians = self.eps_km / self.earth_radius_km
            db = DBSCAN(eps=eps_radians, min_samples=self.min_samples, algorithm='ball_tree', metric='haversine')
            
            df['cluster_id'] = db.fit_predict(coords)
            
            return df
        except Exception as e:
            logger.error(f"Error in fit_predict: {str(e)}")
            observations_df['cluster_id'] = -1
            return observations_df

    def get_cluster_stats(self, clustered_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        For each cluster (excluding -1):
        - cluster_id, num_cases, center_lat, center_lon, radius_km
        - primary_disease (most common), avg_disease_probability
        - growth_rate: cases per day (using timestamp range)
        - first_observed, last_updated
        """
        stats = []
        try:
            if clustered_df.empty or 'cluster_id' not in clustered_df.columns:
                return stats
                
            clusters = clustered_df[clustered_df['cluster_id'] != -1]
            if clusters.empty:
                return stats
                
            for cluster_id, group in clusters.groupby('cluster_id'):
                try:
                    timestamps = pd.to_datetime(group['timestamp'])
                    first_observed = timestamps.min()
                    last_updated = timestamps.max()
                    days = (last_updated - first_observed).days
                    growth_rate = len(group) / (days if days > 0 else 1)
                except Exception:
                    first_observed = None
                    last_updated = None
                    growth_rate = 0.0
                    
                center_lat = group['latitude'].mean()
                center_lon = group['longitude'].mean()
                
                # Calculate radius
                max_dist = 0
                for _, row in group.iterrows():
                    d = haversine_distance(center_lat, center_lon, row['latitude'], row['longitude'])
                    if d > max_dist:
                        max_dist = d
                
                primary_disease = group['disease_type'].mode().iloc[0] if 'disease_type' in group.columns and not group['disease_type'].empty else "Unknown"
                
                stats.append({
                    'cluster_id': cluster_id,
                    'num_cases': len(group),
                    'center_lat': center_lat,
                    'center_lon': center_lon,
                    'radius_km': max_dist,
                    'primary_disease': primary_disease,
                    'avg_disease_probability': group['disease_probability'].mean(),
                    'growth_rate': growth_rate,
                    'first_observed': first_observed,
                    'last_updated': last_updated
                })
        except Exception as e:
            logger.error(f"Error computing cluster stats: {str(e)}")
        return stats

class GeospatialFeatureEngineer:
    def engineer(
        self,
        lat: float,
        lon: float,
        observations_df: pd.DataFrame,
        cluster_assignments=None,  # pd.Series or pd.DataFrame or None
    ) -> Dict[str, float]:
        """
        Compute location-based features for the ML model.
        cluster_assignments can be a Series of cluster IDs aligned to observations_df,
        or a DataFrame with 'cluster_id', 'latitude', 'longitude' columns.
        """
        nearby_cases_5km = 0
        nearby_cases_10km = 0
        nearest_infected_km = float('inf')

        if observations_df is not None and not observations_df.empty:
            for _, row in observations_df.iterrows():
                d = haversine_distance(lat, lon, row['latitude'], row['longitude'])
                if d <= 5.0:
                    nearby_cases_5km += 1
                if d <= 10.0:
                    nearby_cases_10km += 1
                prob = row.get('disease_probability', 0) if hasattr(row, 'get') else row['disease_probability'] if 'disease_probability' in row else 0
                if prob > 0.5 and d < nearest_infected_km:
                    nearest_infected_km = d

        if nearest_infected_km == float('inf'):
            nearest_infected_km = 999.0

        area_10km = math.pi * (10.0 ** 2)
        local_disease_density = nearby_cases_10km / area_10km

        in_active_cluster = 0.0
        cluster_growth_rate = 0.0

        # Handle cluster_assignments as DataFrame (with lat/lon) or Series (of cluster IDs)
        if cluster_assignments is not None:
            if isinstance(cluster_assignments, pd.DataFrame) and not cluster_assignments.empty:
                # DataFrame with cluster_id, latitude, longitude columns
                for _, row in cluster_assignments.iterrows():
                    if row.get('cluster_id', -1) != -1:
                        d = haversine_distance(lat, lon, row.get('latitude', lat), row.get('longitude', lon))
                        if d <= 1.0:
                            in_active_cluster = 1.0
                            break
            elif isinstance(cluster_assignments, pd.Series) and not cluster_assignments.empty:
                # Series of cluster IDs — check if any are non-noise
                if (cluster_assignments != -1).any():
                    in_active_cluster = 1.0  # Simplified: any active cluster nearby
                        
        return {
            'nearby_cases_5km': float(nearby_cases_5km),
            'nearby_cases_10km': float(nearby_cases_10km),
            'local_disease_density': float(local_disease_density),
            'nearest_infected_km': float(nearest_infected_km),
            'in_active_cluster': float(in_active_cluster),
            'cluster_growth_rate': float(cluster_growth_rate)
        }

    def features_to_vector(self, features: Dict[str, float]) -> np.ndarray:
        ordered = [
            features.get('nearby_cases_5km', 0.0),
            features.get('nearby_cases_10km', 0.0),
            features.get('local_disease_density', 0.0),
            features.get('nearest_infected_km', 0.0),
            features.get('in_active_cluster', 0.0),
            features.get('cluster_growth_rate', 0.0)
        ]
        return np.array(ordered, dtype=np.float32)

class SatelliteFeatureEngineer:
    def engineer(self, ndvi: float, ndwi: float, evi: float, ndvi_7d_change: float, ndvi_14d_change: float) -> Dict[str, float]:
        vegetation_anomaly = ndvi - 0.6
        return {
            'ndvi_current': float(ndvi),
            'ndwi_current': float(ndwi),
            'evi_current': float(evi),
            'ndvi_7d_change': float(ndvi_7d_change),
            'ndvi_14d_change': float(ndvi_14d_change),
            'vegetation_anomaly': float(vegetation_anomaly)
        }

    def get_mock_satellite_features(self, lat: float, lon: float, date: Optional[str] = None) -> Dict[str, float]:
        seed = int((lat + lon) * 1000)
        np.random.seed(seed)
        
        ndvi = float(np.clip(np.random.normal(0.5, 0.2), -1.0, 1.0))
        ndwi = float(np.clip(np.random.normal(0.2, 0.1), -1.0, 1.0))
        evi = float(np.clip(np.random.normal(0.4, 0.15), -1.0, 1.0))
        ndvi_7d = float(np.random.normal(0.0, 0.05))
        ndvi_14d = float(np.random.normal(0.0, 0.08))
        
        return self.engineer(ndvi, ndwi, evi, ndvi_7d, ndvi_14d)

    def features_to_vector(self, features: Dict[str, float]) -> np.ndarray:
        ordered = [
            features.get('ndvi_current', 0.0),
            features.get('ndwi_current', 0.0),
            features.get('evi_current', 0.0),
            features.get('ndvi_7d_change', 0.0),
            features.get('ndvi_14d_change', 0.0),
            features.get('vegetation_anomaly', 0.0)
        ]
        return np.array(ordered, dtype=np.float32)

class HistoricalFeatureEngineer:
    def engineer(self, farm_id, all_observations_df: pd.DataFrame, current_date=None) -> Dict[str, float]:
        historical_case_count = 0
        historical_outbreak_frequency = 0.0
        seasonal_risk_score = 0.0
        days_since_last_outbreak = 999.0
        previous_max_severity = 0.0

        # Handle None current_date gracefully
        if current_date is None:
            current_date = datetime.utcnow()

        month = current_date.month
        if 7 <= month <= 9:
            seasonal_risk_score = 0.9
        elif 6 <= month <= 10:
            seasonal_risk_score = 0.6
        else:
            seasonal_risk_score = 0.2
            
        if not all_observations_df.empty:
            historical_case_count = len(all_observations_df)
            if 'severity' in all_observations_df.columns:
                previous_max_severity = all_observations_df['severity'].max()
                if pd.isna(previous_max_severity):
                    previous_max_severity = 0.0
                    
            if 'timestamp' in all_observations_df.columns:
                timestamps = pd.to_datetime(all_observations_df['timestamp'])
                if not timestamps.empty:
                    last_date = timestamps.max()
                    days = (current_date - last_date).days
                    days_since_last_outbreak = float(max(0, days))
                    
                    years = max(1, (timestamps.max() - timestamps.min()).days / 365.25)
                    historical_outbreak_frequency = float(historical_case_count / years)
                    
        return {
            'historical_case_count': float(historical_case_count),
            'historical_outbreak_frequency': float(historical_outbreak_frequency),
            'seasonal_risk_score': float(seasonal_risk_score),
            'days_since_last_outbreak': float(days_since_last_outbreak),
            'previous_max_severity': float(previous_max_severity)
        }

    def features_to_vector(self, features: Dict[str, float]) -> np.ndarray:
        ordered = [
            features.get('historical_case_count', 0.0),
            features.get('historical_outbreak_frequency', 0.0),
            features.get('seasonal_risk_score', 0.0),
            features.get('days_since_last_outbreak', 0.0),
            features.get('previous_max_severity', 0.0)
        ]
        return np.array(ordered, dtype=np.float32)
