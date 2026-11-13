"""One error shape for the whole API: {"error": {"code": "...", "message": "..."}}"""
from flask import jsonify, request
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def json_object():
    """The request body must be a JSON object."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError(400, "validation_error", "Request body must be a JSON object.")
    return body


def error_response(status, code, message):
    return jsonify({"error": {"code": code, "message": message}}), status


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(e):
        return error_response(e.status, e.code, e.message)

    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        # Unknown /api URLs, wrong methods, etc. must be JSON, never an HTML page.
        # Outside /api we keep Flask's normal response.
        if request.path.startswith("/api"):
            return error_response(e.code, e.name.lower().replace(" ", "_"), e.description)
        return e

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        # Log the real error on the server, but never send a stack trace to the client.
        app.logger.exception("Unexpected error")
        return error_response(500, "server_error", "Something went wrong on our side. Please try again.")
