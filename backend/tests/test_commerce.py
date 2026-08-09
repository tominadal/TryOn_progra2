from fastapi.testclient import TestClient


def _get_token(client, email, password="testpwd123"):
    """Helper: register a user if needed and return an auth token."""
    client.post(
        "/api/v1/users/",
        json={"email": email, "password": password, "full_name": "Test User", "role_id": 1},
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert "access_token" in res.json(), f"Login failed for {email}: {res.json()}"
    return res.json()["access_token"]


def _create_processed_garment(db_session):
    """Helper: create a Marketplace, Brand, and processed Garment in the test DB."""
    from app.domain.models.organization import Brand, Marketplace
    from app.domain.models.catalog import Garment

    mk = Marketplace(name="Commerce Test MK")
    db_session.add(mk)
    db_session.commit()
    db_session.refresh(mk)

    brand = Brand(name="Commerce Brand", marketplace_id=mk.id)
    db_session.add(brand)
    db_session.commit()
    db_session.refresh(brand)

    garment = Garment(
        sku="COMM-001",
        name="Test Commerce Jean",
        brand_id=brand.id,
        price=59.99,
        is_processed=True,
    )
    db_session.add(garment)
    db_session.commit()
    db_session.refresh(garment)
    return garment


def test_add_to_cart(client: TestClient, db_session):
    """A logged-in user can add a processed garment to their cart."""
    garment = _create_processed_garment(db_session)
    token = _get_token(client, "cart@example.com")

    res = client.post(
        "/api/v1/commerce/cart",
        headers={"Authorization": f"Bearer {token}"},
        json={"garment_id": garment.id, "quantity": 1},
    )
    assert res.status_code == 201, f"Unexpected: {res.json()}"
    assert res.json()["message"] == "Item added to cart"


def test_checkout_empty_cart(client: TestClient):
    """Checking out with an empty cart returns 400."""
    token = _get_token(client, "emptycart@example.com")

    res = client.post(
        "/api/v1/commerce/checkout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Cart is empty"


def test_checkout_success(client: TestClient, db_session):
    """Full checkout flow: add item → checkout → order created with correct total."""
    garment = _create_processed_garment(db_session)

    token = _get_token(client, "buy@example.com")

    # Add 2 units to cart
    client.post(
        "/api/v1/commerce/cart",
        headers={"Authorization": f"Bearer {token}"},
        json={"garment_id": garment.id, "quantity": 2},
    )

    # Checkout
    res = client.post(
        "/api/v1/commerce/checkout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201, f"Checkout failed: {res.json()}"
    data = res.json()
    assert data["message"] == "Order placed successfully"
    assert "order_id" in data
    assert data["total"] == round(59.99 * 2, 2)
