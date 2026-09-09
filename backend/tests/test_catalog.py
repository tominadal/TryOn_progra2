"""
Tests for catalog ingestion: Excel upload, column validation, garment listing.
"""
import io
import pandas as pd
from fastapi.testclient import TestClient


def test_upload_catalog(client: TestClient, db_session):
    """Brand user can upload a valid Excel file and receive a job_id."""
    # Create user with brand_name — router auto-creates the Brand and marketplace
    res = client.post(
        "/api/v1/users/",
        json={
            "email": "brand@example.com",
            "password": "testpassword",
            "full_name": "Brand User",
            "role_id": 2,
            "brand_name": "Acme Test Brand",
        },
    )
    assert res.status_code == 200, f"User creation failed: {res.json()}"

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "brand@example.com", "password": "testpassword"},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.json()}"
    token = login_res.json()["access_token"]

    # Create a valid Excel file with all required columns
    df = pd.DataFrame(
        [
            {
                "SKU": "JEAN-1",
                "Name": "Skinny Jean",
                "Fit": "Skinny",
                "Size": "M",
                "Color": "Blue",
                "Price": 89.99,
            }
        ]
    )
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    output.seek(0)

    # Upload
    response = client.post(
        "/api/v1/catalog/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "catalog.xlsx",
                output.read(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )

    assert response.status_code == 202, f"Upload failed: {response.json()}"
    assert "job_id" in response.json()


def test_create_garment_ai_failure_rolls_back_transaction(client: TestClient, db_session, monkeypatch):
    """
    Transactional integrity: if Gemini AI strategy fails or times out during create_garment,
    the transaction must rollback (cancelling the flush) and return HTTP 500.
    """
    from app.domain.models.catalog import Garment
    from app.services.ai_strategy import GeminiTryOnStrategy, AIServiceError

    # Register brand user
    res = client.post(
        "/api/v1/users/",
        json={
            "email": "brand_ai_fail@example.com",
            "password": "testpassword",
            "full_name": "Brand Fail User",
            "role_id": 2,
            "brand_name": "Rollback Test Brand",
        },
    )
    assert res.status_code == 200

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_ai_fail@example.com", "password": "testpassword"},
    )
    token = login_res.json()["access_token"]

    # Mock process_garment to simulate Gemini timeout/failure
    def mock_process_garment_fail(self, garment_data):
        raise AIServiceError("Gemini Vision API timeout: connection dropped")

    monkeypatch.setattr(GeminiTryOnStrategy, "process_garment", mock_process_garment_fail)

    unique_garment_name = "Rollback Pant Test"
    payload = {
        "name": unique_garment_name,
        "price": 49.99,
        "fit": "Regular",
        "color": "Blue",
        "color_hex": "#1e3a8a",
        "sizes": ["M", "L"],
        "image_url": "http://example.com/jean.jpg",
        "generate_3d": True,
    }

    response = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    # Must return 500 error indicating 3D model generation failed
    assert response.status_code == 500
    assert "No se pudo generar modelo 3D" in response.json()["detail"]

    # Transaction integrity: Garment must NOT exist in the database (rolled back)
    garment_in_db = db_session.query(Garment).filter(Garment.name == unique_garment_name).first()
    assert garment_in_db is None, "Garment should have been rolled back and not persisted in DB"


def test_gemini_strategy_raises_ai_service_error():
    """
    GeminiTryOnStrategy.process_garment must raise AIServiceError on failure,
    not fall back silently to _text_fallback.
    """
    from app.services.ai_strategy import GeminiTryOnStrategy, AIServiceError

    strategy = GeminiTryOnStrategy()
    strategy._sdk = "none"  # Simulate SDK unavailable or error

    import pytest
    with pytest.raises((AIServiceError, RuntimeError)) as exc_info:
        strategy.process_garment({"name": "Test Jean", "image_url": ""})

    assert "Fallo en la generación del modelo 3D con IA" in str(exc_info.value)


def test_gemini_strategy_fetch_image_raises_on_timeout(monkeypatch):
    """
    _fetch_image_b64 must propagate httpx exceptions (such as timeout)
    instead of swallowing them silently.
    """
    import httpx
    import pytest
    from app.services.ai_strategy import GeminiTryOnStrategy

    strategy = GeminiTryOnStrategy()

    def mock_httpx_get(*args, **kwargs):
        raise httpx.TimeoutException("Simulated timeout connecting to image host")

    monkeypatch.setattr(httpx, "get", mock_httpx_get)

    with pytest.raises(httpx.TimeoutException):
        strategy._fetch_image_b64("http://example.com/test.jpg")


def test_create_garment_success_via_threadpool(client: TestClient, db_session, monkeypatch):
    """
    create_garment executes strategy.process_garment asynchronously in threadpool,
    persisting the garment and returning HTTP 200 with garment details.
    """
    from app.domain.models.catalog import Garment
    from app.services.ai_strategy import GeminiTryOnStrategy

    # Register brand user
    res = client.post(
        "/api/v1/users/",
        json={
            "email": "brand_success@example.com",
            "password": "testpassword",
            "full_name": "Brand Success User",
            "role_id": 2,
            "brand_name": "Success Test Brand",
        },
    )
    assert res.status_code == 200

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_success@example.com", "password": "testpassword"},
    )
    token = login_res.json()["access_token"]

    # Mock process_garment to simulate successful AI strategy
    def mock_process_garment_ok(self, garment_data):
        return {
            "ai_generated_image_url": "http://example.com/generated_3d.png",
            "metadata_json": {"confidence_score": 0.98, "fit_type": "Regular"},
        }

    monkeypatch.setattr(GeminiTryOnStrategy, "process_garment", mock_process_garment_ok)

    payload = {
        "name": "Async Threadpool Jean",
        "price": 59.99,
        "fit": "Regular",
        "color": "Dark Blue",
        "color_hex": "#0f172a",
        "sizes": ["M", "L", "XL"],
        "image_url": "http://example.com/jean_raw.jpg",
        "generate_3d": True,
    }

    response = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Async Threadpool Jean"
    assert data["price"] == 59.99
    assert "id" in data

    # Verify garment and asset in DB
    garment = db_session.query(Garment).filter(Garment.id == data["id"]).first()
    assert garment is not None
    assert garment.is_processed is True
    assert garment.asset is not None
    assert garment.asset.metadata_json == {"confidence_score": 0.98, "fit_type": "Regular"}


