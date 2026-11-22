import os
import sys

base_dir = r"c:\Users\kunal\OneDrive\Desktop\Machine Learning\agrosentinel-ai\apps\api\api\routes"
api_dir = r"c:\Users\kunal\OneDrive\Desktop\Machine Learning\agrosentinel-ai\apps\api\api"
os.makedirs(base_dir, exist_ok=True)

with open(os.path.join(api_dir, "__init__.py"), "w") as f:
    f.write("")

with open(os.path.join(base_dir, "__init__.py"), "w") as f:
    f.write("")

with open(os.path.join(base_dir, "health.py"), "w") as f:
    f.write('''from fastapi import APIRouter

router = APIRouter()

@router.get('/health')
def health_check():
    return {'status': 'healthy', 'service': 'AgroSentinel AI', 'version': '0.1.0'}
''')

with open(os.path.join(base_dir, "auth.py"), "w") as f:
    f.write('''from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

@router.post('/login')
def login(req: LoginRequest):
    return {"access_token": "dummy_token", "token_type": "bearer"}

@router.post('/register')
def register(req: RegisterRequest):
    return {"message": "User registered"}

@router.get('/me')
def me():
    return {"email": "user@example.com"}
''')

with open(os.path.join(base_dir, "farms.py"), "w") as f:
    f.write('''from fastapi import APIRouter
router = APIRouter()

@router.post('/')
def create_farm():
    return {"id": 1, "message": "Farm created"}

@router.get('/')
def list_farms():
    return []

@router.get('/{farm_id}')
def get_farm(farm_id: int):
    return {"id": farm_id}

@router.put('/{farm_id}')
def update_farm(farm_id: int):
    return {"id": farm_id, "message": "Updated"}

@router.delete('/{farm_id}')
def delete_farm(farm_id: int):
    return {"message": "Deleted"}

@router.get('/{farm_id}/risk')
def get_farm_risk(farm_id: int):
    return {"risk": 0.5}
''')

with open(os.path.join(base_dir, "observations.py"), "w") as f:
    f.write('''from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()

@router.post('/')
def create_observation(
    farm_id: int = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    notes: str = Form(""),
    image: Optional[UploadFile] = File(None)
):
    return {"id": 1}

@router.get('/')
def list_observations():
    return []

@router.get('/{obs_id}')
def get_observation(obs_id: int):
    return {"id": obs_id}
''')

with open(os.path.join(base_dir, "predict.py"), "w") as f:
    f.write('''from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter()

class PredictRequest(BaseModel):
    farm_id: int
    latitude: float
    longitude: float
    crop_type: str
    growth_stage: str
    sowing_date: str
    image_base64: Optional[str] = None
    notes: str = ""

@router.post('/')
def predict(req: PredictRequest):
    return {
        "predicted_disease": "late_blight",
        "disease_probability": 0.82,
        "severity_score": 0.61,
        "current_risk": 0.73,
        "future_risk_3d": 0.79,
        "future_risk_5d": 0.84,
        "future_risk_7d": 0.87,
        "spread_probability": 0.65,
        "alert_level": "ORANGE",
        "modality_gates": {"image": 0.21, "weather": 0.28},
        "explanation_text": "High outbreak risk because of dummy prediction...",
        "shap_summary": []
    }
''')

with open(os.path.join(base_dir, "outbreaks.py"), "w") as f:
    f.write('''from fastapi import APIRouter
router = APIRouter()

@router.get('/')
def list_outbreaks():
    return []

@router.get('/{cluster_id}')
def get_outbreak(cluster_id: int):
    return {"id": cluster_id}

@router.post('/detect')
def detect_outbreaks():
    return []
''')

with open(os.path.join(base_dir, "dashboard.py"), "w") as f:
    f.write('''from fastapi import APIRouter
router = APIRouter()

@router.get('/')
def dashboard():
    return {
        "total_farms": 100,
        "total_observations_7d": 50,
        "active_clusters": 2,
        "high_risk_farms": [],
        "outbreak_trend": [],
        "recent_alerts": [],
        "cluster_summary": [],
        "map_data": []
    }
''')

with open(os.path.join(base_dir, "demo.py"), "w") as f:
    f.write('''from fastapi import APIRouter
router = APIRouter()

@router.post('/start')
def start_demo():
    return {"session_id": "demo_1", "state": {}}

@router.post('/step')
def step_demo():
    return {"new_observations": [], "clusters": [], "risk_summary": {}, "alert_level": "GREEN", "narrative": "Advanced one day"}

@router.post('/what-if')
def what_if():
    return {"before_risk": 0.2, "after_risk": 0.5, "delta": 0.3}

@router.get('/scenario')
def scenario():
    return {}
''')
