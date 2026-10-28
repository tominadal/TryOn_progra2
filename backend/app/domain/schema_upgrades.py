"""
Lightweight, idempotent schema upgrades for databases created with ``create_all``.

The project builds its schema with ``Base.metadata.create_all`` (see seed.py), which
never alters tables that already exist. When a model changes shape, existing databases
need a manual step. The functions here detect the old shape and upgrade it in place,
and do nothing on a database that is already up to date (or has no such table yet).

Upgrades
--------
* multi-avatar: ``avatars.user_id`` stops being UNIQUE (a user can own several
  avatars) and ``avatars.name`` is added.
* cart variants: ``cart_items`` and ``order_items`` get ``size`` and ``color``.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection, Engine

from app.domain.models.experience import Avatar

logger = logging.getLogger(__name__)


def _avatars_need_upgrade(inspector) -> bool:
    if not inspector.has_table("avatars"):
        return False  # fresh database: create_all already builds the new shape

    columns = {c["name"] for c in inspector.get_columns("avatars")}
    if "name" not in columns:
        return True

    unique_on_user = any(
        uc["column_names"] == ["user_id"] for uc in inspector.get_unique_constraints("avatars")
    ) or any(
        ix["unique"] and ix["column_names"] == ["user_id"] for ix in inspector.get_indexes("avatars")
    )
    return unique_on_user


def _rebuild_avatars_sqlite(conn: Connection) -> None:
    """SQLite cannot drop a UNIQUE constraint: rebuild the table and copy the rows."""
    inspector = inspect(conn)
    old_columns = [c["name"] for c in inspector.get_columns("avatars")]

    conn.execute(text("ALTER TABLE avatars RENAME TO avatars_old"))
    # Index names survive the rename, so free them before creating the new table
    for ix in inspect(conn).get_indexes("avatars_old"):
        if ix["name"]:
            conn.execute(text(f'DROP INDEX IF EXISTS "{ix["name"]}"'))

    Avatar.__table__.create(conn)

    new_columns = {c.name for c in Avatar.__table__.columns}
    shared = ", ".join(f'"{c}"' for c in old_columns if c in new_columns)
    conn.execute(text(f"INSERT INTO avatars ({shared}) SELECT {shared} FROM avatars_old"))
    conn.execute(text("DROP TABLE avatars_old"))


def _upgrade_avatars_postgres(conn: Connection) -> None:
    inspector = inspect(conn)
    conn.execute(text(
        "ALTER TABLE avatars ADD COLUMN IF NOT EXISTS name VARCHAR(50) NOT NULL DEFAULT 'Mi avatar'"
    ))
    for uc in inspector.get_unique_constraints("avatars"):
        if uc["column_names"] == ["user_id"]:
            conn.execute(text(f'ALTER TABLE avatars DROP CONSTRAINT "{uc["name"]}"'))
    for ix in inspector.get_indexes("avatars"):
        if ix["unique"] and ix["column_names"] == ["user_id"]:
            conn.execute(text(f'DROP INDEX IF EXISTS "{ix["name"]}"'))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_avatars_user_id ON avatars (user_id)"))


# table -> {column: SQL type}; nullable columns can be added with a plain ADD COLUMN
_VARIANT_COLUMNS = {
    "cart_items": {"size": "VARCHAR(20)", "color": "VARCHAR(50)"},
    "order_items": {"size": "VARCHAR(20)", "color": "VARCHAR(50)"},
}


def _add_missing_columns(engine: Engine) -> bool:
    """Add the nullable variant columns to databases created before they existed."""
    inspector = inspect(engine)
    changed = False
    for table, columns in _VARIANT_COLUMNS.items():
        if not inspector.has_table(table):
            continue  # fresh database: create_all builds it with the columns
        existing = {c["name"] for c in inspector.get_columns(table)}
        for column, sql_type in columns.items():
            if column in existing:
                continue
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
            logger.info("[schema] added %s.%s", table, column)
            changed = True
    return changed


def upgrade_schema(engine: Engine) -> bool:
    """Apply any pending upgrade. Returns True if something was changed."""
    changed = False

    if _avatars_need_upgrade(inspect(engine)):
        with engine.begin() as conn:
            if engine.dialect.name == "sqlite":
                _rebuild_avatars_sqlite(conn)
            else:
                _upgrade_avatars_postgres(conn)
        logger.info("[schema] avatars table upgraded for multiple avatars per user")
        changed = True

    if _add_missing_columns(engine):
        changed = True

    return changed
