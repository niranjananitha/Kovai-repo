import pytest

from app import create_app
from app.auth import reset_login_limiter

CLIENT_ID = "test-client-id"

# Fake Google tokens: the "credential" string maps straight to the claims Google would return.
# No network is used anywhere in the tests.
FAKE_TOKENS = {
    "token-alice": {"sub": "sub-alice", "email": "alice@example.com", "name": "Alice", "email_verified": True},
    "token-bob": {"sub": "sub-bob", "email": "bob@example.com", "name": "Bob", "email_verified": True},
    "token-unverified": {"sub": "sub-carol", "email": "carol@example.com", "email_verified": False},
}


def fake_verify_oauth2_token(credential, request, audience=None, **kwargs):
    claims = FAKE_TOKENS.get(credential)
    if claims is None:
        raise ValueError("Could not verify token")  # what google-auth raises for bad tokens
    return {"iss": "https://accounts.google.com", "aud": audience, **claims}


@pytest.fixture
def app(monkeypatch):
    monkeypatch.setattr("app.auth.id_token.verify_oauth2_token", fake_verify_oauth2_token)
    return create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://", "GOOGLE_CLIENT_ID": CLIENT_ID})


@pytest.fixture(autouse=True)
def clean_login_limiter():
    """The failed-login counter is in memory, so reset it around every test."""
    reset_login_limiter()
    yield
    reset_login_limiter()


def sign_in(client, credential):
    return client.post("/api/auth/google", json={"credential": credential})


PASSWORD = "correct horse"


def register(client, name="Dana", email="dana@example.com", password=PASSWORD, **extra):
    return client.post("/api/auth/register", json={"name": name, "email": email, "password": password, **extra})


def login(client, email="dana@example.com", password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


@pytest.fixture
def alice(app):
    client = app.test_client()
    assert sign_in(client, "token-alice").status_code == 200
    return client


@pytest.fixture
def bob(app):
    client = app.test_client()
    assert sign_in(client, "token-bob").status_code == 200
    return client
