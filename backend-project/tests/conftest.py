"""
Pytest fixtures pentru Backend API tests.
Folosește SQLite in-memory pentru teste rapide fără PostgreSQL.
"""

import os
os.environ["TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.main import app
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.document import Document, DocumentStatus
from app.models.notification import Notification, NotificationType
from app.models.report import Report, ReportType, ReportStatus
from app.models.accountant_client import AccountantClient

# SQLite in-memory pentru teste
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Recreează tabelele înainte de fiecare test."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db) -> User:
    """Creează un user client de test."""
    user = User(
        id="test-user-001",
        username="testuser",
        email="test@example.com",
        password_hash=hash_password("password123"),
        full_name="Test User",
        role=UserRole.CLIENT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_contabil(db) -> User:
    """Creează un user contabil de test."""
    user = User(
        id="test-contabil-001",
        username="contabil",
        email="contabil@example.com",
        password_hash=hash_password("password123"),
        full_name="Contabil Test",
        role=UserRole.CONTABIL,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_admin(db) -> User:
    """Creează un user admin de test."""
    user = User(
        id="test-admin-001",
        username="admin",
        email="admin@example.com",
        password_hash=hash_password("password123"),
        full_name="Admin Test",
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user) -> dict:
    """Headers cu JWT token pentru user client."""
    token = create_access_token({"sub": test_user.id, "role": test_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def contabil_headers(test_contabil) -> dict:
    """Headers cu JWT token pentru contabil."""
    token = create_access_token({"sub": test_contabil.id, "role": test_contabil.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_admin) -> dict:
    """Headers cu JWT token pentru admin."""
    token = create_access_token({"sub": test_admin.id, "role": test_admin.role})
    return {"Authorization": f"Bearer {token}"}
