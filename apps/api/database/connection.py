"""
AgroSentinel AI — Database Connection & Session Management
"""
import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from .models import Base


# ── Database URL ──────────────────────────────────────────────────────────────
# Using SQLite for development (works without PostgreSQL installation)
# Switch to PostgreSQL in production via environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./agrosentinel.db"
)

# ── Engine Setup ──────────────────────────────────────────────────────────────
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Required for SQLite + threading
        echo=False,
    )
    
    # Enable WAL mode for better concurrent reads on SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(DATABASE_URL, echo=False)


# ── Session Factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Database Initialization ───────────────────────────────────────────────────
def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def drop_db():
    """Drop all tables — use only in testing."""
    Base.metadata.drop_all(bind=engine)


# ── Dependency for FastAPI ────────────────────────────────────────────────────
def get_db():
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session when the request is done.
    
    Usage in route:
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
