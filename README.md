# COlendar

COlendar is the initial skeleton for a local-first personal productivity dashboard. The current goal is only to prove the development stack works: Next.js frontend, FastAPI backend, PostgreSQL database, and Docker Compose orchestration.

## Project Structure

```text
.
├── backend/          FastAPI application
│   └── app/
│       ├── api/      HTTP routes, currently health checks only
│       ├── core/     Configuration
│       ├── db/       Database connection setup
│       └── modules/  Future modular-monolith feature folders
├── docs/             Product and architecture planning documents
├── frontend/         Next.js + TypeScript + Tailwind application
├── docker-compose.yml
├── .env.example
└── ForCO.txt
```

The app is intentionally split into separate frontend and backend folders while staying one modular monolith product.

## Windows Prerequisites

Install these first:

- Docker Desktop for Windows
- Git for Windows
- A code editor such as VS Code
- Optional for non-Docker development: Node.js 22 LTS and Python 3.12

Make sure Docker Desktop is running before you start the stack. On Windows, Docker Desktop usually works best with the WSL 2 backend enabled.

## Environment Files

Example files are committed, real secrets are not.

- Root Docker Compose example: `.env.example`
- Backend local example: `backend/.env.example`
- Frontend local example: `frontend/.env.example.local`

For the Docker setup, you can run with the built-in defaults, or create a local `.env` file:

```powershell
Copy-Item .env.example .env
```

If you copy the file, keep it local and change only development values you understand. Do not commit `.env`.

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
- Backend health: `http://localhost:8000/health`
- Backend database health: `http://localhost:8000/health/db`

Success looks like:

- The frontend page says `COlendar is running`.
- `/health` returns a JSON response with `status: ok`.
- `/health/db` returns a JSON response with `database: connected`.
- Docker Desktop shows the frontend, backend, and database containers running.

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

## Optional Non-Docker Frontend Run

```powershell
Set-Location frontend
npm install
Copy-Item .env.example.local .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Intentionally Not Implemented Yet

This skeleton does not include:

- Notes, tasks, calendar, tracker, dashboard data, or sheet widgets
- Authentication or users
- AI features
- Redis, workers, background jobs, pgvector, or semantic search
- Drag-and-drop, resizable widgets, or the future sheet/grid GUI
- Alembic migrations or SQLAlchemy models

Those belong in later phases from the roadmap.

## Troubleshooting On Windows

If `docker compose` is not recognized, install or update Docker Desktop and reopen PowerShell.

If ports are already in use, edit `.env` and change `FRONTEND_PORT`, `BACKEND_PORT`, or `POSTGRES_PORT`, then run `docker compose up --build` again.

If the backend starts before the database is ready, wait a few seconds and refresh `/health/db`. Compose also includes a Postgres health check to reduce this problem.

If Docker file watching feels slow on Windows, keep the project inside a normal local folder such as `C:\Projects\COlendar` and make sure Docker Desktop has access to that drive.

If containers behave strangely after dependency changes, rebuild:

```powershell
docker compose down
docker compose up --build
```

If the database is in a broken local state and you do not need its data:

```powershell
docker compose down -v
docker compose up --build
```
