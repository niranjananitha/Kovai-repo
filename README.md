# TaskFlow

A single-page personal task list. Sign in with Google, add tasks, move them between **Planned / In Progress / Complete**, filter by status, and delete them. Each person sees only their own tasks.

**Live app:** https://taskflow-zb8j.onrender.com (free hosting: the first load can take up to a minute)

## Architecture

One repository, one deployed service. The React frontend is built into static files (`frontend/dist`). In production the Flask backend serves those files **and** the JSON API under `/api` from the same origin, so there is no CORS and no second server. In development the Vite dev server proxies `/api` to Flask, which behaves the same way. Sign-in uses Google's ID-token flow: the browser gets a signed token from Google, the backend verifies it with `google-auth`, finds or creates the user, and stores only the user id in a signed, HttpOnly session cookie. Data lives in PostgreSQL (Neon) in production and SQLite locally.

## Stack

| Piece | Why |
| --- | --- |
| React + Vite (JavaScript) | Simple component model and a fast dev/build tool |
| Tailwind CSS | Styling without writing a CSS framework by hand |
| @react-oauth/google | Official-style Google sign-in button |
| Flask (app factory) | Small, readable web framework |
| Flask-SQLAlchemy | All DB access through an ORM, so no string-built SQL |
| google-auth | Google's own library for verifying ID tokens |
| gunicorn | Production WSGI server |
| PostgreSQL (Neon) / SQLite | Free hosted DB in production, zero-setup locally |
| pytest / Vitest | Backend API tests / frontend helper tests |
| Render | Free hosting for one web service |

## Local setup

You need Python 3.11+ and Node 20+. You also need a Google OAuth **Web** client ID:
Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application. Under **Authorized JavaScript origins** add `http://localhost:5173`. (If you use a Firebase project, it is the same Google Cloud project.) Copy the Client ID.

### Backend

```bash
cd backend
python -m venv venv
# Windows PowerShell:  .\venv\Scripts\Activate.ps1
# macOS / Linux / Git Bash:  source venv/bin/activate   (Git Bash on Windows: source venv/Scripts/activate)
pip install -r requirements-dev.txt
cp .env.example .env        # then edit .env: set GOOGLE_CLIENT_ID (leave the rest empty locally)
flask --app wsgi run --port 5000
```

With no `DATABASE_URL`, a SQLite file (`backend/instance/taskflow.db`) is created automatically.

### Frontend (second terminal)

```bash
cd frontend
npm install
cp .env.example .env        # then edit .env: set VITE_GOOGLE_CLIENT_ID (same value as above)
npm run dev
```

Open <http://localhost:5173> and sign in.

### Tests and build

```bash
cd backend && pytest            # API tests (no network; Google verification is faked)
cd frontend && npm test         # Vitest: validation and status helpers
cd frontend && npm run build    # production build into frontend/dist
```

To try the production setup locally, run `npm run build` in `frontend`, then `flask --app wsgi run --port 5000` in `backend` and open <http://localhost:5000>.

## Deploy (Render, free)

1. Push this repo to GitHub.
2. Create a free PostgreSQL database on [Neon](https://neon.tech) and copy its connection string.
3. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml`.
4. When asked, fill in `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` (both are your Google Client ID) and `DATABASE_URL` (the Neon string). `SECRET_KEY` is generated for you.
5. After the first deploy, copy your `https://….onrender.com` URL into Google Cloud Console → your OAuth client → **Authorized JavaScript origins**. Update the live URL at the top of this file.

Render's Python runtime includes Node, so the build command installs Python packages and runs `npm ci && npm run build` in one go. The free service sleeps when idle; the first request can take up to a minute.

## API

All requests and responses are JSON. `POST`, `PATCH` and `DELETE` must send `Content-Type: application/json`. Errors look like `{"error": {"code": "...", "message": "..."}}`.

| Method | Path | Description | Errors |
| --- | --- | --- | --- |
| POST | `/api/auth/google` | Body `{credential}`. Verifies the Google token, signs in, returns the user | 400, 401 |
| GET | `/api/auth/me` | Current user | 401 |
| POST | `/api/auth/logout` | Ends the session | |
| GET | `/api/tasks` | Your tasks, newest first | 401 |
| POST | `/api/tasks` | Body `{title, description?}`. Status is always `planned` | 400, 401 |
| PATCH | `/api/tasks/<id>` | Body `{status}` only | 400, 401, 404 |
| DELETE | `/api/tasks/<id>` | Deletes a task | 401, 404 |
| GET | `/api/health` | `{"status": "ok"}`, no session needed | |

Status codes: 400 validation, 401 not signed in, 404 not found (also used for other people's tasks), 415 wrong content type, 500 unexpected.

## Security summary

- The Google ID token is verified on the server (signature, expiry, issuer, audience = our client ID, `email_verified`). Users are identified by the token's `sub`.
- Session: signed cookie with only the user id; HttpOnly, SameSite=Lax, Secure in production, 7 days. The app refuses to start in production without `SECRET_KEY`.
- Every task query is filtered by the session's user id; someone else's task returns 404.
- CSRF: JSON-only content type + SameSite=Lax + no CORS (explained in `backend/app/__init__.py`).
- The server validates all input; all DB access goes through SQLAlchemy.

## Known limitations

- No database migrations: tables are created with `db.create_all()` at startup, so changing a column later needs a manual change.
- Titles and descriptions cannot be edited after creation.
- No pagination (meant for up to a few hundred tasks per user), no account deletion, no data export.
- Free hosting sleeps when idle, so the first load is slow.

## Project structure

```
render.yaml            Render deploy blueprint
backend/
  wsgi.py              gunicorn entry point
  requirements*.txt    Python dependencies
  .env.example         backend settings template
  app/
    __init__.py        create_app: config, security settings, serving the frontend
    models.py          User and Task tables, status list
    auth.py            Google token check, session, /api/auth routes
    tasks.py           /api/tasks routes and validation
    errors.py          one JSON error format
  tests/               pytest API tests
frontend/
  .env.example         frontend settings template
  vite.config.js       Vite + Tailwind + /api proxy
  src/
    main.jsx           entry, Google provider
    App.jsx            session check, login vs task board
    api.js             fetch wrapper and error messages
    status.js          statuses, labels, filter and count helpers
    validation.js      title/description checks
    *.test.js          Vitest tests
    components/        Header, LoginScreen, TaskForm, FilterTabs, TaskItem, TaskBoard, Loading
docs/                  USER_GUIDE, ASSUMPTIONS, AI_USAGE, BUILD_LOG
```
