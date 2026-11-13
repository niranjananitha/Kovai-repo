import pytest
import sqlite3

from app import create_app
from app.auth import DUMMY_HASH, MAX_FAILED_LOGINS, reset_login_limiter
from app.models import User, db
from conftest import CLIENT_ID, FAKE_TOKENS, PASSWORD, login, register, sign_in


# ---------- register ----------


def test_register_works_and_starts_a_session(app):
    client = app.test_client()
    res = register(client)
    assert res.status_code == 201
    assert res.json["email"] == "dana@example.com"
    assert res.json["auth_methods"] == {"google": False, "password": True}
    assert client.get("/api/auth/me").json["name"] == "Dana"


def test_email_is_stored_trimmed_and_lowercased(app):
    res = register(app.test_client(), email="  Dana@Example.COM ")
    assert res.json["email"] == "dana@example.com"


def test_duplicate_email_in_a_different_case_is_409(app):
    assert register(app.test_client(), email="dana@example.com").status_code == 201
    res = register(app.test_client(), email="DANA@Example.com")
    assert res.status_code == 409
    assert res.json["error"]["code"] == "email_taken"


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": ""},
        {"name": "   "},
        {"name": None},
        {"name": "x" * 81},
        {"email": ""},
        {"email": "not-an-email"},
        {"email": "a@b"},
        {"email": "two words@example.com"},
        {"email": "x" * 250 + "@example.com"},
        {"email": 5},
        {"password": "short"},
        {"password": "x" * 7},
        {"password": "x" * 129},
        {"password": None},
        {"password": 12345678},
        {"password": "dana@example.com"},
        {"password": "DANA@example.com"},
    ],
)
def test_register_validation_rules_return_400(app, overrides):
    res = register(app.test_client(), **overrides)
    assert res.status_code == 400
    assert res.json["error"]["code"] == "validation_error"


def test_register_requires_a_json_object(app):
    res = app.test_client().post("/api/auth/register", json=["nope"])
    assert res.status_code == 400


def test_password_is_not_trimmed(app):
    client = app.test_client()
    # exactly 8 characters only because of the spaces; trimming would make it 6 and fail
    assert register(client, password="  abcd  ").status_code == 201
    assert login(client, password="abcd").status_code == 401
    assert login(client, password="  abcd  ").status_code == 200


def test_password_may_have_any_characters_and_no_composition_rules(app):
    assert register(app.test_client(), password="aaaaaaaa").status_code == 201


def test_to_dict_never_contains_the_hash(app):
    body = register(app.test_client()).json
    assert "password_hash" not in body and "password" not in body
    with app.app_context():
        user = User.query.filter_by(email="dana@example.com").first()
        assert user.password_hash and user.password_hash not in str(user.to_dict())
        assert PASSWORD not in user.password_hash


# ---------- login ----------


def test_login_works(app):
    register(app.test_client())
    client = app.test_client()
    res = login(client)
    assert res.status_code == 200
    assert client.get("/api/auth/me").json["email"] == "dana@example.com"


def test_login_ignores_email_case_and_spaces(app):
    register(app.test_client())
    assert login(app.test_client(), email="  DANA@example.com ").status_code == 200


def test_logout_then_login_works(app):
    client = app.test_client()
    register(client)
    assert client.post("/api/auth/logout", json={}).status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    assert login(client).status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_wrong_password_unknown_email_and_google_only_account_look_identical(app):
    register(app.test_client())
    sign_in(app.test_client(), "token-alice")  # a Google-only account: alice@example.com

    wrong_password = login(app.test_client(), password="wrong password")
    unknown_email = login(app.test_client(), email="nobody@example.com")
    google_only = login(app.test_client(), email="alice@example.com", password="anything at all")

    for res in (wrong_password, unknown_email, google_only):
        assert res.status_code == 401
        assert res.json["error"]["code"] == "invalid_credentials"
    assert wrong_password.json == unknown_email.json == google_only.json
    assert wrong_password.json["error"]["message"] == "Email or password is incorrect."


def test_login_checks_a_dummy_hash_for_unknown_emails(app, monkeypatch):
    seen = []

    def spy(stored_hash, password):
        seen.append(stored_hash)
        return False

    monkeypatch.setattr("app.auth.check_password_hash", spy)
    login(app.test_client(), email="nobody@example.com")
    assert seen == [DUMMY_HASH]


def test_login_validation(app):
    client = app.test_client()
    assert client.post("/api/auth/login", json={"email": "a@b.co"}).status_code == 400
    assert client.post("/api/auth/login", json={"password": "x"}).status_code == 400
    assert client.post("/api/auth/login", json={"email": 5, "password": "x"}).status_code == 400


