# AI Usage

## Tools used

- **Claude Code (Claude Sonnet 5.5)**, an AI coding assistant running in the terminal. It was given the prompt below and, after a planning reply, generated the backend, frontend, tests, deployment config and documentation in this repository, running the tests and the frontend build as it went.

## How it was used

1. The prompt below was given to the assistant.
2. The assistant replied with a planned file tree and a list of questions and ambiguities before writing code.
3. It then built the project in steps, with a git commit after each step, and ran the backend tests, frontend tests and frontend build.
4. It checked Render's documentation to decide between a Python build with Node and a Dockerfile (the Python runtime includes Node, so `render.yaml` is used).

## Later change request

After the first deployment, a second prompt asked the assistant to (1) add email and password accounts alongside Google sign-in, with login rate limiting and a startup upgrade for the existing database, and (2) redesign the frontend as a board/list task manager with drag and drop, search, keyboard shortcuts and undo-delete, following a stated visual direction and in three phases with a stop after each. The assistant implemented both, ran the backend and frontend tests and the build, and checked the running app in a browser. The full text of that second prompt is not reproduced here.

## Manual changes and corrections

TODO: to be written by the project owner. Describe honestly what you reviewed, tested, changed or corrected yourself.

## The prompt

````text
I'm building a small task management web app as a hiring assessment for a
Graduate Support Engineer Trainee role. Reviewers will read the code, open the
live URL, and read the documentation. They score requirement understanding,
simplicity, documentation and a working deployment far more than feature
count, and the brief explicitly says not to expand the scope. I also have to
explain every file in an interview. So: build exactly what is listed below,
keep the code small and readable, and do not add features I have not listed.
If you think something is missing, ask me instead of adding it.

WHAT TO BUILD
"TaskFlow", a single-page personal task list.
- Sign in with Google (the only login method) and sign out.
- Create a task: title (required, trimmed, 1-120 characters) and description
  (optional, max 1000 characters). New tasks always start as Planned.
- View my own tasks, newest first, with filter tabs All / Planned /
  In Progress / Complete, each showing a count.
- Change a task's status from a dropdown on the task. Any status can change
  to any other status.
- Delete a task after a confirmation step.
Out of scope, do not build: editing a title or description, due dates,
priorities, tags, search, sharing or teams, drag-and-drop, dark mode,
profile or settings pages, multiple routes, notifications, pagination,
admin screens.

ARCHITECTURE
One repository, two folders, one deployed service.
- frontend/  React + Vite, JavaScript (not TypeScript), function components
  and hooks, Tailwind CSS. Google sign-in button via @react-oauth/google.
- backend/   Flask with an app factory, Flask-SQLAlchemy, google-auth for
  verifying Google ID tokens, gunicorn for production.
- In production Flask serves the built frontend (frontend/dist) and the API
  under /api, from the same origin. In development the Vite dev server
  proxies /api to Flask on port 5000. Because everything is same-origin, do
  not add Flask-CORS or any CORS headers.
- Database: PostgreSQL in production through a DATABASE_URL env var (I will
  use Neon). Fall back to a local SQLite file when DATABASE_URL is not set,
  and use in-memory SQLite in tests. Set pool_pre_ping so a connection
  dropped by a sleeping database is retried.
- Create tables with db.create_all() at startup. No migration tool; note
  that as a known limitation.
- Use current stable versions and check official docs rather than relying
  on memory for setup steps.
- No other dependencies without asking me first. In particular no
  Flask-Login, Flask-Migrate, Marshmallow, JWT library, Redux, React Router
  or UI component kit.

DATA MODEL
- users: id, google_sub (unique, not null), email, name, picture_url,
  created_at.
- tasks: id, user_id (foreign key to users, indexed, not null), title,
  description (default empty string), status, created_at, updated_at.
- status is one of "planned", "in_progress", "complete", enforced by a
  database check constraint as well as in code. Keep the values and their
  display labels in one place on each side.
- Timestamps are stored in UTC and set by the server, never by the client.

API (all JSON)
- POST   /api/auth/google   body {credential}; verifies the Google ID token,
                            finds or creates the user, starts the session,
                            returns the user
- GET    /api/auth/me       returns the current user, or 401
- POST   /api/auth/logout   clears the session
- GET    /api/tasks         the current user's tasks, newest first
- POST   /api/tasks         body {title, description}; status is always set
                            to "planned" by the server
- PATCH  /api/tasks/<id>    body {status} only; any other field is rejected
- DELETE /api/tasks/<id>
- GET    /api/health        returns ok without touching the session
Errors use one shape, {"error": {"code": "...", "message": "..."}}, with
correct status codes: 400 validation, 401 not signed in, 404 not found,
500 unexpected. Never return a stack trace or an HTML error page from /api.

SECURITY (the part reviewers will ask me about)
- Verify the ID token on the server with google-auth: signature, expiry,
  issuer, and audience equal to my GOOGLE_CLIENT_ID. Reject tokens where
  email_verified is false. Identify users by the token's "sub", not email.
- Session: Flask's signed cookie holding only the user id. HttpOnly,
  SameSite=Lax, Secure in production, 7-day lifetime. SECRET_KEY comes from
  an env var and the app must refuse to start in production without it.
- Every task query is filtered by the session's user id. A task that
  belongs to someone else returns 404, the same as one that does not exist.
- State-changing routes accept only Content-Type application/json. Together
  with SameSite=Lax and no CORS, that is the CSRF protection; explain this
  in a comment so I can explain it too.
