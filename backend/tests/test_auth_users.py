from fastapi.testclient import TestClient

def test_create_user(client: TestClient):
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Test User",
            "role_id": 1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_create_user_duplicate_email(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={
            "email": "duplicate@example.com",
            "password": "testpassword",
            "full_name": "Test User",
            "role_id": 1
        }
    )
    # Try to create the same user again
    response = client.post(
        "/api/v1/users/",
        json={
            "email": "duplicate@example.com",
            "password": "testpassword",
            "full_name": "Test User",
            "role_id": 1
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login(client: TestClient):
    # First create a user
    client.post(
        "/api/v1/users/",
        json={
            "email": "login@example.com",
            "password": "testpassword",
            "full_name": "Login User",
            "role_id": 1
        }
    )
    
    # Then login
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@example.com",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_get_users_me(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={
            "email": "me@example.com",
            "password": "testpassword",
            "full_name": "Me User",
            "role_id": 1
        }
    )
    
    login_res = client.post(
        "/api/v1/auth/login",
        data={
            "username": "me@example.com",
            "password": "testpassword"
        }
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def _register(client: TestClient, email: str = "reset@example.com", password: str = "oldpass123"):
    client.post(
        "/api/v1/users/",
        json={"email": email, "password": password, "full_name": "Reset User", "role_id": 3},
    )


def test_forgot_password_unknown_email_is_generic(client: TestClient):
    response = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert response.status_code == 200
    assert response.json()["reset_url"] is None


def test_password_reset_full_flow_and_single_use(client: TestClient):
    _register(client)
    forgot = client.post("/api/v1/auth/forgot-password", json={"email": "reset@example.com"})
    assert forgot.status_code == 200
    token = forgot.json()["reset_url"].split("token=")[1]

    reset = client.post(
        "/api/v1/auth/reset-password", json={"token": token, "new_password": "newpass456"}
    )
    assert reset.status_code == 200

    old_login = client.post("/api/v1/auth/login", data={"username": "reset@example.com", "password": "oldpass123"})
    assert old_login.status_code == 401
    new_login = client.post("/api/v1/auth/login", data={"username": "reset@example.com", "password": "newpass456"})
    assert new_login.status_code == 200

    # The same token cannot be reused once the password changed
    reuse = client.post(
        "/api/v1/auth/reset-password", json={"token": token, "new_password": "another789"}
    )
    assert reuse.status_code == 400


def test_reset_token_cannot_authenticate_api(client: TestClient):
    _register(client, email="nolog@example.com")
    forgot = client.post("/api/v1/auth/forgot-password", json={"email": "nolog@example.com"})
    token = forgot.json()["reset_url"].split("token=")[1]
    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 401


def test_reset_password_rejects_garbage_token(client: TestClient):
    response = client.post(
        "/api/v1/auth/reset-password", json={"token": "not-a-valid-token", "new_password": "newpass456"}
    )
    assert response.status_code == 400
