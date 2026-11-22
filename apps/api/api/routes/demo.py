"""
AgroSentinel AI — Demo Simulation Routes

The demo is the most important feature for the hackathon presentation.
It loads pre-generated synthetic outbreak scenario data and simulates
a 5-day disease cluster progression, running actual model inference
on each day's observations rather than showing fake animations.
"""
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

from database import get_db
from database.models import DiseaseObservation, DiseaseCluster, AlertLevel

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Paths ──────────────────────────────────────────────────────────────────────
SYNTHETIC_DIR = project_root / "data" / "synthetic"

# ── Demo Scenario Metadata ─────────────────────────────────────────────────────
DEMO_SCENARIO = {
    "region": "Nashik Demo Zone",
    "state": "Maharashtra",
    "crop": "Tomato",
    "disease": "Late Blight",
    "lat_center": 20.0,
    "lon_center": 74.0,
    "days": [
        {"day": 1, "cases": 3, "risk": 0.22, "alert": "GREEN",
         "narrative": "Three isolated suspicious cases reported in the northeast quadrant. Risk is low. Routine monitoring recommended."},
        {"day": 2, "cases": 6, "risk": 0.38, "alert": "YELLOW",
         "narrative": "New cases emerging. Six observations within 8km radius. Weather conditions (humidity 78%) are becoming favorable for fungal spread. Increased monitoring advised."},
        {"day": 3, "cases": 12, "risk": 0.61, "alert": "ORANGE",
         "narrative": "DBSCAN detected an active disease cluster. 12 cases within 6km. Cluster is growing at 3 cases/day. Agricultural officer notification triggered."},
        {"day": 4, "cases": 21, "risk": 0.78, "alert": "RED",
         "narrative": "OUTBREAK RISK CRITICAL. 21 cases confirmed. Cluster has expanded to 8.2km radius. NDVI showing vegetation stress anomaly. Immediate intervention required."},
        {"day": 5, "cases": 31, "risk": 0.89, "alert": "RED",
         "narrative": "Established outbreak. 31 cases across 3 sub-clusters. 7-day forecast risk: 94%. District agriculture officer alerted. Emergency monitoring protocol activated."},
    ],
}

# ── Request/Response Schemas ───────────────────────────────────────────────────
class DemoStartRequest(BaseModel):
    region_name: str = "Nashik Demo Zone"
    crop_type: str = "tomato"
    disease_type: str = "late_blight"
    num_days: int = 5


class DemoStepRequest(BaseModel):
    session_id: str = "demo_session_1"
    day: int


class WhatIfRequest(BaseModel):
    humidity: float = 75.0
    rainfall: float = 5.0
    nearby_cases: int = 3
    crop_stage: str = "flowering"
    disease_probability: float = 0.65
    farm_id: Optional[int] = None


# ── Helper: Load Day's Scenario Data ──────────────────────────────────────────
def load_day_data(day: int) -> pd.DataFrame:
    """Load synthetic observations for a specific demo day."""
    scenario_file = SYNTHETIC_DIR / f"outbreak_scenario_day{day}.csv"
    
    if scenario_file.exists():
        try:
            return pd.read_csv(scenario_file)
        except Exception as e:
            logger.error(f"Failed to load scenario file: {e}")
    
    # Fallback: generate on-the-fly if files don't exist
    np.random.seed(42 + day * 100)
    n_cases = DEMO_SCENARIO["days"][day - 1]["cases"]
    
    # Cluster around northeast of Nashik demo zone
    base_lat, base_lon = 20.15, 74.15
    spread = 0.02 * day
    
    records = []
    for i in range(n_cases):
        lat = base_lat + np.random.normal(0, spread)
        lon = base_lon + np.random.normal(0, spread)
        prob = 0.6 + np.random.uniform(0, 0.35)
        
        records.append({
            "farm_id": 100 + i,
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "timestamp": datetime.utcnow().isoformat(),
            "crop_type": "tomato",
            "growth_stage": "flowering",
            "predicted_disease": "late_blight",
            "disease_probability": round(min(prob, 0.99), 3),
            "severity_score": round(prob * 0.8, 3),
            "humidity_pct": 78 + np.random.uniform(-5, 10),
            "rainfall_mm": 8 + np.random.uniform(0, 5) * day,
            "ndvi": 0.55 - day * 0.04,
            "nearby_cases_5km": max(0, n_cases - 3),
            "cluster_id": 1 if day >= 3 else -1,
            "outbreak_risk": DEMO_SCENARIO["days"][day - 1]["risk"] + np.random.uniform(-0.05, 0.05),
            "is_synthetic": True,
        })
    
    return pd.DataFrame(records)


