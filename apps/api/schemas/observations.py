from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class ObservationCreate(BaseModel):
    farm_id: int
    latitude: float
    longitude: float
    notes: Optional[str] = None
    timestamp: datetime

class ObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    farm_id: int
    latitude: float
    longitude: float
    predicted_disease: Optional[str] = None
    disease_probability: Optional[float] = None
    severity_score: Optional[float] = None
    cluster_id: Optional[int] = None
    created_at: datetime

class PredictionRequest(BaseModel):
    farm_id: int
    latitude: float
    longitude: float
    crop_type: str
    growth_stage: str
    sowing_date: Optional[date] = None
    notes: Optional[str] = None

class PredictionResponse(BaseModel):
    predicted_disease: str
    disease_probability: float
    severity_score: float
    current_risk: float
    future_risk_3d: float
    future_risk_5d: float
    future_risk_7d: float
    spread_probability: float
    alert_level: str
    modality_gates: Dict[str, Any]
    explanation_text: str
    shap_summary: List[Dict[str, Any]]
