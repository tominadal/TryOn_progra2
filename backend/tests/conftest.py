import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.domain.database import get_db
import app.domain.database as db_module
from app.domain.models.base import Base

@pytest.fixture(scope="session")
def temp_db_path():
    """Create a temporary file for the SQLite database."""
    fd, path = tempfile.mkstemp(suffix=".sqlite")
    os.close(fd)
    yield path
    os.remove(path)

@pytest.fixture(scope="function")
def db_engine(temp_db_path):
    """
    Create a new engine for the temporary DB file for each test,
    ensuring a clean database state.
    """
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{temp_db_path}"
    
    # Use a file DB with NullPool to allow multiple threads (background tasks)
    # to access the database without SQLite thread-affinity errors.
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Monkeypatch app.domain.database so background tasks use this specific test DB
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db_module.engine = engine
    db_module.SessionLocal = TestingSessionLocal
    
    yield engine
    
    # Cleanup after test
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Provides a database session for the test."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    
    yield session
    
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Provides a FastAPI TestClient with the DB dependency overridden."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
