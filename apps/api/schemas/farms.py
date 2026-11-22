from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class FarmCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    area_hectares: float
    crop_type: str
    variety: Optional[str] = None
    sowing_date: Optional[date] = None
    growth_stage: Optional[str] = None

class FarmOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    name: str
    latitude: float
    longitude: float
    crop_type: str
    variety: Optional[str] = None
    growth_stage: Optional[str] = None
    created_at: datetime

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_hectares: Optional[float] = None
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    sowing_date: Optional[date] = None
    growth_stage: Optional[str] = None
