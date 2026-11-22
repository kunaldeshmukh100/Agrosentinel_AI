from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DemoStartRequest(BaseModel):
    region_name: str
    crop_type: str
    disease_type: str
    num_days: int

class DemoStepRequest(BaseModel):
    session_id: str
    day: int

class DemoStepResponse(BaseModel):
    day: int
    new_observations: List[Dict[str, Any]]
    clusters: List[Dict[str, Any]]
    risk_summary: Dict[str, Any]
    alert_level: str
    narrative: str

class WhatIfRequest(BaseModel):
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    nearby_cases: Optional[int] = None
    crop_stage: Optional[str] = None
    disease_probability: Optional[float] = None
    farm_id: Optional[int] = None

class WhatIfResponse(BaseModel):
    before_risk: float
    after_risk: float
    before_alert: str
    after_alert: str
    delta: float
    explanation: str
