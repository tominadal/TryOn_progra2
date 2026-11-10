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


# ─── Tests Parametrizados (Principio DRY — Clase Testing+Automatiza+Deploy) ────

from jose import jwt
from app.config.settings import settings
from app.domain.database import normalize_database_url
from app.routers.validators import is_valid_image, parse_price
from app.routers.catalog import _resolve_valid_image_url


@pytest.mark.parametrize(
    "raw_price,expected",
    [
        (45000, 45000.0),
        ("89.99", 89.99),
        (0, 0.0),
        (-150.5, 0.0),
        ("invalid_price", 0.0),
        (None, 0.0),
    ],
)
def test_parse_price_parametrized(raw_price, expected: float):
    """Verifica el parseo defensivo de precios con un único assert parametrizado (DRY)."""
    assert parse_price(raw_price) == expected


@pytest.mark.parametrize(
    "magic_bytes,expected_valid",
    [
        (b"\xff\xd8\xff\xe0\x00\x10JFIF", True),          # JPEG válido
        (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", True),  # PNG válido
        (b"GIF89a\x01\x00\x01\x00", True),                # GIF válido
        (b"RIFF\x00\x00\x00\x00WEBPVP8 ", True),          # WEBP válido
        (b"RIFF\x00\x00\x00\x00WAVEfmt ", False),         # RIFF de audio (no WEBP)
        (b"MZ\x90\x00\x03\x00\x00\x00", False),           # Ejecutable binario (.exe)
        (b"<script>alert(1)</script>", False),            # Payload XSS disfrazado
    ],
)
def test_is_valid_image_magic_bytes_parametrized(magic_bytes: bytes, expected_valid: bool):
    """Verifica validación de imágenes por magic bytes contra múltiples formatos y vectores."""
    assert is_valid_image(magic_bytes) is expected_valid


@pytest.mark.parametrize(
    "input_url,expected_url",
    [
        ("postgres://user:pass@host:5432/db", "postgresql://user:pass@host:5432/db"),
        ("postgresql://user:pass@host:5432/db", "postgresql://user:pass@host:5432/db"),
        ("sqlite:///./tryon_db.sqlite", "sqlite:///./tryon_db.sqlite"),
    ],
)
def test_normalize_database_url_parametrized(input_url: str, expected_url: str):
    """Verifica la normalización del dialecto PostgreSQL para proveedores Cloud (Render/Neon)."""
    assert normalize_database_url(input_url) == expected_url


@pytest.mark.parametrize(
    "fit,expected_fallback",
    [
        ("Skinny", "/products/jean_black.png"),
        ("Mom Fit", "/products/jean_vintage.png"),
        ("Baggy Relaxed", "/products/jean_vintage.png"),
        ("Bermuda", "/products/bermuda_front.png"),
        ("Skirt", "/products/skirt_front.png"),
        ("Flared", "/products/flared_front.png"),
        ("Regular", "/products/jean_classic.png"),
    ],
)
def test_resolve_valid_image_url_missing_upload_parametrized(fit: str, expected_fallback: str):
    """Si un archivo en /static/uploads/ no existe en disco, resuelve un fallback acorde al fit."""
    missing_url = "http://127.0.0.1:8000/static/uploads/non_existent_uuid_file.png"
    assert _resolve_valid_image_url(missing_url, fit) == expected_fallback


@pytest.mark.parametrize(
    "role_id,expected_role_claim",
    [
        (1, "customer"),
        (2, "brand_manager"),
    ],
)
def test_jwt_payload_standard_claims_parametrized(
    client: TestClient, role_id: int, expected_role_claim: str
):
    """Verifica que el JWT emitido contenga los claims estándar: sub, iat, exp y role."""
    email = f"jwt_claims_role_{role_id}@example.com"
    token = _register_and_login(client, email, role_id=role_id)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == email
    assert payload["role"] == expected_role_claim
    assert isinstance(payload["iat"], int)
    assert payload["exp"] > payload["iat"]


@pytest.mark.parametrize(
    "fit,waist_cm,hip_cm,thigh_cm,hem_width_cm,expected_scale_min,expected_taper_sign",
    [
        ("Skinny", 78.0, 94.0, 52.0, 14.5, 0.85, 1),
        ("Regular", 82.0, 100.0, 58.0, 20.0, 0.98, 0),
        ("Wide Leg", 84.0, 108.0, 66.0, 28.0, 1.05, -1),
    ],
)
def test_parametric_metadata_centimeters_parametrized(
    fit: str,
    waist_cm: float,
    hip_cm: float,
    thigh_cm: float,
    hem_width_cm: float,
    expected_scale_min: float,
    expected_taper_sign: int,
):
    """Verifica que build_parametric_metadata derive scale_x, taper y almacene las medidas en cm."""
    from app.domain.schemas.catalog import build_parametric_metadata

    meta = build_parametric_metadata(
        fit=fit,
        waist_cm=waist_cm,
        hip_cm=hip_cm,
        thigh_cm=thigh_cm,
        hem_width_cm=hem_width_cm,
    )
    assert meta["waist_cm"] == waist_cm
    assert meta["hip_cm"] == hip_cm
    assert meta["thigh_cm"] == thigh_cm
    assert meta["hem_width_cm"] == hem_width_cm
    assert meta["scale_x"] >= expected_scale_min
    if expected_taper_sign > 0:
        assert meta["taper"] > 0
    elif expected_taper_sign < 0:
        assert meta["taper"] < 0


