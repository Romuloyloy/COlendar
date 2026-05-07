# COlendar

COlendar is a local-first personal productivity dashboard in early development. The current app has a Next.js frontend, a FastAPI backend, PostgreSQL, Docker Compose, SQLAlchemy, Alembic migrations, notes with nested folders, and MVP daily/weekly tasks.

## Project Structure

```text
.
|-- backend/              FastAPI backend
|   |-- alembic/          Migration environment and migration files
|   |-- app/
|   |   |-- api/          Shared HTTP routes, currently health checks
|   |   |-- core/         Settings and database connection setup
|   |   |-- db/           Declarative Base, mixins, and model registry
|   |   `-- modules/      Product modules, including notes and tasks
|   `-- tests/            Backend tests
|-- docs/                 Product and architecture planning documents
|-- frontend/             Next.js + TypeScript + Tailwind app
|-- docker-compose.yml
|-- .env.example
`-- ForCO.txt
```

The app is intentionally a modular monolith: one backend, one frontend, one database, and clear module folders for future features.

## Windows Prerequisites

Install these first:

- Docker Desktop for Windows
- Git for Windows
- A code editor such as VS Code
- Optional for non-Docker development: Node.js 22 LTS and Python 3.12

Make sure Docker Desktop is running before using Docker Compose. On Windows, Docker Desktop usually works best with the WSL 2 backend enabled.

## Environment Files

Example files are committed, real secrets are not.

- Root Docker Compose example: `.env.example`
- Backend local example: `backend/.env.example`
- Frontend local example: `frontend/.env.example.local`

For Docker Compose, you can use the built-in defaults or create a local `.env` file:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env`. The default passwords are only for local development.

## Run With Docker Compose

From the repository root in PowerShell:

```powershell
docker compose up --build
```

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: localhost port `5432` by default

The first build can take a few minutes while Docker downloads images and installs dependencies.

## Check The App

Open these in your browser:

- Frontend: `http://localhost:3000`
- Notes page: `http://localhost:3000/notes`
- Tasks page: `http://localhost:3000/tasks`
- Backend health: `http://localhost:8000/health`
- Backend database health: `http://localhost:8000/health/db`

Or check them from PowerShell:

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:3000).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/notes).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/tasks).StatusCode
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/health/db
```

Success looks like:

- The frontend page says `COlendar is running`.
- The Notes page lets you create folders and notes.
- The Tasks page lets you create daily and weekly tasks.
- `/health` returns JSON with `status: ok`.
- `/health/db` returns JSON with `database: connected`.
- Docker Desktop shows the frontend, backend, and database containers running.

## Database Layer

The backend database foundation is split like this:

- `backend/app/core/config.py`: environment-backed settings through Pydantic Settings.
- `backend/app/core/database.py`: SQLAlchemy engine, session factory, FastAPI DB dependency, and DB connection check.
- `backend/app/db/base.py`: shared SQLAlchemy declarative `Base` and reusable `TimestampMixin`.
- `backend/app/db/model_registry.py`: future module model imports for Alembic autogeneration.
- `backend/alembic/`: Alembic migration environment.

Future modules should define their own SQLAlchemy models inside their module folders, then import those model modules in `backend/app/db/model_registry.py` so Alembic can detect them.

## Notes And Folders Module

The notes module is the first real product feature.

It supports:

- Root folders
- Nested folders through `parent_folder_id`
- Folder rename
- Notes with optional `folder_id`
- Notes without a folder
- Moving notes between folders
- Editing note title and content
- Soft archiving notes
- Soft archiving empty folders

Folder archive is intentionally conservative: a folder must be empty before it can be archived. If it contains active notes or child folders, the backend returns `409 Conflict`. This avoids accidentally hiding a whole subtree before a fuller folder-management UI exists.

The browser UI at `http://localhost:3000/notes` currently provides:

- A simple indented folder list
- Root and nested folder creation
- Folder rename
- Empty-folder archive
- Note list by all notes or selected folder
- Note creation, editing, folder movement, and archive
- Loading, empty, success, and error states

The module lives mainly in:

- `backend/app/modules/notes/models.py`
- `backend/app/modules/notes/schemas.py`
- `backend/app/modules/notes/router.py`
- `frontend/app/notes/page.tsx`
- `frontend/src/features/notes/`

## Notes API Overview

Folders:

```text
GET    /api/folders
POST   /api/folders
PATCH  /api/folders/{folder_id}
DELETE /api/folders/{folder_id}
```

Notes:

```text
GET    /api/notes
POST   /api/notes
GET    /api/notes/{note_id}
PATCH  /api/notes/{note_id}
DELETE /api/notes/{note_id}
```

Deletes are soft archives in this phase.

## Tasks Module

The tasks module supports simple MVP planning without a complex recurrence engine.

Daily tasks:

- Belong to one specific date.
- Have a title, optional description, completion state, and soft archive flag.
- Can be created, edited, completed, marked incomplete, and archived.
- Normal lists only return active, non-archived tasks.

Weekly recurring tasks:

- Are templates with a title, optional description, and one or more weekdays.
- Use weekday integers internally: `0` is Monday and `6` is Sunday.
- Can be created, edited, filtered by weekday, and archived.
- Completion is tracked per occurrence date in `weekly_task_completions`.
- Completing and uncompleting a weekly occurrence is idempotent.
- A weekly occurrence can only be completed for a date whose weekday is included in that task template.

