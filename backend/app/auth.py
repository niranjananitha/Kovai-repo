import re
import time
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request, session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from .errors import ApiError, json_object
from .models import User, db, normalise_email

auth_bp = Blueprint("auth", __name__)

GOOGLE_ISSUERS = ("accounts.google.com", "https://accounts.google.com")

NAME_MAX = 80
EMAIL_MAX = 255
PASSWORD_MIN = 8
PASSWORD_MAX = 128
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# SECURITY: when someone logs in with an email we do not know, we still check the password
# against this fixed hash. Otherwise "unknown email" would answer faster than "wrong
# password", and an attacker could use the timing to find out which emails have accounts.
DUMMY_HASH = generate_password_hash("not-a-real-password")

# SECURITY: brute-force limit. After 5 failed logins for one email within 15 minutes we
# refuse further attempts (even with the right password) until the oldest failures expire.
# LIMITATION: this lives in memory, so it is per-process: each gunicorn worker counts
# separately and a restart clears it. The production fix is a shared store (Redis or the DB).
MAX_FAILED_LOGINS = 5
LOCKOUT_SECONDS = 15 * 60
_failed_logins = {}  # normalised email -> list of failure times (time.monotonic)


def reset_login_limiter():
    """Used by tests to start each test with a clean slate."""
    _failed_logins.clear()


def _recent_failures(email):
    cutoff = time.monotonic() - LOCKOUT_SECONDS
    recent = [t for t in _failed_logins.get(email, []) if t > cutoff]
    if recent:
        _failed_logins[email] = recent
    else:
        _failed_logins.pop(email, None)
    return len(recent)


def _record_failure(email):
    if len(_failed_logins) > 10000:  # keep memory bounded if someone sprays random emails
        for key in list(_failed_logins):
            _recent_failures(key)
    _failed_logins.setdefault(email, []).append(time.monotonic())


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


def start_session(user):
    """SECURITY: a fresh session that stores only the user id (same for every login method)."""
    session.clear()
    session["user_id"] = user.id
    session.permanent = True  # cookie lasts 7 days (PERMANENT_SESSION_LIFETIME)


def _email_taken_error():
    # This tells the caller that an email has an account. We accept that for the register
    # endpoint: the person needs to know to sign in instead. Login does NOT reveal it.
    return ApiError(409, "email_taken", "An account with this email already exists. Sign in instead.")


# SECURITY: the server checks every field; the browser's checks are only for convenience.
def validate_registration(body):
    name = body.get("name")
    if not isinstance(name, str) or not name.strip():
        raise ApiError(400, "validation_error", "Name is required.")
    name = name.strip()
    if len(name) > NAME_MAX:
        raise ApiError(400, "validation_error", f"Name must be {NAME_MAX} characters or fewer.")

    email = normalise_email(body.get("email"))
    if not isinstance(email, str) or not email:
        raise ApiError(400, "validation_error", "Email is required.")
    if len(email) > EMAIL_MAX or not EMAIL_PATTERN.match(email):
        raise ApiError(400, "validation_error", "Enter a valid email address.")

    # The password is never trimmed (spaces may be part of it) and has no composition rules.
    password = body.get("password")
    if not isinstance(password, str) or len(password) < PASSWORD_MIN:
        raise ApiError(400, "validation_error", f"Password must be at least {PASSWORD_MIN} characters.")
    if len(password) > PASSWORD_MAX:
        raise ApiError(400, "validation_error", f"Password must be {PASSWORD_MAX} characters or fewer.")
    if password.lower() == email:
        raise ApiError(400, "validation_error", "Password must be different from your email address.")
    return name, email, password


@auth_bp.post("/register")
def register():
    name, email, password = validate_registration(json_object())
    if User.query.filter_by(email=email).first():
        raise _email_taken_error()

    # Only a salted hash is stored, made by Werkzeug (scrypt). We never keep the password.
    user = User(email=email, name=name, password_hash=generate_password_hash(password))
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:  # two sign-ups with the same email at the same moment
        db.session.rollback()
        raise _email_taken_error()

    start_session(user)
    return jsonify(user.to_dict()), 201


@auth_bp.post("/login")
def login():
    body = json_object()
    email = normalise_email(body.get("email"))
    password = body.get("password")
    if not isinstance(email, str) or not email or not isinstance(password, str) or not password:
        raise ApiError(400, "validation_error", "Email and password are required.")

    if _recent_failures(email) >= MAX_FAILED_LOGINS:
        raise ApiError(429, "too_many_attempts", "Too many attempts. Try again in a few minutes.")

    user = User.query.filter_by(email=email).first()
    stored_hash = user.password_hash if user else None
    # The hash check always runs (against a dummy when needed) so timing does not leak anything.
    password_ok = check_password_hash(stored_hash or DUMMY_HASH, password)

    # SECURITY: unknown email, wrong password and Google-only accounts all give this same answer.
    if not (user and stored_hash and password_ok):
        _record_failure(email)
        raise ApiError(401, "invalid_credentials", "Email or password is incorrect.")

    _failed_logins.pop(email, None)
    start_session(user)
    return jsonify(user.to_dict())


@auth_bp.post("/google")
def google_login():
    body = request.get_json(silent=True)
    credential = body.get("credential") if isinstance(body, dict) else None
    if not isinstance(credential, str) or not credential:
        raise ApiError(400, "validation_error", "A Google credential is required.")

    claims = verify_google_token(credential)
    sub = claims["sub"]
    email = normalise_email(claims.get("email"))

    # Users are matched on Google's "sub" (permanent id) first, not email (which can change).
    user = User.query.filter_by(google_sub=sub).first()

    if user is None and email:
        existing = User.query.filter_by(email=email).first()
        if existing and existing.google_sub is None:
            # SECURITY: link the Google account to the existing password account AND remove its
            # password. Nobody checked that the person who registered this email with a password
            # owns it, so anyone could have registered someone else's email first (pre-account
            # takeover). Google has just proved who owns the email, so that unverified password
            # must stop working.
            existing.google_sub = sub
            existing.password_hash = None
            user = existing

    if user is None:
        user = User(google_sub=sub)
        db.session.add(user)

    # Copy the email only if nobody else already uses it; otherwise keep what we had
    # (this avoids a database uniqueness error).
    if email and email != user.email and not User.query.filter(User.email == email, User.id != user.id).first():
        user.email = email
    user.name = claims.get("name") or user.name
    user.picture_url = claims.get("picture") or user.picture_url
    db.session.commit()

    start_session(user)
    return jsonify(user.to_dict())


@auth_bp.get("/me")
@login_required
def me():
    return jsonify(g.user.to_dict())


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"status": "ok"})
