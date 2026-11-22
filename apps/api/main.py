"""
AgroSentinel AI — Main FastAPI Application

This is the primary entry point for the backend API server.
It initializes the database, loads ML models, and mounts all routers.
"""

import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Internal imports
from database import init_db
from api.routes import auth, farms, observations, predict, outbreaks, dashboard, demo, health

# ── Logging Setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        # logging.FileHandler("./logs/agrosentinel.log"),  # Enable for production
    ],
)
logger = logging.getLogger("agrosentinel")

# ── Create required directories ────────────────────────────────────────────────
for directory in ["./data/uploads", "./logs", "./models/checkpoints", "./models/exported"]:
    Path(directory).mkdir(parents=True, exist_ok=True)


# ── Lifespan (startup/shutdown) ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ────────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("🌾 AgroSentinel AI Starting Up...")
    logger.info("=" * 60)

    # Initialize database
    logger.info("📊 Initializing database...")
    init_db()

    # Create demo users if database is fresh
    from database import SessionLocal
    from database.models import User, UserRole
    from core.auth import hash_password

    db = SessionLocal()
    try:
        existing_users = db.query(User).count()
        if existing_users == 0:
            logger.info("🌱 Creating demo users...")
            demo_users = [
                User(
                    name="Demo Farmer",
                    email="farmer@demo.agrosentinel.ai",
                    phone="+91-9000000001",
                    hashed_password=hash_password("farmer123"),
                    role=UserRole.FARMER,
                ),
                User(
                    name="Agricultural Officer",
                    email="officer@demo.agrosentinel.ai",
                    phone="+91-9000000002",
                    hashed_password=hash_password("officer123"),
                    role=UserRole.OFFICER,
                ),
                User(
                    name="Admin User",
                    email="admin@demo.agrosentinel.ai",
                    phone="+91-9000000003",
                    hashed_password=hash_password("admin123"),
                    role=UserRole.ADMIN,
                ),
            ]
            for user in demo_users:
                db.add(user)
            db.commit()
            logger.info("✅ Demo users created:")
            logger.info("   Farmer:  farmer@demo.agrosentinel.ai / farmer123")
            logger.info("   Officer: officer@demo.agrosentinel.ai / officer123")
    finally:
        db.close()

    # Load ML models (lazy-load, so this just initializes engine references)
    logger.info("🤖 ML engine initialized (models load on first request)")

    logger.info("=" * 60)
    logger.info("🚀 AgroSentinel AI is ready!")
    logger.info("📡 API Docs: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────────
    logger.info("🛑 AgroSentinel AI shutting down...")


# ── FastAPI Application ────────────────────────────────────────────────────────
app = FastAPI(
    title="AgroSentinel AI",
    description="""
## Multimodal AI-Based Crop Disease Outbreak Early-Warning System

AgroSentinel AI combines farmer crop images, local weather, crop growth stage, 
geospatial disease observations, historical outbreak data and satellite-derived 
crop-health signals to detect emerging disease clusters and forecast outbreak risk 
before severe crop loss occurs.

### Key Features:
- 🌿 **Disease Detection**: EfficientNet-B0 based image classification
- 🌦️ **Weather Risk**: XGBoost environmental risk estimation  
- 📍 **Spatial Clustering**: DBSCAN outbreak cluster detection
- 🔮 **Outbreak Forecasting**: 3/5/7-day risk prediction
- 🧠 **Multimodal Fusion**: Gated Cross-Attention Transformer
- 📊 **Explainability**: Grad-CAM + SHAP

### Demo Credentials:
- **Farmer**: farmer@demo.agrosentinel.ai / farmer123
- **Officer**: officer@demo.agrosentinel.ai / officer123
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (uploaded images) ────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="./data/uploads"), name="uploads")

# ── API Routers ────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(health.router, prefix=PREFIX, tags=["Health"])
app.include_router(auth.router, prefix=f"{PREFIX}/auth", tags=["Authentication"])
app.include_router(farms.router, prefix=f"{PREFIX}/farms", tags=["Farms"])
app.include_router(observations.router, prefix=f"{PREFIX}/observations", tags=["Observations"])
app.include_router(predict.router, prefix=f"{PREFIX}/predict", tags=["Prediction"])
app.include_router(outbreaks.router, prefix=f"{PREFIX}/outbreaks", tags=["Outbreaks"])
app.include_router(dashboard.router, prefix=f"{PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(demo.router, prefix=f"{PREFIX}/demo", tags=["Demo Simulation"])


# ── Root endpoint ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "AgroSentinel AI",
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs",
        "message": "Multimodal Crop Disease Outbreak Early-Warning System",
    }


# ── Run directly ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
