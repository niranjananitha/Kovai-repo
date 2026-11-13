import pytest

from app import create_app

TEST_CONFIG = {"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://", "GOOGLE_CLIENT_ID": "test-client-id"}


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch):
    # Do not let a developer's real backend/.env leak into these tests.
    monkeypatch.setattr("app.load_dotenv", lambda: None)
    monkeypatch.delenv("FLASK_ENV", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)


def test_production_refuses_to_start_without_a_secret_key(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        create_app(TEST_CONFIG)


def test_production_cookie_is_secure_httponly_and_lax(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    monkeypatch.setenv("SECRET_KEY", "a-real-secret")
    app = create_app(TEST_CONFIG)
    assert app.config["SESSION_COOKIE_SECURE"] is True
    assert app.config["SESSION_COOKIE_HTTPONLY"] is True
    assert app.config["SESSION_COOKIE_SAMESITE"] == "Lax"
    assert app.config["SECRET_KEY"] == "a-real-secret"


@pytest.mark.parametrize("value", ["Production", " production ", "PRODUCTION", '"production"'])
def test_production_setting_ignores_case_spaces_and_quotes(monkeypatch, value):
    monkeypatch.setenv("FLASK_ENV", value)
    monkeypatch.setenv("SECRET_KEY", "a-real-secret")
    assert create_app(TEST_CONFIG).config["SESSION_COOKIE_SECURE"] is True


def test_the_session_cookie_sent_to_the_browser_is_secure_in_production(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    monkeypatch.setenv("SECRET_KEY", "a-real-secret")
    app = create_app(TEST_CONFIG)
    res = app.test_client().post("/api/auth/register", json={"name": "A", "email": "a@example.com", "password": "password1"})
    cookie = res.headers["Set-Cookie"]
    assert "Secure" in cookie and "HttpOnly" in cookie and "SameSite=Lax" in cookie


def test_development_does_not_need_a_secret_key_and_cookie_is_not_secure():
    app = create_app(TEST_CONFIG)
    assert app.config["SESSION_COOKIE_SECURE"] is False
    assert app.config["SECRET_KEY"]  # a development fallback is used


def test_session_lifetime_is_seven_days():
    assert create_app(TEST_CONFIG).config["PERMANENT_SESSION_LIFETIME"].days == 7
