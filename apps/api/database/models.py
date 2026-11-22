"""
AgroSentinel AI — Database Models
SQLAlchemy ORM models for all entities.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, 
    ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship, DeclarativeBase
import enum


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class AlertLevel(str, enum.Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    ORANGE = "ORANGE"
    RED = "RED"


class User(Base):
    """Platform users — farmers, agricultural officers, admins."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.FARMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farms = relationship("Farm", back_populates="owner")
    
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, role={self.role})>"


class Farm(Base):
    """Farm records with location and crop information."""
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_hectares = Column(Float, nullable=True)
    
    # Crop info
    crop_type = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    sowing_date = Column(DateTime, nullable=True)
    growth_stage = Column(String(50), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="farms")
    observations = relationship("DiseaseObservation", back_populates="farm")
    satellite_features = relationship("SatelliteFeature", back_populates="farm")
    outbreak_predictions = relationship("OutbreakPrediction", back_populates="farm")
    alerts = relationship("Alert", back_populates="farm")
    
    def __repr__(self):
        return f"<Farm(id={self.id}, name={self.name}, crop={self.crop_type})>"


class DiseaseObservation(Base):
    """Individual disease observation submitted by a farmer."""
    __tablename__ = "disease_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    
    # Image
    image_path = Column(String(500), nullable=True)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Vision model output
    predicted_disease = Column(String(100), nullable=True)
    disease_probability = Column(Float, nullable=True)  # 0-1
    severity_score = Column(Float, nullable=True)  # 0-1
    image_embedding = Column(Text, nullable=True)  # JSON-serialized embedding
    vision_model_version = Column(String(50), nullable=True)
    
    # Spatial cluster assignment
    cluster_id = Column(Integer, nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="observations")
    
    def __repr__(self):
        return f"<DiseaseObservation(id={self.id}, disease={self.predicted_disease}, prob={self.disease_probability:.2f})>"


class WeatherObservation(Base):
    """Weather data records by location and time."""
    __tablename__ = "weather_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Raw weather values
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    solar_radiation = Column(Float, nullable=True)
    
    # Source
    source = Column(String(50), default="synthetic")  # synthetic | api | station
    is_synthetic = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<WeatherObservation(id={self.id}, time={self.timestamp}, temp={self.temperature_c})>"


class SatelliteFeature(Base):
    """Pre-computed satellite-derived vegetation indices per farm per date."""
    __tablename__ = "satellite_features"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Vegetation indices
    ndvi = Column(Float, nullable=True)   # Normalized Difference Vegetation Index
    ndwi = Column(Float, nullable=True)   # Normalized Difference Water Index
    evi = Column(Float, nullable=True)    # Enhanced Vegetation Index
    
    # Temporal change features
    ndvi_7d_change = Column(Float, nullable=True)
    ndvi_14d_change = Column(Float, nullable=True)
    vegetation_anomaly = Column(Float, nullable=True)  # Deviation from historical mean
    
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="satellite_features")
    
    def __repr__(self):
        return f"<SatelliteFeature(farm={self.farm_id}, date={self.date}, ndvi={self.ndvi})>"


class OutbreakPrediction(Base):
    """Multimodal outbreak risk prediction for a farm at a point in time."""
    __tablename__ = "outbreak_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    
    # Risk scores (0-1)
    current_risk = Column(Float, nullable=False)
    future_risk_3d = Column(Float, nullable=True)
    future_risk_5d = Column(Float, nullable=True)
    future_risk_7d = Column(Float, nullable=True)
    spread_probability = Column(Float, nullable=True)
    
    # Alert
    alert_level = Column(SAEnum(AlertLevel), default=AlertLevel.GREEN)
    cluster_id = Column(Integer, nullable=True)
    
    # Model metadata
    fusion_model_version = Column(String(50), nullable=True)
    modality_gates = Column(Text, nullable=True)  # JSON: {"image": 0.18, "weather": 0.24, ...}
    shap_values = Column(Text, nullable=True)      # JSON SHAP values
    
    # Contributing signals
    image_risk_contribution = Column(Float, nullable=True)
    weather_risk_contribution = Column(Float, nullable=True)
    geo_risk_contribution = Column(Float, nullable=True)
    satellite_risk_contribution = Column(Float, nullable=True)
    historical_risk_contribution = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="outbreak_predictions")
    
    def __repr__(self):
        return f"<OutbreakPrediction(farm={self.farm_id}, risk={self.current_risk:.2f}, level={self.alert_level})>"


class Alert(Base):
    """Alerts generated by the alert engine for farmers and officers."""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    
    alert_type = Column(String(100), nullable=False)  # outbreak_warning, cluster_detected, etc.
    severity = Column(SAEnum(AlertLevel), nullable=False)
    message = Column(Text, nullable=False)
    technical_detail = Column(Text, nullable=True)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.alert_type}, severity={self.severity})>"


class DiseaseCluster(Base):
    """Detected spatial disease clusters from DBSCAN."""
    __tablename__ = "disease_clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Spatial properties
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_km = Column(Float, nullable=False)
    
    # Cluster statistics
    num_cases = Column(Integer, nullable=False)
    primary_disease = Column(String(100), nullable=True)
    avg_severity = Column(Float, nullable=True)
    
    # Temporal
    first_observed = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Risk
    current_risk = Column(Float, nullable=True)
    growth_rate = Column(Float, nullable=True)  # cases per day
    alert_level = Column(SAEnum(AlertLevel), default=AlertLevel.GREEN)
    
    is_active = Column(Boolean, default=True)
    is_synthetic = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<DiseaseCluster(id={self.id}, cases={self.num_cases}, risk={self.current_risk:.2f})>"


class ExperimentLog(Base):
    """ML experiment tracking (lightweight MLflow alternative)."""
    __tablename__ = "experiment_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    experiment_name = Column(String(255), nullable=False)
    model_version = Column(String(100), nullable=True)
    
    # Parameters & metrics stored as JSON
    parameters = Column(Text, nullable=True)   # JSON
    metrics = Column(Text, nullable=True)       # JSON
    
    dataset_version = Column(String(100), nullable=True)
    training_duration_seconds = Column(Float, nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ExperimentLog(name={self.experiment_name}, version={self.model_version})>"
