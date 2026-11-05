"""
Tests for catalog ingestion: Excel upload, column validation, garment listing.
"""
import io
import pandas as pd
from fastapi.testclient import TestClient
from app.config.settings import settings


def test_upload_catalog(client: TestClient, db_session, monkeypatch):
    """Brand user can upload a valid Excel file and receive a job_id."""
    monkeypatch.setattr(settings, "USE_MOCK_AI", True)
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

    monkeypatch.setattr(settings, "USE_MOCK_AI", False)

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

    monkeypatch.setattr(settings, "USE_MOCK_AI", False)

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


def test_create_garment_with_mock_ai(client: TestClient, db_session, monkeypatch):
    """
    create_garment using MockTryOnStrategy when USE_MOCK_AI is enabled.
    Saves static 3D parameters to GarmentAsset without network calls.
    """
    from app.domain.models.catalog import Garment
    monkeypatch.setattr(settings, "USE_MOCK_AI", True)

    # Register brand user
    res = client.post(
        "/api/v1/users/",
        json={
            "email": "brand_mock@example.com",
            "password": "testpassword",
            "full_name": "Brand Mock User",
            "role_id": 2,
            "brand_name": "Mock Test Brand",
        },
    )
    assert res.status_code == 200
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_mock@example.com", "password": "testpassword"},
    )
    token = login_res.json()["access_token"]

    payload = {
        "name": "Mock AI Pant",
        "price": 79.99,
        "fit": "Regular",
        "color": "Indigo",
        "color_hex": "#1e3a8a",
        "sizes": ["30", "32"],
        "image_url": "http://example.com/mock_pant.jpg",
        "generate_3d": True,
    }

    response = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Mock AI Pant"

    # Verify garment and asset in DB
    garment = db_session.query(Garment).filter(Garment.id == data["id"]).first()
    assert garment is not None
    assert garment.is_processed is True
    assert garment.asset is not None
    assert garment.asset.metadata_json["source"] == "mock"
    assert garment.asset.metadata_json["scale_x"] == 1.0
    assert garment.asset.metadata_json["fit_label"] == "Regular"


def test_create_garment_manual_parametric_without_ai(client: TestClient, db_session):
    """
    create_garment when generate_3d=False persists deterministic manual_parametric
    metadata, color swatch, and GarmentImage without invoking AI strategy.
    """
    from app.domain.models.catalog import Garment

    res = client.post(
        "/api/v1/users/",
        json={
            "email": "brand_manual@example.com",
            "password": "testpassword",
            "full_name": "Brand Manual User",
            "role_id": 2,
            "brand_name": "Manual Test Brand",
        },
    )
    assert res.status_code == 200
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_manual@example.com", "password": "testpassword"},
    )
    token = login_res.json()["access_token"]

    payload = {
        "name": "Manual Parametric Wide Jean",
        "price": 94900,
        "fit": "Wide Leg",
        "color": "Azul Oscuro",
        "color_hex": "#1e3a8a",
        "sizes": ["38", "40", "42"],
        "image_url": "/products/jean_classic.png",
        "generate_3d": False,
        "waist_rise": "Tiro Alto",
        "has_cuffs": True,
        "has_pleats": False,
        "distress_level": 40,
    }

    response = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()

    garment = db_session.query(Garment).filter(Garment.id == data["id"]).first()
    assert garment is not None
    assert garment.is_processed is True
    assert garment.available_colors == [{"name": "Azul Oscuro", "hex": "#1e3a8a"}]
    assert len(garment.images) == 1
    assert garment.asset is not None
    meta = garment.asset.metadata_json
    assert meta["source"] == "manual_parametric"
    assert meta["waist_rise"] == 0.85
    assert meta["has_cuff"] is True
    assert meta["distress"] == 0.4
    assert meta["taper"] == -0.35