- Validate everything on the server (types, trimming, lengths, status
  values). Client-side validation is for user experience only.
- All database access goes through SQLAlchemy; no string-built SQL.
- Put a short plain-English comment above each security-relevant block.

USER EXPERIENCE
- On load, call /api/auth/me and show a loading state until it answers, so
  the login screen never flashes for a signed-in user.
- The free host sleeps when idle and takes up to a minute to wake. If the
  first request takes more than about 5 seconds, show "Waking up the
  server, this can take up to a minute" instead of a bare spinner.
- Empty states: one for "no tasks yet", one for "no tasks in this filter".
- Errors in plain language for: sign-in cancelled or failed, network
  failure, session expired (send the user back to login), validation.
  Never show only a raw error code. A failed write must be visible.
- The Add button is disabled while submitting and when the title is empty.
  Enter submits. Show a character count as the title nears its limit.
- Show the signed-in user's name or email in the header beside Sign out.
- Accessibility: every input has a label, controls are real buttons and
  selects, focus is visible, everything works by keyboard, and status is
  never conveyed by colour alone.
- Responsive down to a 360px wide phone screen. Clean and plain.

CONFIG AND SECRETS
- Backend env vars: SECRET_KEY, GOOGLE_CLIENT_ID, DATABASE_URL, FLASK_ENV.
  Frontend: VITE_GOOGLE_CLIENT_ID. Commit .env.example files for both.
  Make sure real .env files are in .gitignore before the first commit.
- I will create the Google OAuth client, the Neon database and the Render
  service myself. Do not invent client IDs, URLs or connection strings.
  When you need one, stop and tell me exactly what to click and what to
  paste back.

DEPLOYMENT (Render free web service)
- The deploy must build the frontend and install backend dependencies, then
  start gunicorn. Check Render's current docs for whether its Python
  runtime can run the Node build step. If it cannot, use a small multi-stage
  Dockerfile instead. Tell me which you chose and why before writing it.
- Add a render.yaml or clear dashboard steps, whichever is simpler.
- Unknown non-API paths must return index.html so a browser refresh works.

TESTS
- pytest for the API, with the Google token verification replaced by a fake
  so tests need no network. Cover at least: every task route returns 401
  when signed out; title and status validation; a new task is always
  "planned" even if the client sends another status; PATCH rejects fields
  other than status; user B gets 404 reading, updating or deleting user A's
  task; a token with the wrong audience is rejected.
- Vitest for the frontend validation and status helpers only.

DOCUMENTATION (graded as heavily as the code)
- README.md: what the app is, live URL (placeholder until deployed), an
  architecture paragraph, the stack with a one-line reason each, local
  setup for backend and frontend, how to run tests, how to deploy, the API
  table, project structure.
- docs/USER_GUIDE.md, written for a non-technical user: how to access the
  app, how to log in, how to do each action, important notes and warnings,
  known limitations, and a short troubleshooting table. Warnings must
  include: the first load can take up to a minute because the free server
  sleeps; in-app browsers (Instagram, WhatsApp, LinkedIn) may block Google
  sign-in, so open the link in Chrome or Safari; cookies must be enabled;
  deleting a task is permanent; sign out on shared computers; the session
  ends after 7 days.
- docs/ASSUMPTIONS.md: a table of gap, assumption, reason, using the list
  below. Add a row only if you find a real gap I missed, and tell me.
- docs/AI_USAGE.md: which AI tools were used and how, plus this prompt.
  Leave a section titled "Manual changes and corrections" with a TODO for
  me. Do not write any claim about what I changed, reviewed or tested; that
  section has to be true and I will write it.
- docs/BUILD_LOG.md: a short factual entry each time something fails during
  the build (the error, the cause, the fix).

ASSUMPTIONS ALREADY DECIDED
1. Tasks are private to the user who created them.
2. Task fields are title, optional description, status, created and updated
   time. No due date or priority.
3. New tasks start as Planned.
4. Any status can change to any other status.
5. Delete is included, with confirmation, so mistakes can be removed.
6. Editing a title is not included; listed as a known limitation.
7. Sign-out is included.
8. Google is the only login method.
9. List is newest first with status filter tabs and counts.
10. The session lasts 7 days or until sign-out.
11. Loading, empty and error states are shown explicitly.
12. No pagination; intended for up to a few hundred tasks per user.
13. Works on phone and desktop browsers.
14. No account deletion or data export.

HOW TO WORK
1. Before writing any code, reply with the planned file tree and anything
   in this brief that is ambiguous, contradictory or that you think is a
   mistake. Wait for my OK.
2. Build in this order, with a git commit after each step: backend scaffold
   and models, auth routes, task routes, backend tests, frontend scaffold
   and sign-in, task UI, loading/empty/error states, production serving and
   deploy config, documentation.
3. After each step, tell me what to check by hand, with the exact curl
   command or browser action.
4. Run the tests and the frontend build before telling me a step is done,
   and show the output. If something cannot be verified from the terminal,
   such as the real Google sign-in, say so plainly instead of saying it
   works.
5. Never commit a .env file or any credential. Do not run git push or
   trigger a deploy yourself; give me the commands to run.

DONE MEANS
- A fresh clone runs locally by following the README, with no step missing.
- pytest, the frontend tests and the frontend build all pass.
- The automated test for user isolation passes.
- The five documents exist and match what the app actually does.

(Follow-up from the owner after the plan: "we need to build in 2 hours and i
create the firebase project named as kovai", then "yes do what u able to in 2
hours and i need the runable Application".)
````
