"""Several avatars per user (e.g. a parent shopping for their children)."""
import sqlite3

from fastapi.testclient import TestClient

from app.constants import MAX_AVATARS_PER_USER
from app.domain.schema_upgrades import upgrade_schema


def _auth(client, email):
    client.post(
        "/api/v1/users/",
        json={"email": email, "password": "pwd123", "full_name": "Parent", "role_id": 1},
    )
    res = client.post("/api/v1/auth/login", data={"username": email, "password": "pwd123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _create(client, headers, name=None, **extra):
    body = {"avatar_3d_url": "native://avatar", **extra}
    if name is not None:
        body["name"] = name
    return client.post("/api/v1/tryon/avatars", headers=headers, json=body)


def test_user_can_create_several_avatars(client: TestClient):
    headers = _auth(client, "family@example.com")

    assert client.get("/api/v1/tryon/avatars", headers=headers).json() == []

    for name, height in [("Mateo", 120.0), ("Sofi", 105.0), ("Papá", 180.0)]:
        res = _create(client, headers, name, height_cm=height)
        assert res.status_code == 201, res.json()

    avatars = client.get("/api/v1/tryon/avatars", headers=headers).json()
    assert [a["name"] for a in avatars] == ["Mateo", "Sofi", "Papá"]  # oldest first
    assert [a["height_cm"] for a in avatars] == [120.0, 105.0, 180.0]


def test_avatar_name_defaults_and_is_validated(client: TestClient):
    headers = _auth(client, "names@example.com")

    assert _create(client, headers).json()["name"] == "Mi avatar"
    assert _create(client, headers, "  Lola  ").json()["name"] == "Lola"  # trimmed
    assert _create(client, headers, "   ").status_code == 422
    assert _create(client, headers, "x" * 51).status_code == 422


def test_update_avatar_changes_only_given_fields(client: TestClient):
    headers = _auth(client, "update@example.com")
    first = _create(client, headers, "Mateo", height_cm=120.0, skin_color="#f1c27d").json()
    other = _create(client, headers, "Sofi", height_cm=105.0).json()

    res = client.put(
        f"/api/v1/tryon/avatars/{first['id']}",
        headers=headers,
        json={"name": "Mateo Jr", "height_cm": 125.0},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Mateo Jr"
    assert body["height_cm"] == 125.0
    assert body["skin_color"] == "#f1c27d"  # untouched

    # The other avatar is not affected
    other_now = client.get(f"/api/v1/tryon/avatars/{other['id']}", headers=headers).json()
    assert other_now["height_cm"] == 105.0


def test_delete_avatar(client: TestClient):
    headers = _auth(client, "delete@example.com")
    a = _create(client, headers, "A").json()
    b = _create(client, headers, "B").json()

    assert client.delete(f"/api/v1/tryon/avatars/{a['id']}", headers=headers).status_code == 200
    remaining = client.get("/api/v1/tryon/avatars", headers=headers).json()
    assert [x["id"] for x in remaining] == [b["id"]]
    assert client.delete(f"/api/v1/tryon/avatars/{a['id']}", headers=headers).status_code == 404


def test_cannot_touch_another_users_avatar(client: TestClient):
    owner = _auth(client, "owner-av@example.com")
    intruder = _auth(client, "intruder-av@example.com")
    avatar = _create(client, owner, "Privado").json()
    url = f"/api/v1/tryon/avatars/{avatar['id']}"

    assert client.get(url, headers=intruder).status_code == 404
    assert client.put(url, headers=intruder, json={"name": "Hack"}).status_code == 404
    assert client.delete(url, headers=intruder).status_code == 404
    assert client.get("/api/v1/tryon/avatars", headers=intruder).json() == []
    assert client.get(url, headers=owner).json()["name"] == "Privado"  # intact


def test_avatar_limit_per_user(client: TestClient):
    headers = _auth(client, "limit@example.com")
    for i in range(MAX_AVATARS_PER_USER):
        assert _create(client, headers, f"Avatar {i}").status_code == 201

    res = _create(client, headers, "One too many")
    assert res.status_code == 400
    assert str(MAX_AVATARS_PER_USER) in res.json()["detail"]


def test_avatars_require_authentication(client: TestClient):
    assert client.get("/api/v1/tryon/avatars").status_code == 401
    assert client.post("/api/v1/tryon/avatars", json={"avatar_3d_url": "x"}).status_code == 401


def test_preview_checks_avatar_ownership(client: TestClient):
    owner = _auth(client, "preview-owner@example.com")
    intruder = _auth(client, "preview-intruder@example.com")
    avatar = _create(client, owner, "Mateo").json()

    # Someone else's avatar id is rejected
    res = client.post(f"/api/v1/tryon/preview/1?avatar_id={avatar['id']}", headers=intruder)
    assert res.status_code == 404

    # Unknown avatar id is rejected (instead of silently using another avatar)
    res = client.post("/api/v1/tryon/preview/1?avatar_id=99999", headers=owner)
    assert res.status_code == 404


def test_old_single_avatar_database_is_upgraded(tmp_path):
    """A DB created before this feature (UNIQUE user_id, no name) keeps its data and gains the new shape."""
    from sqlalchemy import create_engine, inspect

    db_file = tmp_path / "old.sqlite"
    con = sqlite3.connect(db_file)
    con.executescript(
        """
        CREATE TABLE users (id INTEGER PRIMARY KEY);
        CREATE TABLE avatars (
            id INTEGER NOT NULL, user_id INTEGER NOT NULL, height_cm FLOAT, skin_color VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME,
            PRIMARY KEY (id), UNIQUE (user_id), FOREIGN KEY(user_id) REFERENCES users (id)
        );
        CREATE INDEX ix_avatars_id ON avatars (id);
        INSERT INTO users (id) VALUES (1), (2);
        INSERT INTO avatars (id, user_id, height_cm, skin_color) VALUES (1, 1, 170.5, '#abc');
        """
    )
    con.commit()
    con.close()

    engine = create_engine(f"sqlite:///{db_file}")
    assert upgrade_schema(engine) is True
    assert upgrade_schema(engine) is False  # idempotent

    inspector = inspect(engine)
    assert "name" in {c["name"] for c in inspector.get_columns("avatars")}
    uniques = inspector.get_unique_constraints("avatars")
    assert not any(uc["column_names"] == ["user_id"] for uc in uniques)

    with engine.begin() as conn:
        row = conn.exec_driver_sql("SELECT user_id, height_cm, skin_color, name FROM avatars").one()
        assert tuple(row) == (1, 170.5, "#abc", "Mi avatar")  # data kept, default name
        # The same user can now own a second avatar
        conn.exec_driver_sql("INSERT INTO avatars (user_id, name) VALUES (1, 'Segundo')")
    engine.dispose()