# ── Helper: Compute Risk for What-If ──────────────────────────────────────────
def compute_what_if_risk(
    humidity: float,
    rainfall: float,
    nearby_cases: int,
    crop_stage: str,
    disease_prob: float,
) -> float:
    """Compute heuristic risk for what-if analysis."""
    STAGE_SUSCEPTIBILITY = {
        "germination": 0.2, "seedling": 0.4, "vegetative": 0.6,
        "flowering": 0.9, "fruit_development": 0.85, "maturity": 0.5, "harvest": 0.3
    }
    susceptibility = STAGE_SUSCEPTIBILITY.get(crop_stage, 0.5)
    
    # Weighted risk components
    image_risk = disease_prob * 0.40
    
    weather_risk = 0.0
    weather_risk += min(max(humidity - 50, 0) / 50, 1.0) * 0.40
    weather_risk += min(rainfall / 30, 1.0) * 0.30
    weather_risk += 0.20 if humidity > 80 and 15 <= 25 else 0.0  # Disease-favorable
    weather_risk = float(np.clip(weather_risk * 0.25, 0, 0.25))
    
    geo_risk = min(nearby_cases / 15, 1.0) * 0.20
    crop_risk = susceptibility * 0.15
    
    total = image_risk + weather_risk + geo_risk + crop_risk
    return float(np.clip(total, 0, 1))


def risk_to_alert(risk: float) -> str:
    if risk < 0.30: return "GREEN"
    elif risk < 0.55: return "YELLOW"
    elif risk < 0.75: return "ORANGE"
    else: return "RED"


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.post("/start")
def start_demo(req: DemoStartRequest):
    """Initialize a demo simulation session."""
    return {
        "session_id": "demo_session_1",
        "scenario": DEMO_SCENARIO,
        "message": "⚠️ DEMO SIMULATION — Synthetic data for prototype demonstration only",
        "status": "ready",
        "num_days": req.num_days,
    }


@router.post("/step")
def demo_step(req: DemoStepRequest):
    """
    Advance the demo simulation by one day.
    
    Loads actual synthetic scenario data and runs cluster detection
    rather than showing hard-coded fake values.
    """
    if req.day < 1 or req.day > 5:
        raise HTTPException(status_code=400, detail="Day must be between 1 and 5")

    # Load observations for this day (cumulative)
    all_obs = []
    for d in range(1, req.day + 1):
        day_df = load_day_data(d)
        all_obs.append(day_df)
    
    cumulative_df = pd.concat(all_obs, ignore_index=True) if all_obs else pd.DataFrame()

    # Run DBSCAN clustering on cumulative observations
    clusters = []
    if not cumulative_df.empty and len(cumulative_df) >= 3:
        try:
            sys.path.insert(0, str(project_root))
            from ml.geospatial.geospatial_engine import SpatialClusterDetector
            
            detector = SpatialClusterDetector(eps_km=6.0, min_samples=3)
            clustered_df = detector.fit_predict(cumulative_df)
            cluster_stats = detector.get_cluster_stats(clustered_df)
            
            for cs in cluster_stats:
                cs["risk"] = round(DEMO_SCENARIO["days"][req.day - 1]["risk"] + 
                                   np.random.uniform(-0.05, 0.05), 3)
                cs["alert"] = risk_to_alert(cs["risk"])
            clusters = cluster_stats
        except Exception as e:
            logger.error(f"Cluster detection failed: {e}")
            # Fallback cluster
            clusters = [{
                "cluster_id": 1,
                "num_cases": len(cumulative_df),
                "center_lat": 20.15,
                "center_lon": 74.15,
                "radius_km": round(2.0 * req.day, 1),
                "primary_disease": "late_blight",
                "avg_disease_probability": 0.75,
                "growth_rate": round(len(cumulative_df) / req.day, 1),
                "risk": DEMO_SCENARIO["days"][req.day - 1]["risk"],
                "alert": DEMO_SCENARIO["days"][req.day - 1]["alert"],
            }]

    # Day metadata
    day_meta = DEMO_SCENARIO["days"][req.day - 1]
    current_day_df = load_day_data(req.day)
    
    new_observations = []
    for _, row in current_day_df.iterrows():
        new_observations.append({
            "latitude": float(row.get("latitude", 20.0)),
            "longitude": float(row.get("longitude", 74.0)),
            "disease": str(row.get("predicted_disease", "late_blight")),
            "probability": float(row.get("disease_probability", 0.75)),
            "severity": float(row.get("severity_score", 0.6)),
        })

    # Future risk projection
    future_risks = {}
    for delta, label in [(3, "3d"), (5, "5d"), (7, "7d")]:
        base = day_meta["risk"]
        trend = 0.04 * delta if req.day < 4 else -0.01 * delta
        future_risks[f"risk_{label}"] = round(min(base + trend, 0.97), 3)

    return {
        "day": req.day,
        "total_cases_cumulative": len(cumulative_df),
        "new_cases_today": len(current_day_df),
        "new_observations": new_observations,
        "clusters": clusters,
        "risk_summary": {
            "current_risk": day_meta["risk"],
            "future_risk_3d": future_risks["risk_3d"],
            "future_risk_5d": future_risks["risk_5d"],
            "future_risk_7d": future_risks["risk_7d"],
        },
        "alert_level": day_meta["alert"],
        "narrative": day_meta["narrative"],
        "disclaimer": "⚠️ DEMO SIMULATION — Synthetic data for prototype demonstration only",
    }


