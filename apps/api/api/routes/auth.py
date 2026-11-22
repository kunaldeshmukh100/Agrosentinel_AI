"""
AgroSentinel AI — Authentication Routes
Login, register, and user info endpoints.
"""
import sys
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Path setup
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

from database import get_db
from database.models import User, UserRole
from core.auth import hash_password, verify_password, create_access_token, decode_token

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)


# ── Request Schemas ────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""
    role: str = "FARMER"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    email: str
    role: str


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT token.
    
    Demo credentials:
    - farmer@demo.agrosentinel.ai / farmer123
    - officer@demo.agrosentinel.ai / officer123
    """
    user = db.query(User).filter(
        User.email == req.email,
        User.is_active == True
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({
        "sub": user.email,
        "role": user.role.value,
        "user_id": user.id,
    })

    logger.info(f"User logged in: {user.email} (role: {user.role.value})")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user. Default role is FARMER."""
    # Check duplicate email
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate role
    try:
        role = UserRole(req.role.upper())
    except ValueError:
        role = UserRole.FARMER

    new_user = User(
        name=req.name,
        email=req.email,
        phone=req.phone,
        hashed_password=hash_password(req.password),
        role=role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"New user registered: {new_user.email} (role: {role.value})")

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value,
    }


@router.get("/me")
def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Return the currently authenticated user's information."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    from core.auth import get_current_user_from_db
    user = get_current_user_from_db(credentials.credentials, db)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.value,
        "created_at": user.created_at.isoformat(),
    }
