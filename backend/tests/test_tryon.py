import json
from fastapi.testclient import TestClient


def test_tryon_without_avatar(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "noavatar@example.com", "password": "pwd123", "full_name": "No Avatar", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "noavatar@example.com", "password": "pwd123"}
    )
    token = res.json()["access_token"]
    
    # Try preview
    res = client.post(
        "/api/v1/tryon/preview/1",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "You must configure an Avatar" in res.json()["detail"]


def test_create_and_get_avatar_with_dict_body_type(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "avatar_user@example.com", "password": "pwd123", "full_name": "Avatar User", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "avatar_user@example.com", "password": "pwd123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    morphs = {
        "chestWidth": 1.15,
        "bellyWidth": 0.95,
        "bellyDepth": 0.85,
        "hipWidth": 1.05,
        "armThickness": 1.10,
        "legThickness": 1.02,
        "breastSize": 0.90,
        "neckThickness": 1.08,
    }

    # Create avatar with dictionary body_type
    create_res = client.post(
        "/api/v1/tryon/avatar",
        headers=headers,
        json={
            "avatar_3d_url": "https://example.com/avatar.glb",
            "height_cm": 175.5,
            "weight_kg": 72.0,
            "body_type": morphs,
            "muscle_definition": 0.6,
            "glasses": True,
        },
    )
    assert create_res.status_code == 200
    created_data = create_res.json()
    assert created_data["body_type"] == morphs
    assert created_data["glasses"] is True
    assert created_data["height_cm"] == 175.5

    # Retrieve avatar via GET
    get_res = client.get("/api/v1/tryon/avatar", headers=headers)
    assert get_res.status_code == 200
    fetched_data = get_res.json()
    assert fetched_data["body_type"] == morphs
    assert isinstance(fetched_data["body_type"], dict)
    assert len(fetched_data["body_type"]) == 8


def test_create_avatar_with_stringified_json_body_type(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "json_str_user@example.com", "password": "pwd123", "full_name": "JSON Str User", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "json_str_user@example.com", "password": "pwd123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    morphs = {
        "chestWidth": 1.25,
        "bellyWidth": 1.10,
        "bellyDepth": 0.95,
        "hipWidth": 1.15,
        "armThickness": 1.20,
        "legThickness": 1.15,
        "breastSize": 1.05,
        "neckThickness": 1.10,
    }

    # Send stringified JSON as body_type (like frontend does)
    create_res = client.post(
        "/api/v1/tryon/avatar",
        headers=headers,
        json={
            "avatar_3d_url": "https://example.com/avatar.glb",
            "body_type": json.dumps(morphs),
        },
    )
    assert create_res.status_code == 200
    assert create_res.json()["body_type"] == morphs

    # GET returns it as a parsed dict
    get_res = client.get("/api/v1/tryon/avatar", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["body_type"] == morphs


def test_create_avatar_invalid_body_type_rejected(client: TestClient):
    client.post(
        "/api/v1/users/",
        json={"email": "invalid_avatar@example.com", "password": "pwd123", "full_name": "Invalid Avatar", "role_id": 1}
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "invalid_avatar@example.com", "password": "pwd123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid string (not valid JSON)
    res_bad_str = client.post(
        "/api/v1/tryon/avatar",
        headers=headers,
        json={
            "avatar_3d_url": "https://example.com/avatar.glb",
            "body_type": "not_json",
        },
    )
    assert res_bad_str.status_code == 422

    # Invalid value type (not float)
    res_bad_val = client.post(
        "/api/v1/tryon/avatar",
        headers=headers,
        json={
            "avatar_3d_url": "https://example.com/avatar.glb",
            "body_type": {"chestWidth": "not_a_float"},
        },
    )
    assert res_bad_val.status_code == 422
