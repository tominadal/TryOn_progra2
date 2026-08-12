"""
Additional tests to ensure compliance with the 10+ unit tests requirement.
Covers: catalog validation, garment endpoints, commerce cart removal,
unauthorized access, and the AI strategy pattern.
"""
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.services.ai_strategy import MockTryOnStrategy, VirtualTryOnStrategy


# ─── Helper ────────────────────────────────────────────────────────────────────

def _register_and_login(client, email, password="testpwd123", role_id=1):
    body: dict = {"email": email, "password": password, "full_name": "Test", "role_id": role_id}
    # Brand Manager accounts require a brand_name
    if role_id == 2:
        body["brand_name"] = f"TestBrand-{email}"
    client.post("/api/v1/users/", json=body)
    res = client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    )
    return res.json().get("access_token", "")


# ─── Test: Health endpoint ──────────────────────────────────────────────────────

def test_health_endpoint(client: TestClient):
    """Health check returns 200 with status ok."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ─── Test: Catalog — invalid file type ─────────────────────────────────────────

def test_upload_catalog_invalid_file_type(client: TestClient):
    """Only .xls / .xlsx files are allowed. CSV must be rejected."""
    token = _register_and_login(client, "inv_file@example.com", role_id=2)
    # Note: brand_id is set during user creation — brand_id=1 (from catalog test fixture)
    # We only need the 400 from the file-type check here, not a real brand
    res = client.post(
        "/api/v1/catalog/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("catalog.csv", b"col1,col2\n1,2", "text/csv")},
    )
    assert res.status_code == 400
    assert "Excel" in res.json()["detail"]


# ─── Test: Catalog — missing required columns ───────────────────────────────────

def test_upload_catalog_missing_columns(client: TestClient, db_session):
    """Excel without required columns is rejected with 400."""
    # Register a brand user (brand_name is auto-created by the router)
    token = _register_and_login(client, "misscols@example.com", role_id=2)
    assert token, "Login failed — brand user could not be created"

    # Create Excel WITHOUT required columns
    df = pd.DataFrame([{"WrongCol": "data"}])
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    output.seek(0)

    res = client.post(
        "/api/v1/catalog/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("bad.xlsx", output.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert res.status_code == 400
    assert "Missing required columns" in res.json()["detail"]


# ─── Test: Catalog — list garments (unauthenticated access ok) ──────────────────

def test_list_garments_public(client: TestClient):
    """GET /catalog/garments is accessible without authentication."""
    res = client.get("/api/v1/catalog/garments")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


# ─── Test: Catalog — get non-existent garment ──────────────────────────────────

def test_get_garment_not_found(client: TestClient):
    """Requesting a garment that doesn't exist returns 404."""
    res = client.get("/api/v1/catalog/garments/99999")
    assert res.status_code == 404


# ─── Test: Commerce — add_to_cart validates garment existence ───────────────────

def test_add_to_cart_garment_not_found(client: TestClient):
    """Adding a non-existent garment_id to cart returns 404."""
    token = _register_and_login(client, "cartnotfound@example.com")
    res = client.post(
        "/api/v1/commerce/cart",
        headers={"Authorization": f"Bearer {token}"},
        json={"garment_id": 99999, "quantity": 1},
    )
    assert res.status_code == 404


# ─── Test: Commerce — get cart for new user is empty ───────────────────────────

def test_get_empty_cart(client: TestClient):
    """A new user's cart is empty."""
    token = _register_and_login(client, "emptycart2@example.com")
    res = client.get("/api/v1/commerce/cart", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["items"] == []
    assert res.json()["total"] == 0.0


# ─── Test: Users — password too short ──────────────────────────────────────────

def test_create_user_weak_password(client: TestClient):
    """Passwords shorter than 6 characters are rejected by Pydantic validation."""
    res = client.post(
        "/api/v1/users/",
        json={"email": "weak@example.com", "password": "123", "role_id": 1},
    )
    assert res.status_code == 422  # Unprocessable Entity


# ─── Test: Auth — invalid credentials ──────────────────────────────────────────

def test_login_wrong_password(client: TestClient):
    """Wrong password must return 401."""
    client.post(
        "/api/v1/users/",
        json={"email": "wrongpwd@example.com", "password": "correct123", "role_id": 1},
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "wrongpwd@example.com", "password": "wrongpassword"},
    )
    assert res.status_code == 401


# ─── Test: Strategy Pattern — MockTryOnStrategy ────────────────────────────────

def test_mock_strategy_returns_valid_asset():
    """MockTryOnStrategy returns a dict with the required keys."""
    strategy = MockTryOnStrategy()
    result = strategy.process_garment({"name": "Test Jean", "fit": "Skinny"})
    assert "ai_generated_image_url" in result
    assert "metadata_json" in result
    assert isinstance(result["ai_generated_image_url"], str)
    assert len(result["ai_generated_image_url"]) > 0


def test_mock_strategy_implements_interface():
    """MockTryOnStrategy correctly implements the VirtualTryOnStrategy interface."""
    strategy = MockTryOnStrategy()
    assert isinstance(strategy, VirtualTryOnStrategy)


# ─── Test: Try-On — preview requires auth ──────────────────────────────────────

def test_preview_requires_authentication(client: TestClient):
    """Accessing try-on/preview without a token returns 401."""
    res = client.post("/api/v1/tryon/preview/1")
    assert res.status_code == 401


# ─── Test: Users — get /me requires auth ───────────────────────────────────────

def test_get_me_requires_authentication(client: TestClient):
    """GET /users/me without token returns 401."""
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401
