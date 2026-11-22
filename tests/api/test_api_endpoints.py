"""
AgroSentinel AI — Integration Tests
Tests against the live running API server.

Run with: pytest tests/api/ -v
Requires: backend server running at http://localhost:8000
"""
import pytest
import httpx

BASE_URL = "http://localhost:8000"
pytestmark = pytest.mark.integration

# ── Server Check ───────────────────────────────────────────────────────────────
def require_server():
    """Skip the test if the server is not running."""
    try:
        httpx.get(f"{BASE_URL}/", timeout=3.0)
    except (httpx.ConnectError, httpx.TimeoutException):
        pytest.skip("Backend server not running at http://localhost:8000")


# ── Health Endpoints ───────────────────────────────────────────────────────────
def test_root_endpoint():
    require_server()
    resp = httpx.get(f"{BASE_URL}/")
    assert resp.status_code == 200
    assert resp.json().get("status") == "operational"


def test_health_endpoint():
    require_server()
    resp = httpx.get(f"{BASE_URL}/api/v1/health")
    assert resp.status_code == 200
    assert resp.json().get("status") == "healthy"


# ── Authentication ─────────────────────────────────────────────────────────────
def test_login_success_farmer():
    """Login with seeded demo farmer credentials."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "farmer@demo.agrosentinel.ai", "password": "farmer123"},
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "FARMER"


def test_login_success_officer():
    """Login with seeded demo officer credentials."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "officer@demo.agrosentinel.ai", "password": "officer123"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "OFFICER"


def test_login_wrong_password():
    """Invalid credentials must return 401."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "farmer@demo.agrosentinel.ai", "password": "wrongpassword"},
    )
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"


# ── Demo Simulation ────────────────────────────────────────────────────────────
def test_demo_scenario():
    require_server()
    resp = httpx.get(f"{BASE_URL}/api/v1/demo/scenario")
    assert resp.status_code == 200
    data = resp.json()
    assert "days" in data
    assert len(data["days"]) == 5
    assert data["crop"] == "Tomato"
    assert data["disease"] == "Late Blight"


def test_demo_step_day1():
    """Day 1 should be GREEN (low risk)."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/demo/step",
        json={"session_id": "test", "day": 1},
        timeout=30.0,
    )
    assert resp.status_code == 200
    data = resp.json()
    # Check correct field names (from actual API response)
    assert "total_cases_cumulative" in data, f"Missing total_cases_cumulative, got: {list(data.keys())}"
    assert "alert_level" in data
    assert data["day"] == 1
    assert data["alert_level"] == "GREEN"


def test_demo_step_day3():
    """Day 3 should be ORANGE (high risk, cluster forming)."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/demo/step",
        json={"session_id": "test", "day": 3},
        timeout=30.0,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["alert_level"] == "ORANGE"
    assert data["total_cases_cumulative"] >= 12


def test_what_if_high_humidity_increases_risk():
    """High humidity should increase risk compared to baseline."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/demo/what-if",
        json={
            "humidity": 90.0,
            "rainfall": 15.0,
            "nearby_cases": 5,
            "crop_stage": "flowering",
            "disease_probability": 0.7,
        },
        timeout=15.0,
    )
    assert resp.status_code == 200
    data = resp.json()
    # Response has nested before/after structure
    assert "before" in data, f"Missing 'before' key, got: {list(data.keys())}"
    assert "after" in data
    assert "delta" in data
    assert data["delta"] > 0, f"Expected delta > 0 (risk increase), got: {data['delta']}"


# ── Prediction Endpoint ────────────────────────────────────────────────────────
def test_predict_basic():
    """Prediction without image should work with heuristic model."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/predict/",
        json={
            "latitude": 20.05,
            "longitude": 74.05,
            "crop_type": "tomato",
            "growth_stage": "flowering",
        },
        timeout=30.0,
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"


def test_predict_response_fields():
    """Prediction response must contain all required fields."""
    require_server()
    resp = httpx.post(
        f"{BASE_URL}/api/v1/predict/",
        json={"latitude": 20.0, "longitude": 74.0, "crop_type": "tomato"},
        timeout=30.0,
    )
    if resp.status_code == 200:
        data = resp.json()
        required_fields = [
            "predicted_disease", "disease_probability", "severity_score",
            "current_risk", "future_risk_3d", "future_risk_7d",
            "alert_level", "explanation_text", "model_version",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        assert 0.0 <= data["current_risk"] <= 1.0
        assert data["alert_level"] in ("GREEN", "YELLOW", "ORANGE", "RED")
