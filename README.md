# COlendar

COlendar is a local-first personal productivity dashboard in MVP hardening. The current app has a Next.js frontend, a FastAPI backend, PostgreSQL, Docker Compose, SQLAlchemy, Alembic migrations, a fixed dashboard with Widget Foundation v1, notes with nested folders, MVP daily/weekly tasks, a simple internal calendar, basic water/activity/calorie tracking, a simple planning page, shared frontend UI patterns, global Quick Add, and Global Search.

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
|   |-- app/              App Router routes and global shell
|   `-- src/
|       |-- components/   Shared reusable UI primitives
|       |-- features/     Product feature modules
|       `-- lib/          Shared frontend helpers such as API/date utilities
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

- Dashboard home: `http://localhost:3000`
- Notes page: `http://localhost:3000/notes`
- Tasks page: `http://localhost:3000/tasks`
- Calendar page: `http://localhost:3000/calendar`
- Search page: `http://localhost:3000/search`
- Planning page: `http://localhost:3000/planning`
- Tracker page: `http://localhost:3000/tracker`
- Backend health: `http://localhost:8000/health`
- Backend database health: `http://localhost:8000/health/db`

Or check them from PowerShell:

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:3000).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/notes).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/tasks).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/calendar).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/search).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/planning).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/tracker).StatusCode
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/health/db
```

- The dashboard shows today's overview, quick actions, daily tasks, weekly tasks scheduled for the selected date, upcoming calendar events, tracker summary including calories, and recent notes.
- The global nav includes Quick Add, which can also be opened with `Ctrl+K` on Windows.
- The global nav includes Search, which opens a practical keyword search page for active productivity data.
- The Notes page lets you create folders and notes.
- The Tasks page lets you create daily and weekly tasks.
- The Calendar page lets you create, edit, view, and archive simple internal events.
- The Planning page shows a read-only daily plan and weekly plan from Tasks and Calendar.
- The Tracker page lets you log water, lightweight activity, and calories for a selected date.
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

## Dashboard

The dashboard is now the default home screen at `http://localhost:3000`.

It is intentionally fixed and practical in this phase. It currently shows:

- Today/date overview using the browser's local date on first load
- Quick actions for Quick Add, Search, Planning, and core modules
- Incomplete daily task count for the selected date
- Incomplete weekly task count for the selected date
- Daily tasks for the selected date, with complete/incomplete checkboxes
- Weekly recurring tasks scheduled for the selected date, with complete/incomplete checkboxes
- Upcoming active calendar events from the selected date onward
- Tracker summary for the selected date, including water, activity, and calories
- Recent active notes with short previews
- Loading, empty, and error states

The dashboard is not customizable yet. It is also not the future sheet/grid UI. Widget Foundation v1 keeps the user-facing dashboard fixed while making the internals widget-like and easier to extend.

The current frontend widget foundation lives in:

- `frontend/src/features/dashboard/DashboardPage.tsx`
- `frontend/src/features/dashboard/DashboardWidgets.tsx`
- `frontend/src/features/dashboard/WidgetRenderer.tsx`
- `frontend/src/features/dashboard/dashboard-widget-registry.ts`
- `frontend/src/features/dashboard/widget-types.ts`

The dashboard widget registry is code-only. Each widget definition has an id, display name, description, category, default size hint, and component reference. The current widgets are:

- `TodayOverviewWidget`
- `QuickActionsWidget`
- `DailyTasksWidget`
- `WeeklyTasksWidget`
- `RecentNotesWidget`
- `UpcomingEventsWidget`
- `TrackerSummaryWidget`
- `PlanningSummaryWidget`

There are no widget database records, widget APIs, widget migrations, persisted layouts, drag-and-drop controls, dashboard customization settings, or sheet/grid layouts yet.

Future direction:

- replace the fixed render order with configurable widget instances
- add a fuller `WidgetRenderer` contract
- introduce customizable dashboards only when the core modules are stable
- later connect widgets to the postponed sheet/grid system

The backend dashboard module composes data owned by the Notes, Tasks, Calendar, and Tracker modules. It does not own dashboard tables or duplicate module data.

The module lives mainly in:

- `backend/app/modules/dashboard/router.py`
- `backend/app/modules/dashboard/service.py`
- `backend/app/modules/dashboard/schemas.py`
- `frontend/app/page.tsx`
- `frontend/src/features/dashboard/`

## Dashboard API Overview

```text
GET /api/dashboard/summary?date=YYYY-MM-DD
```

The response includes:

- selected date
- daily tasks for that date
- weekly tasks scheduled for that date and their completion state
- upcoming active calendar events from the selected date onward
- tracker summary for that date, including calorie total
- recent active notes
- simple dashboard counts

## Global Quick Add

Quick Add is a simple app-shell create panel available from every main page:

- Dashboard
- Notes
- Tasks
- Calendar
- Planning
- Tracker

Open it from the navigation bar with the `Quick Add` button. On Windows, `Ctrl+K` also opens it. The dashboard Quick Actions widget can also open the same app-shell Quick Add panel.