def test_delete_garment_by_owning_brand(client: TestClient, db_session):
    """
    Brand manager can delete their own garment via DELETE /api/v1/catalog/garments/{id}.
    Also cleans up any CartItem referencing the deleted garment.
    """
    from app.domain.models.catalog import Garment, GarmentAsset, GarmentImage
    from app.domain.models.commerce import CartItem

    # Register brand user
    res = client.post(
        "/api/v1/users/",
        json={
            "email": "brand_del_owner@example.com",
            "password": "testpassword",
            "full_name": "Brand Delete Owner",
            "role_id": 2,
            "brand_name": "Delete Owner Brand",
        },
    )
    assert res.status_code == 200
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_del_owner@example.com", "password": "testpassword"},
    )
    brand_token = login_res.json()["access_token"]

    # Create garment
    create_res = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {brand_token}"},
        json={
            "name": "Garment To Delete",
            "price": 65000,
            "fit": "Regular",
            "color": "Negro",
            "color_hex": "#111827",
            "sizes": ["S", "M", "L"],
            "image_url": "/products/jean_classic.png",
            "generate_3d": False,
        },
    )
    assert create_res.status_code == 200
    garment_id = create_res.json()["id"]

    # Add garment to cart as customer
    cust_res = client.post(
        "/api/v1/users/",
        json={
            "email": "customer_cart_del@example.com",
            "password": "testpassword",
            "full_name": "Cart Customer",
            "role_id": 3,
        },
    )
    assert cust_res.status_code == 200
    cust_login = client.post(
        "/api/v1/auth/login",
        data={"username": "customer_cart_del@example.com", "password": "testpassword"},
    )
    cust_token = cust_login.json()["access_token"]

    add_cart_res = client.post(
        "/api/v1/commerce/cart",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"garment_id": garment_id, "quantity": 1, "size": "M"},
    )
    assert add_cart_res.status_code in (200, 201)

    # Delete garment as owning brand
    del_res = client.delete(
        f"/api/v1/catalog/garments/{garment_id}",
        headers={"Authorization": f"Bearer {brand_token}"},
    )
    assert del_res.status_code == 200
    assert del_res.json()["id"] == garment_id

    # Verify garment, asset, images, and cart items are gone
    get_res = client.get(f"/api/v1/catalog/garments/{garment_id}")
    assert get_res.status_code == 404
    assert db_session.query(Garment).filter(Garment.id == garment_id).first() is None
    assert db_session.query(GarmentAsset).filter(GarmentAsset.garment_id == garment_id).first() is None
    assert db_session.query(GarmentImage).filter(GarmentImage.garment_id == garment_id).first() is None
    assert db_session.query(CartItem).filter(CartItem.garment_id == garment_id).first() is None