The browser UI at `http://localhost:3000/tasks` currently provides:

- A working date selector
- Daily task list for that date
- Daily task create/edit/archive
- Daily task complete/incomplete
- Weekly recurring task list
- Weekday checkboxes for weekly tasks
- Weekly occurrence complete/incomplete for the selected date when the task is scheduled for that weekday
- Weekly task archive
- Loading, empty, success, and error states

The module lives mainly in:

- `backend/app/modules/tasks/models.py`
- `backend/app/modules/tasks/schemas.py`
- `backend/app/modules/tasks/router.py`
- `frontend/app/tasks/page.tsx`
- `frontend/src/features/tasks/`

## Tasks API Overview

Daily tasks:

```text
GET    /api/tasks/daily?date=YYYY-MM-DD
POST   /api/tasks/daily
PATCH  /api/tasks/daily/{task_id}
DELETE /api/tasks/daily/{task_id}
POST   /api/tasks/daily/{task_id}/complete
POST   /api/tasks/daily/{task_id}/incomplete
```

Weekly tasks:

```text
GET    /api/tasks/weekly
GET    /api/tasks/weekly?weekday=0
POST   /api/tasks/weekly
PATCH  /api/tasks/weekly/{task_id}
DELETE /api/tasks/weekly/{task_id}
GET    /api/tasks/weekly/completions?completion_date=YYYY-MM-DD
POST   /api/tasks/weekly/{task_id}/complete?completion_date=YYYY-MM-DD
POST   /api/tasks/weekly/{task_id}/incomplete?completion_date=YYYY-MM-DD
```

Deletes are soft archives in this phase.

## Run Migrations

Start the stack first:

```powershell
docker compose up --build
```

In a second PowerShell window, apply migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Check the current migration:

```powershell
docker compose exec backend alembic current
```

The first migration is intentionally empty. The second migration creates the `folders` and `notes` tables. The third migration creates `daily_tasks`, `weekly_tasks`, and `weekly_task_completions`.

## Create A New Migration

After adding or changing SQLAlchemy models later, generate a migration from PowerShell:

```powershell
docker compose exec backend alembic revision --autogenerate -m "add notes folders"
```

Then inspect the generated file in `backend/alembic/versions/` before applying it:

```powershell
docker compose exec backend alembic upgrade head
```

For manual migrations, use:

```powershell
docker compose exec backend alembic revision -m "describe change"
```

## Backend Tests

With the stack built, run the backend tests from PowerShell:

```powershell
docker compose exec backend pytest
```

The tests check the database foundation plus practical notes/folders and tasks behavior: folder nesting, note CRUD/archive, daily task CRUD/completion/archive, daily completion idempotency, weekly recurrence validation, weekly task editing/filtering, weekly occurrence completion idempotency, invalid occurrence dates, and weekly task archive.

You can also run the frontend production build through Docker:

```powershell
docker compose exec frontend npm run build
```

## Stop The App

In the PowerShell window running Docker Compose, press `Ctrl+C`.

Then run:

```powershell
docker compose down
```

To remove the local database volume and start with a fresh database later:

```powershell
docker compose down -v
```

Only use `-v` when you are comfortable deleting the local development database contents.

## Optional Non-Docker Backend Run

Docker Compose is the recommended path right now. If you later want to run the backend directly on Windows:

```powershell
Set-Location backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

This expects PostgreSQL to be available separately and `DATABASE_URL` to point at it.

Run local migrations from the `backend` folder:

```powershell
alembic upgrade head
```

Run local backend tests:

```powershell
pytest
```

## Optional Non-Docker Frontend Run

```powershell
Set-Location frontend
npm install
Copy-Item .env.example.local .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Intentionally Not Implemented Yet

This phase does not include:

- Calendar events, tracker entries, or dashboard data
- Authentication or users
- AI features
- Redis, workers, background jobs, pgvector, or semantic search
- Drag-and-drop, resizable widgets, or the future sheet/grid GUI
- Tags, backlinks, markdown preview, rich text editing, attachments, or semantic search for notes
- Recursive folder archive/delete
- Searching or filtering notes beyond selecting a folder
- Advanced task recurrence rules, subtasks, priorities, labels, dependencies, reminders, or notifications

Those belong in later phases from the roadmap.

## Troubleshooting On Windows

If `docker compose` is not recognized, install or update Docker Desktop and reopen PowerShell.

If Docker cannot connect to `dockerDesktopLinuxEngine`, start Docker Desktop and wait until it says the engine is running.

If ports are already in use, edit `.env` and change `FRONTEND_PORT`, `BACKEND_PORT`, or `POSTGRES_PORT`, then run `docker compose up --build` again.

If `/health/db` fails, check that the `db` container is running and healthy in Docker Desktop. Then try:

```powershell
docker compose logs db
docker compose logs backend
```

If migrations cannot connect, confirm the backend container is running and uses the Compose database URL:

```powershell
docker compose exec backend alembic current
```

If containers behave strangely after dependency changes, rebuild:

```powershell
docker compose down
docker compose up --build
```

If the database is in a broken local state and you do not need its data:

```powershell
docker compose down -v
docker compose up --build
docker compose exec backend alembic upgrade head
```
