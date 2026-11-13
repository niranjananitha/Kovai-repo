from flask import Blueprint, g, jsonify

from .auth import login_required
from .errors import ApiError, json_object
from .models import DEFAULT_STATUS, STATUSES, Task, db

tasks_bp = Blueprint("tasks", __name__)

TITLE_MAX = 120
DESCRIPTION_MAX = 1000


def get_own_task(task_id):
    """SECURITY: look the task up by id AND the signed-in user's id. Someone else's
    task is indistinguishable from a missing one (both 404), so ids cannot be probed."""
    task = Task.query.filter_by(id=task_id, user_id=g.user.id).first()
    if task is None:
        raise ApiError(404, "not_found", "Task not found.")
    return task


# SECURITY: the server validates everything (types, trimming, lengths, status values).
# The browser checks too, but only for convenience; it can be bypassed.
def validate_new_task(body):
    title = body.get("title")
    if not isinstance(title, str):
        raise ApiError(400, "validation_error", "Title is required.")
    title = title.strip()
    if not title:
        raise ApiError(400, "validation_error", "Title is required.")
    if len(title) > TITLE_MAX:
        raise ApiError(400, "validation_error", f"Title must be {TITLE_MAX} characters or fewer.")

    description = body.get("description", "")
    if description is None:
        description = ""
    if not isinstance(description, str):
        raise ApiError(400, "validation_error", "Description must be text.")
    description = description.strip()
    if len(description) > DESCRIPTION_MAX:
        raise ApiError(400, "validation_error", f"Description must be {DESCRIPTION_MAX} characters or fewer.")
    return title, description


@tasks_bp.get("")
@login_required
def list_tasks():
    tasks = Task.query.filter_by(user_id=g.user.id).order_by(Task.created_at.desc(), Task.id.desc()).all()
    return jsonify([t.to_dict() for t in tasks])


@tasks_bp.post("")
@login_required
def create_task():
    title, description = validate_new_task(json_object())
    # The status is never read from the request: new tasks always start as Planned.
    task = Task(user_id=g.user.id, title=title, description=description, status=DEFAULT_STATUS)
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.patch("/<int:task_id>")
@login_required
def update_task(task_id):
    task = get_own_task(task_id)
    body = json_object()
    # Only "status" may be changed. Anything else is rejected, not silently ignored.
    if set(body) != {"status"}:
        raise ApiError(400, "validation_error", "Only the status can be changed.")
    status = body["status"]
    if not isinstance(status, str) or status not in STATUSES:
        raise ApiError(400, "validation_error", "Status must be one of: " + ", ".join(STATUSES) + ".")
    task.status = status
    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.delete("/<int:task_id>")
@login_required
def delete_task(task_id):
    task = get_own_task(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"status": "ok"})
