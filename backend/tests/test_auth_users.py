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
