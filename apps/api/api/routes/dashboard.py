"""
AgroSentinel AI — Dashboard Route
Officer intelligence dashboard data endpoint.
"""
import sys
import logging
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

from database import get_db
from database.models import (
    Farm, DiseaseObservation, OutbreakPrediction, Alert, DiseaseCluster, AlertLevel
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):
    """
    Return comprehensive dashboard data for the agricultural officer view.
    
    Includes:
    - Summary statistics
    - Outbreak trend (last 14 days)
    - Active clusters
    - High-risk farms
    - Recent alerts
    - Map data (observations for map display)
    """
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    fourteen_days_ago = now - timedelta(days=14)

    # ── Summary Statistics ─────────────────────────────────────────────────────
    total_farms = db.query(Farm).filter(Farm.is_active == True).count()
    
    total_observations_7d = db.query(DiseaseObservation).filter(
        DiseaseObservation.timestamp >= seven_days_ago
    ).count()
    
    active_clusters = db.query(DiseaseCluster).filter(
        DiseaseCluster.is_active == True
    ).count()

    # ── High-Risk Farms ────────────────────────────────────────────────────────
    # Get latest prediction per farm
    high_risk_farms = []
    try:
        # Subquery: latest prediction per farm
        latest_preds = (
            db.query(
                OutbreakPrediction.farm_id,
                func.max(OutbreakPrediction.created_at).label("latest")
            )
            .group_by(OutbreakPrediction.farm_id)
            .subquery()
        )
        
        high_risk_data = (
            db.query(OutbreakPrediction, Farm)
            .join(
                latest_preds,
                (OutbreakPrediction.farm_id == latest_preds.c.farm_id) &
                (OutbreakPrediction.created_at == latest_preds.c.latest)
            )
            .join(Farm, Farm.id == OutbreakPrediction.farm_id)
            .filter(OutbreakPrediction.current_risk >= 0.55)
            .order_by(OutbreakPrediction.current_risk.desc())
            .limit(10)
            .all()
        )
        
        for pred, farm in high_risk_data:
            high_risk_farms.append({
                "farm_id": farm.id,
                "name": farm.name,
                "crop_type": farm.crop_type,
                "latitude": farm.latitude,
                "longitude": farm.longitude,
                "current_risk": round(pred.current_risk, 3),
                "alert_level": pred.alert_level.value,
            })
    except Exception as e:
        logger.error(f"Failed to get high-risk farms: {e}")

    # ── Outbreak Trend (14 days) ───────────────────────────────────────────────
    outbreak_trend = []
    try:
        for i in range(14, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            count = db.query(DiseaseObservation).filter(
                DiseaseObservation.timestamp >= day_start,
                DiseaseObservation.timestamp < day_end,
                DiseaseObservation.disease_probability >= 0.4,
            ).count()
            
            outbreak_trend.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "case_count": count,
            })
    except Exception as e:
        logger.error(f"Failed to compute outbreak trend: {e}")

    # ── Recent Alerts ──────────────────────────────────────────────────────────
    recent_alerts = []
    try:
        alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(10).all()
        for alert in alerts:
            recent_alerts.append({
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity.value,
                "message": alert.message,
                "farm_id": alert.farm_id,
                "is_read": alert.is_read,
                "created_at": alert.created_at.isoformat(),
            })
    except Exception as e:
        logger.error(f"Failed to get alerts: {e}")

    # ── Active Clusters ────────────────────────────────────────────────────────
    cluster_summary = []
    try:
        clusters = db.query(DiseaseCluster).filter(
            DiseaseCluster.is_active == True
        ).order_by(DiseaseCluster.current_risk.desc()).limit(20).all()
        
        for c in clusters:
            cluster_summary.append({
                "id": c.id,
                "center_lat": c.center_latitude,
                "center_lon": c.center_longitude,
                "radius_km": c.radius_km,
                "num_cases": c.num_cases,
                "primary_disease": c.primary_disease,
                "current_risk": round(c.current_risk or 0, 3),
                "growth_rate": round(c.growth_rate or 0, 2),
                "alert_level": c.alert_level.value,
                "last_updated": c.last_updated.isoformat() if c.last_updated else None,
            })
    except Exception as e:
        logger.error(f"Failed to get clusters: {e}")

    # ── Map Data (observations) ────────────────────────────────────────────────
    map_data = []
    try:
        recent_obs = db.query(DiseaseObservation).filter(
            DiseaseObservation.timestamp >= fourteen_days_ago
        ).order_by(DiseaseObservation.timestamp.desc()).limit(500).all()
        
        for obs in recent_obs:
            map_data.append({
                "id": obs.id,
                "farm_id": obs.farm_id,
                "latitude": obs.latitude,
                "longitude": obs.longitude,
                "disease": obs.predicted_disease or "unknown",
                "probability": round(obs.disease_probability or 0, 3),
                "severity": round(obs.severity_score or 0, 3),
                "cluster_id": obs.cluster_id,
                "timestamp": obs.timestamp.isoformat(),
            })
    except Exception as e:
        logger.error(f"Failed to get map data: {e}")

    return {
        "total_farms": total_farms,
        "total_observations_7d": total_observations_7d,
        "active_clusters": active_clusters,
        "high_risk_farm_count": len(high_risk_farms),
        "high_risk_farms": high_risk_farms,
        "outbreak_trend": outbreak_trend,
        "recent_alerts": recent_alerts,
        "cluster_summary": cluster_summary,
        "map_data": map_data,
        "generated_at": now.isoformat(),
    }