def test_sixth_failed_attempt_is_429_and_even_the_right_password_is_refused(app):
    register(app.test_client())
    for _ in range(MAX_FAILED_LOGINS):
        assert login(app.test_client(), password="wrong password").status_code == 401

    blocked = login(app.test_client(), password="wrong password")
    assert blocked.status_code == 429
    assert blocked.json["error"]["code"] == "too_many_attempts"
    assert login(app.test_client()).status_code == 429  # correct password, still refused

    reset_login_limiter()
    assert login(app.test_client()).status_code == 200


def test_limit_is_per_email_and_success_resets_the_count(app):
    register(app.test_client())
    for _ in range(MAX_FAILED_LOGINS - 1):
        login(app.test_client(), password="wrong password")
    assert login(app.test_client()).status_code == 200  # success resets the counter
    for _ in range(MAX_FAILED_LOGINS - 1):
        login(app.test_client(), password="wrong password")
    assert login(app.test_client()).status_code == 200
    # a different email is not affected by someone else's failures
    for _ in range(MAX_FAILED_LOGINS):
        login(app.test_client(), email="other@example.com", password="x")
    assert login(app.test_client()).status_code == 200


def test_password_routes_need_json_content_type(app):
    client = app.test_client()
    assert client.post("/api/auth/login", data="email=a").status_code == 415
    assert client.post("/api/auth/register", data="email=a").status_code == 415


# ---------- Google sign-in meeting password accounts ----------


def test_google_sign_in_links_a_matching_password_account_and_kills_the_password(app):
    # someone registers alice@example.com with a password (nobody verified the email)...
    register(app.test_client(), name="Not Alice", email="alice@example.com", password="attackers password")
    # ...then the real Alice signs in with Google
    client = app.test_client()
    res = sign_in(client, "token-alice")
    assert res.status_code == 200
    assert res.json["auth_methods"] == {"google": True, "password": False}

    with app.app_context():
        assert User.query.filter_by(email="alice@example.com").count() == 1  # linked, not duplicated
    # the password set before Google proved ownership no longer works
    res = login(app.test_client(), email="alice@example.com", password="attackers password")
    assert res.status_code == 401


def test_google_sign_in_with_an_email_already_used_by_someone_else_does_not_crash(app, monkeypatch):
    sign_in(app.test_client(), "token-alice")  # Google user: sub-alice, alice@example.com
    register(app.test_client(), email="taken@example.com")  # password user owns this email

    # Alice's Google account now reports the other person's email
    monkeypatch.setitem(
        FAKE_TOKENS,
        "token-alice",
        {"sub": "sub-alice", "email": "taken@example.com", "name": "Alice", "email_verified": True},
    )
    client = app.test_client()
    res = sign_in(client, "token-alice")
    assert res.status_code == 200
    assert res.json["email"] == "alice@example.com"  # kept the old email


def test_google_account_whose_email_belongs_to_another_google_account_does_not_crash(app, monkeypatch):
    sign_in(app.test_client(), "token-alice")
    monkeypatch.setitem(
        FAKE_TOKENS,
        "token-twin",
        {"sub": "sub-twin", "email": "alice@example.com", "name": "Twin", "email_verified": True},
    )
    res = sign_in(app.test_client(), "token-twin")
    assert res.status_code == 200
    assert res.json["email"] is None


def test_google_sign_in_normalises_the_email(app, monkeypatch):
    monkeypatch.setitem(
        FAKE_TOKENS, "token-caps", {"sub": "sub-caps", "email": "Caps@Example.com", "email_verified": True}
    )
    assert sign_in(app.test_client(), "token-caps").json["email"] == "caps@example.com"


# ---------- old database schema ----------


def test_old_sqlite_schema_is_refused_with_a_clear_message(tmp_path):
    db_file = tmp_path / "old.db"
    connection = sqlite3.connect(db_file)
    connection.execute(
        "CREATE TABLE users (id INTEGER PRIMARY KEY, google_sub VARCHAR(255) NOT NULL UNIQUE, "
        "email VARCHAR(255), name VARCHAR(255), picture_url VARCHAR(1000), created_at DATETIME NOT NULL)"
    )
    connection.commit()
    connection.close()

    with pytest.raises(RuntimeError, match="old schema"):
        create_app({"SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_file.as_posix()}", "GOOGLE_CLIENT_ID": CLIENT_ID})


def test_new_schema_starts_fine_and_upgrade_can_run_twice(app):
    from app.schema import upgrade_old_schema

    with app.app_context():
        upgrade_old_schema()
        upgrade_old_schema()
        assert db.engine.dialect.name == "sqlite"