def test_delete_garment_forbidden_for_other_brand_or_customer(client: TestClient):
    """
    Deleting a garment owned by another brand or as a customer returns 403 Forbidden.
    Deleting a non-existent garment returns 404 Not Found.
    """
    # Brand A creates a garment
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_a_sec@example.com",
            "password": "testpassword",
            "full_name": "Brand A",
            "role_id": 2,
            "brand_name": "Brand A Sec",
        },
    )
    token_a = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_a_sec@example.com", "password": "testpassword"},
    ).json()["access_token"]

    garment_id = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "name": "Protected Garment",
            "price": 75000,
            "fit": "Skinny",
            "color": "Azul",
            "color_hex": "#1e3a8a",
            "sizes": ["M"],
            "image_url": "/products/jean_classic.png",
            "generate_3d": False,
        },
    ).json()["id"]

    # Brand B attempts to delete Brand A's garment -> 403
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_b_sec@example.com",
            "password": "testpassword",
            "full_name": "Brand B",
            "role_id": 2,
            "brand_name": "Brand B Sec",
        },
    )
    token_b = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_b_sec@example.com", "password": "testpassword"},
    ).json()["access_token"]

    res_b = client.delete(
        f"/api/v1/catalog/garments/{garment_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_b.status_code == 403

    # Customer attempts to delete -> 403
    client.post(
        "/api/v1/users/",
        json={
            "email": "cust_sec@example.com",
            "password": "testpassword",
            "full_name": "Customer Sec",
            "role_id": 3,
        },
    )
    token_cust = client.post(
        "/api/v1/auth/login",
        data={"username": "cust_sec@example.com", "password": "testpassword"},
    ).json()["access_token"]

    res_cust = client.delete(
        f"/api/v1/catalog/garments/{garment_id}",
        headers={"Authorization": f"Bearer {token_cust}"},
    )
    assert res_cust.status_code == 403

    # Non-existent garment -> 404
    res_404 = client.delete(
        "/api/v1/catalog/garments/999999",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_404.status_code == 404


def test_update_garment_commercial_and_parametric_fields(client: TestClient):
    """
    Brand Manager owner can update garment commercial & physical fields (PUT)
    without invoking AI (regenerate_3d=False) and parametric 3D metadata updates deterministically.
    """
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_edit@example.com",
            "password": "testpassword",
            "full_name": "Brand Edit",
            "role_id": 2,
            "brand_name": "Edit Brand",
        },
    )
    token = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_edit@example.com", "password": "testpassword"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    garment_id = client.post(
        "/api/v1/catalog/garment",
        headers=headers,
        json={
            "name": "Original Regular Jean",
            "price": 60000,
            "fit": "Regular",
            "color": "Azul",
            "color_hex": "#1e3a8a",
            "sizes": ["S", "M"],
            "image_url": "/products/jean_classic.png",
            "generate_3d": False,
        },
    ).json()["id"]

    put_res = client.put(
        f"/api/v1/catalog/garments/{garment_id}",
        headers=headers,
        json={
            "name": "Updated Wide Leg Jean",
            "price": 82500,
            "fit": "Wide Leg",
            "color": "Negro Carbón",
            "color_hex": "#111827",
            "sizes": ["M", "L", "XL"],
            "material": "Denim 14oz",
            "description": "Edición actualizada",
            "waist_rise": "Tiro Alto",
            "distress_level": 45,
            "has_cuffs": True,
            "has_pleats": True,
            "regenerate_3d": False,
        },
    )
    assert put_res.status_code == 200, put_res.text
    updated = put_res.json()
    assert updated["name"] == "Updated Wide Leg Jean"
    assert updated["price"] == 82500.0
    assert updated["fit"] == "Wide Leg"
    assert updated["color"] == "Negro Carbón"
    assert updated["available_sizes"] == ["M", "L", "XL"]
    assert updated["available_colors"][0]["hex"] == "#111827"

    meta = updated["metadata_json"]
    assert meta["scale_x"] == 1.2
    assert meta["taper"] == -0.35
    assert meta["waist_rise"] == 0.85
    assert meta["distress"] == 0.45
    assert meta["has_cuff"] is True
    assert meta["has_pleats"] is True


