import pytest


def make_task(client, **overrides):
    body = {"title": "Write report", "description": "Q3"} | overrides
    return client.post("/api/tasks", json=body)


@pytest.mark.parametrize(
    "method, url, body",
    [
        ("get", "/api/tasks", None),
        ("post", "/api/tasks", {"title": "x"}),
        ("patch", "/api/tasks/1", {"status": "complete"}),
        ("delete", "/api/tasks/1", {}),
    ],
)
def test_every_task_route_is_401_when_signed_out(app, method, url, body):
    res = getattr(app.test_client(), method)(url, json=body)
    assert res.status_code == 401
    assert res.json["error"]["code"] == "not_signed_in"


def test_create_and_list_newest_first(alice):
    make_task(alice, title="first")
    make_task(alice, title="second")
    titles = [t["title"] for t in alice.get("/api/tasks").json]
    assert titles == ["second", "first"]


def test_title_is_trimmed(alice):
    assert make_task(alice, title="  hello  ").json["title"] == "hello"


@pytest.mark.parametrize("title", ["", "   ", None, 5, "x" * 121])
def test_bad_titles_are_400(alice, title):
    res = make_task(alice, title=title)
    assert res.status_code == 400
    assert res.json["error"]["code"] == "validation_error"


def test_title_of_exactly_120_characters_is_allowed(alice):
    assert make_task(alice, title="x" * 120).status_code == 201


def test_missing_title_is_400(alice):
    assert alice.post("/api/tasks", json={"description": "no title"}).status_code == 400


def test_description_is_optional_and_limited(alice):
    assert alice.post("/api/tasks", json={"title": "t"}).json["description"] == ""
    assert make_task(alice, description="x" * 1000).status_code == 201
    assert make_task(alice, description="x" * 1001).status_code == 400
    assert make_task(alice, description=123).status_code == 400


def test_new_task_is_always_planned_even_if_client_sends_another_status(alice):
    res = make_task(alice, status="complete")
    assert res.status_code == 201
    assert res.json["status"] == "planned"


def test_status_can_move_between_any_two_statuses(alice):
    task_id = make_task(alice).json["id"]
    for status in ["complete", "planned", "in_progress", "planned"]:
        res = alice.patch(f"/api/tasks/{task_id}", json={"status": status})
        assert res.status_code == 200
        assert res.json["status"] == status


@pytest.mark.parametrize("status", ["done", "", None, 3, "PLANNED"])
def test_invalid_status_is_400(alice, status):
    task_id = make_task(alice).json["id"]
    assert alice.patch(f"/api/tasks/{task_id}", json={"status": status}).status_code == 400


@pytest.mark.parametrize(
    "body", [{"title": "new"}, {"status": "complete", "title": "new"}, {"status": "complete", "user_id": 99}, {}]
)
def test_patch_rejects_anything_but_status(alice, body):
    task_id = make_task(alice).json["id"]
    assert alice.patch(f"/api/tasks/{task_id}", json=body).status_code == 400
    assert alice.get("/api/tasks").json[0]["title"] == "Write report"


def test_delete_removes_the_task(alice):
    task_id = make_task(alice).json["id"]
    assert alice.delete(f"/api/tasks/{task_id}", json={}).status_code == 200
    assert alice.get("/api/tasks").json == []


def test_missing_task_is_404(alice):
    assert alice.patch("/api/tasks/999", json={"status": "complete"}).status_code == 404
    assert alice.delete("/api/tasks/999", json={}).status_code == 404


def test_user_b_cannot_see_update_or_delete_user_a_tasks(alice, bob):
    task_id = make_task(alice, title="private").json["id"]

    # reading: B's list is empty
    assert bob.get("/api/tasks").json == []
    # updating and deleting: 404, exactly like a task that does not exist
    patch = bob.patch(f"/api/tasks/{task_id}", json={"status": "complete"})
    delete = bob.delete(f"/api/tasks/{task_id}", json={})
    missing = bob.delete("/api/tasks/999", json={})
    assert patch.status_code == 404 and delete.status_code == 404
    assert delete.json == missing.json

    # A's task is untouched
    mine = alice.get("/api/tasks").json
    assert len(mine) == 1 and mine[0]["status"] == "planned"


def test_unexpected_error_returns_json_without_stack_trace(app, alice, monkeypatch):
    app.config["TESTING"] = False  # let our 500 handler run instead of re-raising

    class BrokenTask:
        @property
        def query(self):
            raise RuntimeError("boom")

    monkeypatch.setattr("app.tasks.Task", BrokenTask())
    res = alice.get("/api/tasks")
    assert res.status_code == 500
    assert res.json["error"]["code"] == "server_error"
    assert "Traceback" not in res.get_data(as_text=True)
