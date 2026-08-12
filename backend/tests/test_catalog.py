"""
Tests for catalog ingestion: Excel upload, column validation, garment listing.
"""
import io
import pandas as pd
from fastapi.testclient import TestClient


def test_upload_catalog(client: TestClient, db_session):
    """Brand user can upload a valid Excel file and receive a job_id."""
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
