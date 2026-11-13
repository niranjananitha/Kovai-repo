import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

from .errors import ApiError, register_error_handlers
from .models import db

# Built frontend, served by Flask in production (see Dockerfile).
DIST_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app(test_config=None):
    load_dotenv()  # reads backend/.env in development; harmless if the file is missing
    app = Flask(__name__, static_folder=None)

    is_production = os.environ.get("FLASK_ENV") == "production"
    secret_key = os.environ.get("SECRET_KEY")

    # SECURITY: refuse to start in production without a real secret, because the
    # session cookie is signed with it. A missing key would let anyone forge logins.
    if is_production and not secret_key:
        raise RuntimeError("SECRET_KEY must be set when FLASK_ENV=production")

    # DATABASE_URL (Postgres on Neon) in production; a local SQLite file otherwise.
    database_url = os.environ.get("DATABASE_URL") or "sqlite:///taskflow.db"
    # Neon URLs start with postgres:// or postgresql:// ; SQLAlchemy + psycopg 3 needs this prefix.
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    app.config.update(
        SECRET_KEY=secret_key or "dev-only-secret-change-me",
        GOOGLE_CLIENT_ID=os.environ.get("GOOGLE_CLIENT_ID", ""),
        SQLALCHEMY_DATABASE_URI=database_url,
        # pool_pre_ping tests a connection before using it, so one dropped by a
        # sleeping database is replaced instead of causing an error.
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        # SECURITY: the session is a signed cookie holding only the user id.
        # HttpOnly = JavaScript cannot read it. SameSite=Lax = browsers do not send it
        # on cross-site POST/PATCH/DELETE requests. Secure = HTTPS only (production).
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=is_production,
        PERMANENT_SESSION_LIFETIME=timedelta(days=7),
    )
    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    register_error_handlers(app)

    from .auth import auth_bp
    from .tasks import tasks_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")

    @app.get("/api/health")
    def health():
        # Does not touch the session or database, so it is a cheap "is it awake" check.
        return jsonify({"status": "ok"})

    @app.before_request
    def require_json_content_type():
        # SECURITY (CSRF): this check, plus SameSite=Lax cookies, plus having no CORS
        # headers, is our CSRF protection.
        #  - A plain HTML form on another site can only send form content types.
        #  - Sending "application/json" from another site needs a CORS preflight,
        #    and we never approve it, so the browser blocks the request.
        #  - SameSite=Lax also keeps the cookie off cross-site POST/PATCH/DELETE.
        if (
            request.path.startswith("/api")
            and request.method in ("POST", "PATCH", "DELETE")
            and request.mimetype != "application/json"
        ):
            raise ApiError(415, "unsupported_media_type", "Requests must use Content-Type: application/json.")

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def serve_frontend(path):
        # Unknown /api paths are errors, not pages.
        if path == "api" or path.startswith("api/"):
            raise ApiError(404, "not_found", "That API route does not exist.")
        # Real built files (JS, CSS, icons) are served as they are; every other path
        # returns index.html so refreshing the browser on any URL still works.
        if path and (DIST_DIR / path).is_file():
            return send_from_directory(DIST_DIR, path)
        if (DIST_DIR / "index.html").is_file():
            return send_from_directory(DIST_DIR, "index.html")
        return "Frontend not built. Run the Vite dev server (see README) or npm run build.", 404

    # No migration tool: tables are created at startup. Known limitation (see README).
    with app.app_context():
        db.create_all()

    return app
