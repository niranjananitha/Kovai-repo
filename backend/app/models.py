from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates

db = SQLAlchemy()

# The single source of truth for task statuses on the backend.
# (value stored in the database -> label shown to people)
STATUSES = {
    "planned": "Planned",
    "in_progress": "In Progress",
    "complete": "Complete",
}
DEFAULT_STATUS = "planned"


def utcnow():
    """Timestamps are always set by the server, in UTC."""
    return datetime.now(timezone.utc)


def iso(dt):
    """Format a datetime as UTC ISO text. SQLite returns naive values, so assume UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def normalise_email(value):
    """Emails are compared and stored trimmed and lowercased."""
    return value.strip().lower() if isinstance(value, str) else value


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    # Google's stable account id (the token's "sub"). Empty for password-only accounts.
    google_sub = db.Column(db.String(255), unique=True)
    email = db.Column(db.String(255), unique=True)
    name = db.Column(db.String(255))
    picture_url = db.Column(db.String(1000))
    # Werkzeug password hash. Empty for Google-only accounts. Never sent to the client.
    password_hash = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    @validates("email")
    def _normalise_email(self, key, value):
        return normalise_email(value)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "picture_url": self.picture_url,
            "auth_methods": {"google": self.google_sub is not None, "password": self.password_hash is not None},
        }


class Task(db.Model):
    __tablename__ = "tasks"
    # Second line of defence: the database itself refuses an unknown status.
    __table_args__ = (
        CheckConstraint("status IN ('planned', 'in_progress', 'complete')", name="ck_tasks_status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True, nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(1000), nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default=DEFAULT_STATUS)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": iso(self.created_at),
            "updated_at": iso(self.updated_at),
        }
