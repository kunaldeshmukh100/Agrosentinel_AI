"""
AgroSentinel AI — Farm Management Routes
"""
import sys
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

from database import get_db
from database.models import Farm, User, OutbreakPrediction, AlertLevel

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)


class FarmCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    area_hectares: Optional[float] = None
    crop_type: str = "tomato"
    variety: Optional[str] = None
    sowing_date: Optional[str] = None
    growth_stage: str = "vegetative"


class FarmOut(BaseModel):
    id: int
    owner_id: int
    name: str
    latitude: float
    longitude: float
    area_hectares: Optional[float]
    crop_type: str
    variety: Optional[str]
    growth_stage: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


def get_user_from_token(credentials, db):
    if credentials is None:
        return None
    try:
        from core.auth import get_current_user_from_db
        return get_current_user_from_db(credentials.credentials, db)
    except Exception:
        return None


@router.post("/", response_model=FarmOut, status_code=201)
def create_farm(
    farm_data: FarmCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Create a new farm record."""
    user = get_user_from_token(credentials, db)
    owner_id = user.id if user else 1  # Default to first user for demo

    farm = Farm(
        owner_id=owner_id,
        name=farm_data.name,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        area_hectares=farm_data.area_hectares,
        crop_type=farm_data.crop_type,
        variety=farm_data.variety,
        growth_stage=farm_data.growth_stage,
    )
    if farm_data.sowing_date:
        try:
            farm.sowing_date = datetime.fromisoformat(farm_data.sowing_date)
        except ValueError:
            pass

    db.add(farm)
    db.commit()
    db.refresh(farm)
    logger.info(f"Farm created: {farm.name} (id: {farm.id})")
    return farm


@router.get("/", response_model=List[FarmOut])
def list_farms(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """List farms. Officers see all; farmers see their own."""
    user = get_user_from_token(credentials, db)
    
    if user and user.role.value in ("OFFICER", "ADMIN"):
        farms = db.query(Farm).filter(Farm.is_active == True).all()
    elif user:
        farms = db.query(Farm).filter(Farm.owner_id == user.id, Farm.is_active == True).all()
    else:
        farms = db.query(Farm).filter(Farm.is_active == True).limit(20).all()
    
    return farms


@router.get("/{farm_id}")
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    """Get farm details including latest risk score."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Get latest prediction
    latest_prediction = (
        db.query(OutbreakPrediction)
        .filter(OutbreakPrediction.farm_id == farm_id)
        .order_by(OutbreakPrediction.created_at.desc())
        .first()
    )
    
    result = {
        "id": farm.id,
        "name": farm.name,
        "owner_id": farm.owner_id,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "crop_type": farm.crop_type,
        "growth_stage": farm.growth_stage,
        "area_hectares": farm.area_hectares,
        "created_at": farm.created_at.isoformat(),
        "latest_risk": None,
    }
    
    if latest_prediction:
        result["latest_risk"] = {
            "current_risk": latest_prediction.current_risk,
            "future_risk_3d": latest_prediction.future_risk_3d,
            "future_risk_7d": latest_prediction.future_risk_7d,
            "alert_level": latest_prediction.alert_level.value,
            "created_at": latest_prediction.created_at.isoformat(),
        }
    
    return result


@router.get("/{farm_id}/risk")
def get_farm_risk(farm_id: int, db: Session = Depends(get_db)):
    """Get the latest outbreak risk prediction for a specific farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    prediction = (
        db.query(OutbreakPrediction)
        .filter(OutbreakPrediction.farm_id == farm_id)
        .order_by(OutbreakPrediction.created_at.desc())
        .first()
    )
    
    if not prediction:
        return {"farm_id": farm_id, "message": "No predictions yet. Submit an observation first."}
    
    return {
        "farm_id": farm_id,
        "current_risk": prediction.current_risk,
        "future_risk_3d": prediction.future_risk_3d,
        "future_risk_5d": prediction.future_risk_5d,
        "future_risk_7d": prediction.future_risk_7d,
        "spread_probability": prediction.spread_probability,
        "alert_level": prediction.alert_level.value,
        "cluster_id": prediction.cluster_id,
        "model_version": prediction.fusion_model_version,
        "created_at": prediction.created_at.isoformat(),
    }
