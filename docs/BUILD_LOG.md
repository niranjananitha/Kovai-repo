# Build Log

A short factual entry for each thing that failed during the build.

| # | What failed | Cause | Fix |
| --- | --- | --- | --- |
| 1 | The first scaffold command (a large shell command writing several files) stopped with `unexpected EOF while looking for matching '`'`. Nothing was written. | A quoting problem in the combined shell command. | Wrote each file separately instead of one big shell command. |
| 2 | `pytest`: `test_unexpected_error_returns_json_without_stack_trace` failed with `RuntimeError: Working outside of application context`. | The test replaced `Task.query` with `monkeypatch`, which itself reads `Task.query` outside an app context. | Replaced the whole `Task` name inside `app.tasks` with a small object whose `query` raises an error. All 39 tests then passed. |
| 4 | First Render deploy failed. The build passed, but gunicorn exited at start with `sqlalchemy.exc.ArgumentError: Could not parse SQLAlchemy URL from given URL string`. | The `DATABASE_URL` value entered in Render was not a valid database URL (it was not the `postgresql://...` connection string). | Replaced the value in Render's Environment settings with the real Neon connection string and redeployed; the service then went live. |
| 3 | A command to stop the local Flask test server (`taskkill` of all `python.exe` processes) was denied by the tool's safety check. | The command was broader than needed and was blocked. | Not retried. The server must be stopped by hand if it is still running (see the hand-over notes). |
