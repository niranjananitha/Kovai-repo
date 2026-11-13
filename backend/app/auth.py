from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request, session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .errors import ApiError
from .models import User, db

auth_bp = Blueprint("auth", __name__)

GOOGLE_ISSUERS = ("accounts.google.com", "https://accounts.google.com")


def verify_google_token(credential):
    """Check a Google ID token on the server and return its claims.

    SECURITY: we never trust the browser's claim about who the user is. google-auth
    checks the signature (against Google's public keys), the expiry and the issuer.
    We pass our own client id as the audience, so a token issued for a different app
    is rejected. The extra checks below are a second, explicit safety net.
    """
    client_id = current_app.config["GOOGLE_CLIENT_ID"]
    if not client_id:
        raise ApiError(500, "server_error", "Google sign-in is not configured on the server.")
    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id, clock_skew_in_seconds=10
        )
    except ValueError:
        raise ApiError(401, "invalid_token", "Google sign-in could not be verified. Please try again.")

    if claims.get("aud") != client_id or claims.get("iss") not in GOOGLE_ISSUERS:
        raise ApiError(401, "invalid_token", "Google sign-in could not be verified. Please try again.")
    # An unverified email address could belong to someone else, so we refuse it.
    if not claims.get("email_verified"):
        raise ApiError(401, "email_not_verified", "Your Google email address is not verified.")
    if not claims.get("sub"):
        raise ApiError(401, "invalid_token", "Google sign-in could not be verified. Please try again.")
    return claims


def login_required(view):
    """SECURITY: every task route uses this. The user always comes from the signed
    session cookie, never from anything the client sends in the request body."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        user = db.session.get(User, user_id) if user_id else None
        if user is None:
            session.clear()
            raise ApiError(401, "not_signed_in", "You are not signed in.")
        g.user = user
        return view(*args, **kwargs)

    return wrapper


@auth_bp.post("/google")
def google_login():
    body = request.get_json(silent=True)
    credential = body.get("credential") if isinstance(body, dict) else None
    if not isinstance(credential, str) or not credential:
        raise ApiError(400, "validation_error", "A Google credential is required.")

    claims = verify_google_token(credential)

    # Users are matched on Google's "sub" (permanent id), not email (which can change).
    user = User.query.filter_by(google_sub=claims["sub"]).first()
    if user is None:
        user = User(google_sub=claims["sub"])
        db.session.add(user)
    user.email = claims.get("email")
    user.name = claims.get("name")
    user.picture_url = claims.get("picture")
    db.session.commit()

    # SECURITY: start a fresh session that stores only the user id.
    session.clear()
    session["user_id"] = user.id
    session.permanent = True  # cookie lasts 7 days (PERMANENT_SESSION_LIFETIME)
    return jsonify(user.to_dict())


@auth_bp.get("/me")
@login_required
def me():
    return jsonify(g.user.to_dict())


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"status": "ok"})