Quick Add can create:

- Daily task: title, optional description, date
- Note: title and content, saved without a folder
- Calendar event: title, date, optional start time, optional end time, optional location, optional description
- Water entry: date, amount in ml, optional note
- Activity entry: date, activity type, optional duration, optional quantity, optional note
- Calorie entry: date, amount in kcal, optional label, optional note

Quick Add uses the existing module APIs:

```text
POST /api/tasks/daily
POST /api/notes
POST /api/calendar/events
POST /api/tracker/water
POST /api/tracker/activity
POST /api/tracker/calories
```

It does not add backend routes, tables, migrations, widgets, sheets, command-palette infrastructure, AI, reminders, or integrations. After a successful create, the current page listens for the Quick Add event and refreshes its existing data.

## Global Search

Global Search is a lightweight keyword search page at `http://localhost:3000/search`. It is available from the app shell navigation and is meant to make the existing modules feel connected without introducing AI, semantic search, pgvector, or command-palette infrastructure.

Search includes active, non-archived records from:

- Notes: title and content
- Folders: folder name
- Daily tasks: title and description
- Weekly tasks: title and description
- Calendar events: title, description, and location

Tracker entries are intentionally not included yet. Tracker data is date-log oriented, and searching it globally is less useful than searching notes, tasks, folders, and events in the current MVP.

The backend search module composes existing module data and owns no tables:

- `backend/app/modules/search/router.py`
- `backend/app/modules/search/service.py`
- `backend/app/modules/search/schemas.py`
- `frontend/app/search/page.tsx`
- `frontend/src/features/search/`

## Search API Overview

```text
GET /api/search?q=keyword
```

The response is grouped by source:

```json
{
  "query": "gym",
  "results": {
    "notes": [],
    "folders": [],
    "daily_tasks": [],
    "weekly_tasks": [],
    "calendar_events": []
  }
}
```

Each result includes an `id`, `type`, `title`, optional `subtitle`, optional `preview`, optional `date`, and `target_url`. Empty or whitespace-only queries return a validation error. Matching is case-insensitive and uses simple database `LIKE` behavior, not full-text, fuzzy, semantic, or AI search.

## Calendar Module

The calendar module is a simple internal event system. It is not external calendar sync, not a shared calendar, and not a recurrence engine.

Calendar events support:

- Title
- Optional description
- Event date
- Optional start time
- Optional end time
- Optional location
- Soft archive/delete through `is_archived`
- Created and updated timestamps

Time handling is intentionally simple for the MVP. Event dates and times are local app values, with no complex time zone model. If both start and end times are set, the end time cannot be before the start time.

The browser UI at `http://localhost:3000/calendar` currently provides:

- A selected-date event list
- An upcoming events list
- Event creation
- Event editing
- Event archive/delete
- Loading, empty, success, and error states

The dashboard at `http://localhost:3000` now shows real upcoming calendar events from the selected date onward. The dashboard still only composes calendar data; event ownership remains in the Calendar module.

The module lives mainly in:

- `backend/app/modules/calendar/models.py`
- `backend/app/modules/calendar/schemas.py`
- `backend/app/modules/calendar/router.py`
- `frontend/app/calendar/page.tsx`
- `frontend/src/features/calendar/`

## Calendar API Overview

```text
GET    /api/calendar/events
GET    /api/calendar/events?date=YYYY-MM-DD
GET    /api/calendar/events?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
GET    /api/calendar/events?upcoming=true
GET    /api/calendar/events?upcoming=true&from_date=YYYY-MM-DD
POST   /api/calendar/events
GET    /api/calendar/events/{event_id}
PATCH  /api/calendar/events/{event_id}
DELETE /api/calendar/events/{event_id}
```

Deletes are soft archives in this phase. Normal list and detail endpoints only return active, non-archived events.

## Planning Module

The planning module is a simple read-only planning view. It does not own planning tables and does not duplicate task or calendar data.

It composes:

- Daily tasks
- Weekly recurring tasks scheduled for the relevant dates
- Calendar events

The browser UI at `http://localhost:3000/planning` currently provides:

- A selected date
- Daily Plan for that date
- Weekly Plan for the week containing that date
- Links to Tasks and Calendar for editing or creation
- Loading, empty, and error states

The module lives mainly in:

- `backend/app/modules/planning/router.py`
- `backend/app/modules/planning/service.py`
- `backend/app/modules/planning/schemas.py`
- `frontend/app/planning/page.tsx`
- `frontend/src/features/planning/`

## Planning API Overview

```text
GET /api/planning/daily?date=YYYY-MM-DD
GET /api/planning/weekly?date=YYYY-MM-DD
```

The daily endpoint returns the selected date, daily tasks, weekly task occurrences, and calendar events for that date. The weekly endpoint returns week start/end plus seven grouped day summaries.

## Shared Frontend UI And Data Layer

The frontend now has a small shared foundation to keep the MVP pages from feeling like disconnected test screens:

