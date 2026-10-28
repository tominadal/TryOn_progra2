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


# ── Cart variants (size / color) ─────────────────────────────────────────────

def _add(client, headers, garment_id, quantity=1, **variant):
    res = client.post(
        "/api/v1/commerce/cart",
        headers=headers,
        json={"garment_id": garment_id, "quantity": quantity, **variant},
    )
    assert res.status_code == 201, res.json()


def _cart_items(client, headers):
    return client.get("/api/v1/commerce/cart", headers=headers).json()["items"]


def test_same_garment_in_different_variants_is_separate_lines(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'variants@example.com')}"}

    _add(client, headers, garment.id, size="30", color="Azul Clásico")
    _add(client, headers, garment.id, size="32", color="Azul Clásico")
    _add(client, headers, garment.id, size="30", color="Gris Acero")

    items = _cart_items(client, headers)
    assert [(i["size"], i["color"], i["quantity"]) for i in items] == [
        ("30", "Azul Clásico", 1),
        ("32", "Azul Clásico", 1),
        ("30", "Gris Acero", 1),
    ]


def test_same_variant_merges_quantities(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'merge@example.com')}"}

    _add(client, headers, garment.id, 1, size="30", color="Azul")
    _add(client, headers, garment.id, 2, size="30", color="Azul")

    items = _cart_items(client, headers)
    assert len(items) == 1
    assert items[0]["quantity"] == 3


def test_blank_variant_is_treated_as_no_choice(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'blank@example.com')}"}

    _add(client, headers, garment.id)
    _add(client, headers, garment.id, size="  ", color="")

    items = _cart_items(client, headers)
    assert len(items) == 1
    assert items[0]["size"] is None and items[0]["color"] is None
    assert items[0]["quantity"] == 2


def test_removing_one_variant_keeps_the_other(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'removevariant@example.com')}"}

    _add(client, headers, garment.id, size="30", color="Azul")
    _add(client, headers, garment.id, size="32", color="Azul")
    first, second = _cart_items(client, headers)

    res = client.delete(f"/api/v1/commerce/cart/{first['cart_item_id']}", headers=headers)
    assert res.status_code == 200

    remaining = _cart_items(client, headers)
    assert [i["cart_item_id"] for i in remaining] == [second["cart_item_id"]]
    assert remaining[0]["size"] == "32"


def test_update_cart_item_quantity(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'qty@example.com')}"}

    _add(client, headers, garment.id, 3, size="30")
    item = _cart_items(client, headers)[0]
    url = f"/api/v1/commerce/cart/{item['cart_item_id']}"

    assert client.patch(url, headers=headers, json={"quantity": 2}).status_code == 200
    assert _cart_items(client, headers)[0]["quantity"] == 2

    assert client.patch(url, headers=headers, json={"quantity": 0}).status_code == 422
    assert client.patch(url, headers=headers, json={"quantity": 100}).status_code == 422


def test_cannot_update_quantity_of_another_users_item(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    owner = {"Authorization": f"Bearer {_get_token(client, 'qty-owner@example.com')}"}
    intruder = {"Authorization": f"Bearer {_get_token(client, 'qty-intruder@example.com')}"}

    _add(client, owner, garment.id, 1)
    item_id = _cart_items(client, owner)[0]["cart_item_id"]

    res = client.patch(f"/api/v1/commerce/cart/{item_id}", headers=intruder, json={"quantity": 9})
    assert res.status_code == 404
    assert _cart_items(client, owner)[0]["quantity"] == 1


def test_adding_beyond_the_limit_caps_quantity_at_99(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'cap@example.com')}"}

    _add(client, headers, garment.id, 90, size="30")
    _add(client, headers, garment.id, 50, size="30")

    assert _cart_items(client, headers)[0]["quantity"] == 99


def test_checkout_keeps_size_and_color_in_the_order(client: TestClient, db_session):
    garment = _create_processed_garment(db_session)
    headers = {"Authorization": f"Bearer {_get_token(client, 'order-variant@example.com')}"}

    _add(client, headers, garment.id, 1, size="30", color="Azul Clásico")
    _add(client, headers, garment.id, 2, size="32", color="Gris Acero")

    assert client.post("/api/v1/commerce/checkout", headers=headers).status_code == 201

    order = client.get("/api/v1/commerce/orders", headers=headers).json()[0]
    lines = sorted((i["size"], i["color"], i["quantity"]) for i in order["items"])
    assert lines == [("30", "Azul Clásico", 1), ("32", "Gris Acero", 2)]


def test_old_cart_tables_get_the_variant_columns(tmp_path):
    """A database created before size/color existed keeps its rows and gains the columns."""
    import sqlite3

    from sqlalchemy import create_engine, inspect

    db_file = tmp_path / "old_cart.sqlite"
    con = sqlite3.connect(db_file)
    con.executescript(
        """
        CREATE TABLE cart_items (id INTEGER PRIMARY KEY, cart_id INTEGER, garment_id INTEGER, quantity INTEGER);
        CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, garment_id INTEGER, price FLOAT, quantity INTEGER);
        INSERT INTO cart_items (id, cart_id, garment_id, quantity) VALUES (1, 1, 5, 2);
        """
    )
    con.commit()
    con.close()

    from app.domain.schema_upgrades import upgrade_schema

    engine = create_engine(f"sqlite:///{db_file}")
    assert upgrade_schema(engine) is True
    assert upgrade_schema(engine) is False  # idempotent

    inspector = inspect(engine)
    for table in ("cart_items", "order_items"):
        columns = {c["name"] for c in inspector.get_columns(table)}
        assert {"size", "color"} <= columns

    with engine.begin() as conn:
        row = conn.exec_driver_sql("SELECT garment_id, quantity, size, color FROM cart_items").one()
        assert tuple(row) == (5, 2, None, None)
    engine.dispose()


def test_cors_preflight_allows_every_method_the_frontend_uses(client: TestClient):
    """The browser blocks a request whose method is missing from the CORS allow-list."""
    for method in ("PATCH", "PUT", "DELETE"):
        res = client.options(
            "/api/v1/commerce/cart/1",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": method,
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert res.status_code == 200, f"{method} preflight rejected: {res.text}"
        assert method in res.headers["access-control-allow-methods"]
