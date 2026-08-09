import io
import pandas as pd
from fastapi.testclient import TestClient

def test_upload_catalog(client: TestClient):
    # 1. Create User
    client.post(
        "/api/v1/users/",
        json={
            "email": "brand@example.com",
            "password": "testpassword",
            "full_name": "Brand User",
            "role_id": 2,
            "brand_id": 1
        }
    )
    
    # 2. Login
    login_res = client.post(
        "/api/v1/auth/login",
        data={
            "username": "brand@example.com",
            "password": "testpassword"
        }
    )
    token = login_res.json()["access_token"]
    
    # 3. Create a fake excel file
    df = pd.DataFrame([
        {"SKU": "JEAN-1", "Name": "Skinny Jean", "Fit": "Skinny", "Size": "M", "Color": "Blue"}
    ])
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    
    # 4. Upload
    response = client.post(
        "/api/v1/catalog/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("catalog.xlsx", output.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    )
    
    assert response.status_code == 200
    assert "job_id" in response.json()
