"""Bring an older users table up to date, because db.create_all() never alters existing tables.

Production (Neon) was created when users.google_sub was NOT NULL and there was no
password_hash column. This runs at startup and is safe to run again and again.
The SQL below is fixed text with no user input, so there is no injection risk.
"""
from flask import current_app
from sqlalchemy import inspect, text

from .models import db

# The same statements are in the README so they can be run by hand on Neon.
POSTGRES_STATEMENTS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
    "ALTER TABLE users ALTER COLUMN google_sub DROP NOT NULL",
    "UPDATE users SET email = lower(trim(email)) WHERE email IS NOT NULL AND email <> lower(trim(email))",
]
DUPLICATE_EMAILS_SQL = "SELECT lower(email) FROM users WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1"
EMAIL_INDEX_SQL = "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"


def _email_is_unique(inspector):
    for constraint in inspector.get_unique_constraints("users"):
        if constraint["column_names"] == ["email"]:
            return True
    return any(i["unique"] and i["column_names"] == ["email"] for i in inspector.get_indexes("users"))


def upgrade_old_schema():
    dialect = db.engine.dialect.name
    if dialect == "postgresql":
        _upgrade_postgres()
    elif dialect == "sqlite":
        _check_sqlite()


def _upgrade_postgres():
    with db.engine.begin() as conn:
        # Several gunicorn workers start at once; the lock makes them take turns.
        conn.execute(text("SELECT pg_advisory_xact_lock(48931)"))
        for statement in POSTGRES_STATEMENTS:
            conn.execute(text(statement))
        if _email_is_unique(inspect(conn)):
            return
        if conn.execute(text(DUPLICATE_EMAILS_SQL)).first():
            current_app.logger.warning(
                "users.email has duplicates, so the unique index was NOT created. Fix them, then restart."
            )
        else:
            conn.execute(text(EMAIL_INDEX_SQL))


def _check_sqlite():
    columns = {c["name"]: c for c in inspect(db.engine).get_columns("users")}
    if "password_hash" not in columns or not columns["google_sub"]["nullable"]:
        raise RuntimeError(
            "Local database uses the old schema. Delete backend/instance/taskflow.db and restart."
        )