- `frontend/src/components/ui.tsx`: shared `PageHeader`, `SectionCard`, `EmptyState`, `LoadingState`, `ErrorState`, `NoticeState`, and `DateSelector`.
- `frontend/src/lib/api.ts`: shared API request wrapper, environment-backed API base URL, consistent JSON headers, `204 No Content` handling, and validation/error message formatting.
- `frontend/src/lib/date.ts`: shared local ISO date, display-date, and weekday helpers.

Feature modules still own their product-specific API functions and page behavior. The shared layer is intentionally small and practical; it is not a design system, component library, or state framework.

## MVP Hardening Notes

This pass focused on consistency and preparation rather than new feature expansion:

- Navigation spacing and hover states are more consistent.
- Date selectors and status messages use shared UI primitives where practical.
- Frontend API error handling is centralized instead of duplicated per feature.
- Dashboard sections now render through code-defined widget definitions and a lightweight widget renderer.
- Widget Foundation v1 prepares the dashboard for future configurable widgets while keeping the dashboard fixed.
- Backend module behavior was reviewed for archive/date/error consistency; stable APIs were left intact.

The app remains a modular monolith. Dashboard and Planning compose data owned by Notes, Tasks, Calendar, and Tracker, and they still do not own persistence tables.

## Tracker Module

The tracker module is a basic daily tracker for water intake, lightweight activity, and calories. It is not a health analytics app, a wearable integration, a food database, or a custom tracker builder.

Water entries support:

- Entry date
- Amount in milliliters
- Optional note
- Soft archive/delete through `is_archived`
- Created and updated timestamps

Activity entries support:

- Entry date
- Activity type
- Optional duration in minutes
- Optional quantity
- Optional note
- Soft archive/delete through `is_archived`
- Created and updated timestamps

Calorie entries support:

- Entry date
- Amount in kcal
- Optional label
- Optional note
- Soft archive/delete through `is_archived`
- Created and updated timestamps

The browser UI at `http://localhost:3000/tracker` currently provides:

- A selected date
- Daily water total
- Water entry list
- Water entry creation
- Water entry archive/delete
- Activity entry list
- Activity entry creation
- Activity entry archive/delete
- Daily calorie total
- Calorie entry list
- Calorie entry creation
- Calorie entry archive/delete
- Loading, empty, success, and error states

The dashboard at `http://localhost:3000` now shows the selected date's water total, activity count, activity minutes, and calorie total. The dashboard still only composes tracker data; tracker entry ownership remains in the Tracker module.

The module lives mainly in:

- `backend/app/modules/tracker/models.py`
- `backend/app/modules/tracker/schemas.py`
- `backend/app/modules/tracker/router.py`
- `frontend/app/tracker/page.tsx`
- `frontend/src/features/tracker/`

## Tracker API Overview

```text
GET    /api/tracker/water?date=YYYY-MM-DD
POST   /api/tracker/water
DELETE /api/tracker/water/{entry_id}

GET    /api/tracker/activity?date=YYYY-MM-DD
POST   /api/tracker/activity
DELETE /api/tracker/activity/{entry_id}

GET    /api/tracker/calories?date=YYYY-MM-DD
POST   /api/tracker/calories
DELETE /api/tracker/calories/{entry_id}

GET    /api/tracker/summary?date=YYYY-MM-DD
```

Deletes are soft archives in this phase. Normal list and summary endpoints only return active, non-archived entries.

## Notes And Folders Module

The notes module supports note capture and organization.

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

The first migration is intentionally empty. The second migration creates the `folders` and `notes` tables. The third migration creates `daily_tasks`, `weekly_tasks`, and `weekly_task_completions`. The fourth migration creates `calendar_events`. The fifth migration creates `water_entries` and `activity_entries`. The sixth migration creates `calorie_entries`.

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

The tests check the database foundation plus practical notes/folders, tasks, calendar, tracker, planning, dashboard, and search behavior: folder nesting, note CRUD/archive, daily task CRUD/completion/archive, daily completion idempotency, weekly recurrence validation, weekly task editing/filtering, weekly occurrence completion idempotency, invalid occurrence dates, weekly task archive, calendar event CRUD/archive/date filtering/upcoming lists, tracker water/activity/calorie CRUD/archive/summary behavior, planning daily/weekly composition, dashboard summaries for selected dates, grouped search results, case-insensitive matching, empty-query handling, and archived-record exclusion.

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

- Authentication or users
- AI features
- Redis, workers, background jobs, pgvector, or semantic search
- Drag-and-drop, resizable widgets, or the future sheet/grid GUI
- Dashboard customization, persisted widget instances, widget APIs, or formal widget records
- A formal command palette engine
- External calendar sync, recurring calendar events, invitations, attendees, reminders, or notifications
- Advanced tracker analytics, charts, wearable integrations, macros, food database, nutrition database, meal planning, or a custom tracker builder
- Editable planning engine, time blocking, planning tables, or planning-specific reminders
- Tags, backlinks, markdown preview, rich text editing, attachments, or semantic search for notes
- Recursive folder archive/delete
- Search deep links to module pages instead of opening specific result detail views
- Choosing a folder from Quick Add note creation
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
