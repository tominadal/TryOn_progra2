from fastapi.testclient import TestClient

def test_add_to_cart(client: TestClient):
    # Create and login user
    client.post(
        "/api/v1/users/",
        json={"email": "cart@example.com", "password": "pwd", "full_name": "Cart", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "cart@example.com", "password": "pwd"}
    )
    token = res.json()["access_token"]
    
    # Add to cart
    res = client.post(
        "/api/v1/commerce/cart",
        headers={"Authorization": f"Bearer {token}"},
        json={"garment_id": 1, "quantity": 1}
    )
    assert res.status_code == 200
    assert res.json()["message"] == "Item added to cart"

def test_checkout_empty_cart(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "emptycart@example.com", "password": "pwd", "full_name": "Cart", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "emptycart@example.com", "password": "pwd"}
    )
    token = res.json()["access_token"]
    
    # Checkout empty cart
    res = client.post(
        "/api/v1/commerce/checkout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Cart is empty"

def test_checkout_success(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "buy@example.com", "password": "pwd", "full_name": "Cart", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "buy@example.com", "password": "pwd"}
    )
    token = res.json()["access_token"]
    
    client.post(
        "/api/v1/commerce/cart",
        headers={"Authorization": f"Bearer {token}"},
        json={"garment_id": 10, "quantity": 2}
    )
    
    # Checkout
    res = client.post(
        "/api/v1/commerce/checkout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["message"] == "Order placed successfully"
    assert "order_id" in data
    assert data["total"] == 200.0  # 2 * 100
