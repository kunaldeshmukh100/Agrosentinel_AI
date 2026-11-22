import os
import uuid
import sys
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.security import HTTPBearer
from typing import Optional, List

project_root = Path(__file__).parent.parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

router = APIRouter()
security = HTTPBearer()

UPLOAD_DIR = Path("./data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

@router.post('/')
async def create_observation(
    farm_id: int = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    notes: str = Form(""),
    image: Optional[UploadFile] = File(None),
    token: str = Depends(security)
):
    """Submit a new disease observation."""
    try:
        image_path = None
        if image:
            if image.size and image.size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large")
            
            ext = image.filename.split('.')[-1].lower()
            if ext not in ['jpg', 'jpeg', 'png']:
                raise HTTPException(status_code=400, detail="Invalid extension")
                
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = UPLOAD_DIR / filename
            content = await image.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large")
            with open(filepath, "wb") as f:
                f.write(content)
            image_path = str(filepath)
            
        return {"id": 1, "message": "Observation submitted", "image_path": image_path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/')
def list_observations(
    farm_id: Optional[int] = None,
    disease: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_probability: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
    token: str = Depends(security)
):
    """List observations (paginated)."""
    return []

@router.get('/{obs_id}')
def get_observation(obs_id: int, token: str = Depends(security)):
    """Get specific observation details."""
    return {"id": obs_id, "details": "Observation details"}
