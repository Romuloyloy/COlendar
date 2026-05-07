# COlendar

COlendar is a local-first personal productivity dashboard in early development. The current app has a Next.js frontend, a FastAPI backend, PostgreSQL, Docker Compose, SQLAlchemy, Alembic migrations, and the first real product module: notes with nested folders.

## Project Structure

```text
.
|-- backend/              FastAPI backend
|   |-- alembic/          Migration environment and migration files
|   |-- app/
|   |   |-- api/          Shared HTTP routes, currently health checks
|   |   |-- core/         Settings and database connection setup
|   |   |-- db/           Declarative Base, mixins, and model registry
|   |   `-- modules/      Product modules, including notes
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
- Backend health: `http://localhost:8000/health`
- Backend database health: `http://localhost:8000/health/db`

Or check them from PowerShell:

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:3000).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/notes).StatusCode
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/health/db
```

Success looks like:

- The frontend page says `COlendar is running`.
- The Notes page lets you create folders and notes.
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

The first migration is intentionally empty. The second migration creates the `folders` and `notes` tables.

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

The tests check the database foundation plus practical notes/folders behavior: root folders, nested folders, invalid parent handling, blank name/title rejection, missing folder rejection, note creation, note editing, note moving, note archiving, and safe folder archiving.

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

- Tasks, calendar events, tracker entries, or dashboard data
- Authentication or users
- AI features
- Redis, workers, background jobs, pgvector, or semantic search
- Drag-and-drop, resizable widgets, or the future sheet/grid GUI
- Tags, backlinks, markdown preview, rich text editing, attachments, or semantic search for notes
- Recursive folder archive/delete
- Searching or filtering notes beyond selecting a folder

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