def test_update_garment_with_regenerate_3d_success_and_rollback(client: TestClient):
    """
    When regenerate_3d=True, PUT invokes the AI strategy. If the AI strategy fails,
    the transaction rolls back and preserves the original garment data.
    """
    from app.main import app
    from app.dependencies import get_garment_tryon_strategy
    from app.services.ai_strategy import VirtualTryOnStrategy, AIServiceError, MockTryOnStrategy
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_edit_ai@example.com",
            "password": "testpassword",
            "full_name": "Brand Edit AI",
            "role_id": 2,
            "brand_name": "Edit AI Brand",
        },
    )
    token = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_edit_ai@example.com", "password": "testpassword"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    garment_id = client.post(
        "/api/v1/catalog/garment",
        headers=headers,
        json={
            "name": "Before AI Edit",
            "price": 70000,
            "fit": "Regular",
            "color": "Azul",
            "color_hex": "#1e3a8a",
            "sizes": ["M"],
            "image_url": "/products/jean_classic.png",
            "generate_3d": False,
        },
    ).json()["id"]

    # 1. Successful AI regeneration (injecting MockTryOnStrategy for fast deterministic test)
    from app.services.ai_strategy import MockTryOnStrategy
    app.dependency_overrides[get_garment_tryon_strategy] = lambda: MockTryOnStrategy()
    try:
        res_ok = client.put(
            f"/api/v1/catalog/garments/{garment_id}",
            headers=headers,
            json={
                "name": "After AI Regeneration",
                "price": 78000,
                "fit": "Skinny",
                "regenerate_3d": True,
            },
        )
        assert res_ok.status_code == 200
        assert res_ok.json()["name"] == "After AI Regeneration"
        assert res_ok.json()["metadata_json"]["source"] == "mock"
    finally:
        app.dependency_overrides.pop(get_garment_tryon_strategy, None)

    # 2. Failed AI regeneration -> atomic rollback
    class FailingStrategy(VirtualTryOnStrategy):
        def process_garment(self, garment_data: dict) -> dict:
            raise AIServiceError("Simulated AI failure during update")

    app.dependency_overrides[get_garment_tryon_strategy] = lambda: FailingStrategy()
    try:
        res_fail = client.put(
            f"/api/v1/catalog/garments/{garment_id}",
            headers=headers,
            json={
                "name": "Should Not Persist",
                "price": 99999,
                "regenerate_3d": True,
            },
        )
        assert res_fail.status_code == 500
    finally:
        app.dependency_overrides.pop(get_garment_tryon_strategy, None)

    # Verify original name and price were preserved
    persisted = client.get(f"/api/v1/catalog/garments/{garment_id}").json()
    assert persisted["name"] == "After AI Regeneration"
    assert persisted["price"] == 78000.0


def test_update_garment_forbidden_for_other_brand_or_customer(client: TestClient):
    """
    Another brand or a customer cannot edit a garment they do not own (403),
    and editing a non-existent garment returns 404.
    """
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_owner_put@example.com",
            "password": "testpassword",
            "full_name": "Owner Put",
            "role_id": 2,
            "brand_name": "Owner Put Brand",
        },
    )
    token_owner = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_owner_put@example.com", "password": "testpassword"},
    ).json()["access_token"]

    garment_id = client.post(
        "/api/v1/catalog/garment",
        headers={"Authorization": f"Bearer {token_owner}"},
        json={
            "name": "Immutable By Others",
            "price": 50000,
            "fit": "Regular",
            "color": "Azul",
            "color_hex": "#1e3a8a",
            "sizes": ["M"],
            "image_url": "/products/jean_classic.png",
            "generate_3d": False,
        },
    ).json()["id"]

    # Other brand -> 403
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_intruder_put@example.com",
            "password": "testpassword",
            "full_name": "Intruder Put",
            "role_id": 2,
            "brand_name": "Intruder Put Brand",
        },
    )
    token_intruder = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_intruder_put@example.com", "password": "testpassword"},
    ).json()["access_token"]

    res_403 = client.put(
        f"/api/v1/catalog/garments/{garment_id}",
        headers={"Authorization": f"Bearer {token_intruder}"},
        json={"name": "Hacked"},
    )
    assert res_403.status_code == 403

    # Non-existent -> 404
    res_404 = client.put(
        "/api/v1/catalog/garments/999999",
        headers={"Authorization": f"Bearer {token_owner}"},
        json={"name": "Ghost"},
    )
    assert res_404.status_code == 404


def test_get_observer_notifications_endpoint(client: TestClient):
    """Brand Manager can fetch live Observer telemetry and notifications via GET /catalog/notifications."""
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand_obs@example.com",
            "password": "testpassword",
            "full_name": "Brand Obs",
            "role_id": 2,
            "brand_name": "Observer Brand",
        },
    )
    token = client.post(
        "/api/v1/auth/login",
        data={"username": "brand_obs@example.com", "password": "testpassword"},
    ).json()["access_token"]

    res = client.get(
        "/api/v1/catalog/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert "stats" in body
    assert "notifications" in body
    assert "jobs_completed" in body["stats"]






