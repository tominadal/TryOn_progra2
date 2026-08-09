from fastapi.testclient import TestClient

def test_tryon_without_avatar(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "noavatar@example.com", "password": "pwd", "full_name": "No Avatar", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "noavatar@example.com", "password": "pwd"}
    )
    token = res.json()["access_token"]
    
    # Try preview
    res = client.post(
        "/api/v1/tryon/preview/1",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "You must configure an Avatar" in res.json()["detail"]
