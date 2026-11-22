from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ClusterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    center_latitude: float
    center_longitude: float
    radius_km: float
    num_cases: int
    primary_disease: str
    current_risk: float
    growth_rate: float
    alert_level: str
    first_observed: datetime
    last_updated: datetime

class DashboardData(BaseModel):
    total_farms: int
    active_observations: int
    active_clusters: int
    high_risk_farms: int
    outbreak_trend: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    clusters: List[ClusterOut]
