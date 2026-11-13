from conftest import sign_in


def test_sign_in_creates_user_and_session(app):
    client = app.test_client()
    res = sign_in(client, "token-alice")
    assert res.status_code == 200
    assert res.json["email"] == "alice@example.com"
    assert client.get("/api/auth/me").json["name"] == "Alice"


def test_sign_in_twice_reuses_the_same_user(app):
    first = sign_in(app.test_client(), "token-alice").json["id"]
    second = sign_in(app.test_client(), "token-alice").json["id"]
    assert first == second


def test_me_is_401_when_signed_out(app):
    res = app.test_client().get("/api/auth/me")
    assert res.status_code == 401
    assert res.json["error"]["code"] == "not_signed_in"


def test_logout_clears_the_session(alice):
    assert alice.post("/api/auth/logout", json={}).status_code == 200
    assert alice.get("/api/auth/me").status_code == 401


def test_invalid_token_is_rejected(app):
    assert sign_in(app.test_client(), "garbage").status_code == 401


def test_token_with_wrong_audience_is_rejected(app, monkeypatch):
    def wrong_audience(credential, request, audience=None, **kwargs):
        return {"iss": "https://accounts.google.com", "aud": "some-other-app", "sub": "x", "email_verified": True}

    monkeypatch.setattr("app.auth.id_token.verify_oauth2_token", wrong_audience)
    client = app.test_client()
    assert sign_in(client, "anything").status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_unverified_email_is_rejected(app):
    assert sign_in(app.test_client(), "token-unverified").status_code == 401


def test_missing_credential_is_400(app):
    res = app.test_client().post("/api/auth/google", json={})
    assert res.status_code == 400


def test_post_without_json_content_type_is_rejected(app):
    res = app.test_client().post("/api/auth/logout", data="x=1")
    assert res.status_code == 415


def test_health_and_unknown_api_route_return_json(app):
    client = app.test_client()
    assert client.get("/api/health").json == {"status": "ok"}
    res = client.get("/api/does-not-exist")
    assert res.status_code == 404
    assert res.json["error"]["code"] == "not_found"
