from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings


def normalize_database_url(url: str) -> str:
    """
    Normaliza cadenas de conexión 'postgres://' (comunes en Render/Neon/Heroku)
    al dialecto estándar 'postgresql://' requerido por SQLAlchemy.
    """
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


SQLALCHEMY_DATABASE_URL = normalize_database_url(settings.DATABASE_URL)
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
