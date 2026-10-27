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


def test_clear_cart_removes_all_items(client: TestClient, db_session):
    """DELETE /commerce/cart empties the cart and leaves it usable."""
    garment = _create_processed_garment(db_session)
    token = _get_token(client, "clear@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/commerce/cart", headers=headers, json={"garment_id": garment.id, "quantity": 3})
    assert len(client.get("/api/v1/commerce/cart", headers=headers).json()["items"]) == 1

    res = client.delete("/api/v1/commerce/cart", headers=headers)
    assert res.status_code == 200
    assert res.json()["removed"] == 1

    cart = client.get("/api/v1/commerce/cart", headers=headers).json()
    assert cart["items"] == []
    assert cart["total"] == 0.0


def test_clear_cart_is_idempotent_on_empty_cart(client: TestClient):
    """Clearing a cart that is empty (or was never created) is not an error."""
    token = _get_token(client, "clearempty@example.com")
    res = client.delete("/api/v1/commerce/cart", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["removed"] == 0


def test_clear_cart_requires_auth(client: TestClient):
    res = client.delete("/api/v1/commerce/cart")
    assert res.status_code == 401


def test_remove_single_item_from_cart(client: TestClient, db_session):
    """DELETE /commerce/cart/{item_id} removes only that item."""
    from app.domain.models.catalog import Garment

    garment = _create_processed_garment(db_session)
    other = Garment(sku="COMM-002", name="Second Jean", brand_id=garment.brand_id, price=10.0, is_processed=True)
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)

    token = _get_token(client, "removeone@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/commerce/cart", headers=headers, json={"garment_id": garment.id, "quantity": 1})
    client.post("/api/v1/commerce/cart", headers=headers, json={"garment_id": other.id, "quantity": 2})

    items = client.get("/api/v1/commerce/cart", headers=headers).json()["items"]
    target = next(i for i in items if i["garment_id"] == garment.id)

    res = client.delete(f"/api/v1/commerce/cart/{target['cart_item_id']}", headers=headers)
    assert res.status_code == 200

    cart = client.get("/api/v1/commerce/cart", headers=headers).json()
    assert [i["garment_id"] for i in cart["items"]] == [other.id]
    assert cart["total"] == 20.0


def test_remove_item_of_another_user_returns_404(client: TestClient, db_session):
    """A user cannot remove items from someone else's cart."""
    garment = _create_processed_garment(db_session)
    owner = {"Authorization": f"Bearer {_get_token(client, 'owner@example.com')}"}
    intruder = {"Authorization": f"Bearer {_get_token(client, 'intruder@example.com')}"}

    client.post("/api/v1/commerce/cart", headers=owner, json={"garment_id": garment.id, "quantity": 1})
    item_id = client.get("/api/v1/commerce/cart", headers=owner).json()["items"][0]["cart_item_id"]

    # The intruder has no cart at all, and must not be able to touch the owner's item
    res = client.delete(f"/api/v1/commerce/cart/{item_id}", headers=intruder)
    assert res.status_code == 404
    assert len(client.get("/api/v1/commerce/cart", headers=owner).json()["items"]) == 1