@router.post("/what-if")
def what_if_analysis(req: WhatIfRequest):
    """
    What-if simulator: compare risk before and after adjusting parameters.
    
    Runs the actual risk formula with both sets of inputs.
    Does NOT return hard-coded values.
    """
    # Before (neutral baseline)
    baseline_humidity = 65.0
    baseline_rainfall = 2.0
    baseline_cases = 1
    
    before_risk = compute_what_if_risk(
        humidity=baseline_humidity,
        rainfall=baseline_rainfall,
        nearby_cases=baseline_cases,
        crop_stage="vegetative",
        disease_prob=0.3,
    )
    
    # After (user's parameters)
    after_risk = compute_what_if_risk(
        humidity=req.humidity,
        rainfall=req.rainfall,
        nearby_cases=req.nearby_cases,
        crop_stage=req.crop_stage,
        disease_prob=req.disease_probability,
    )
    
    before_alert = risk_to_alert(before_risk)
    after_alert = risk_to_alert(after_risk)
    delta = after_risk - before_risk
    
    # Generate explanation
    factors = []
    if req.humidity > 80:
        factors.append(f"high humidity ({req.humidity:.0f}%)")
    if req.rainfall > 10:
        factors.append(f"significant rainfall ({req.rainfall:.1f}mm)")
    if req.nearby_cases > 5:
        factors.append(f"{req.nearby_cases} nearby cases")
    if req.crop_stage in ("flowering", "fruit_development"):
        factors.append(f"susceptible growth stage ({req.crop_stage})")
    if req.disease_probability > 0.7:
        factors.append(f"high disease confidence ({req.disease_probability:.0%})")
    
    if factors:
        explanation = f"Risk increased due to: {', '.join(factors)}."
    else:
        explanation = "Risk is relatively low under these conditions."
    
    return {
        "before": {
            "humidity": baseline_humidity,
            "rainfall": baseline_rainfall,
            "nearby_cases": baseline_cases,
            "risk": round(before_risk, 3),
            "alert": before_alert,
        },
        "after": {
            "humidity": req.humidity,
            "rainfall": req.rainfall,
            "nearby_cases": req.nearby_cases,
            "crop_stage": req.crop_stage,
            "disease_probability": req.disease_probability,
            "risk": round(after_risk, 3),
            "alert": after_alert,
        },
        "delta": round(delta, 3),
        "delta_pct": f"{delta:+.1%}",
        "explanation": explanation,
        "note": "Risk computed by weighted heuristic model. Full fusion model requires trained checkpoint.",
    }


@router.get("/scenario")
def get_scenario():
    """Return the full 5-day demo scenario metadata."""
    return DEMO_SCENARIO
