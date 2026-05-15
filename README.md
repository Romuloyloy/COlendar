# COlendar

COlendar is a local-first personal productivity dashboard in MVP hardening. The current app has a Next.js frontend, a FastAPI backend, PostgreSQL, Docker Compose, SQLAlchemy, Alembic migrations, Dashboard Customization v1 on top of Widget Foundation v1, Sheet Workspace Shell v1 on top of Sheet/Grid Prototype v1, UI Foundation v1, local palette selection, notes with nested folders, MVP one-time/recurring tasks, a calendar that visually shows events and task occurrences, basic water/activity/calorie tracking, a simple planning page, shared frontend UI patterns, global Quick Add, and Global Search.

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

## Project Documentation

Core project docs live in `docs/` and are intended to make future Codex prompts shorter:

- `docs/MASTER_CONTEXT.md`: entry-point project context.
- `docs/PROJECT_CONSTRAINTS.md`: default non-goals and architecture guardrails.
- `docs/DEFINITION_OF_DONE.md`: standard implementation checklist and verification commands.
- `docs/TASK_EVENT_MODEL.md`: task, event, planning, and calendar product model.
- `docs/SHEETS_VISION.md`: long-term sheet workspace direction.
- `docs/UX_GUIDELINES.md`: product and UI rules.
- `docs/UI_SYSTEM.md`: concise UI Foundation v1 tokens and component guidance.
- `docs/features/`: scoped feature specs.

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
docker compose up --build -d
```

This starts:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: localhost port `5432` by default

The first build can take a few minutes while Docker downloads images and installs dependencies.

## Check The App

Open these in your browser:

- Dashboard home: `http://localhost:3000`
- Sheets prototype: `http://localhost:3000/sheets`
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
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/sheets).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/notes).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/tasks).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/calendar).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/search).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/planning).StatusCode
(Invoke-WebRequest -UseBasicParsing http://localhost:3000/tracker).StatusCode
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/health/db
```

- The dashboard shows today's overview, quick actions, one-time tasks, recurring tasks scheduled for the selected date, upcoming calendar events, tracker summary including calories, and recent notes.
- The Sheets page is an experimental 4x2 workspace prototype that renders code-defined dashboard widgets in persisted sheet slots.
- The global nav includes Quick Add, which can also be opened with `Ctrl+K` on Windows.
- The global nav includes Search, which opens a practical keyword search page for active productivity data.
- The Notes page lets you create folders and notes.
- The Tasks page lets you create one-time tasks and recurring tasks.
- The Calendar page shows events, one-time tasks, and recurring task occurrences in the month grid while keeping event editing in the Calendar module and task editing in the Tasks module.
- The Planning page shows a read-only day plan and weekly plan from Tasks and Calendar.
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

It is intentionally simple and practical in this phase. It currently shows:

- Today/date overview using the browser's local date on first load
- Quick actions for Quick Add, Search, Planning, and core modules
- Incomplete one-time task count for the selected date
- Incomplete recurring task count for the selected date
- One-time tasks for the selected date, with complete/incomplete checkboxes
- Recurring tasks scheduled for the selected date, with complete/incomplete checkboxes
- Upcoming active calendar events from the selected date onward
- Tracker summary for the selected date, including water, activity, and calories
- Recent active notes with short previews
- Loading, empty, and error states

Dashboard Customization v1 lets the user:

- open a `Customize Dashboard` modal from the home dashboard
- see all code-defined dashboard widgets and their descriptions
- show or hide dashboard widgets
- move dashboard widgets up or down
- save the widget order and visibility
- reset the dashboard layout to the default order with all widgets visible

The dashboard still is not the future sheet/grid UI. Widget Foundation v1 keeps widget definitions code-defined while Dashboard Customization v1 persists only the user's layout preferences.

The current frontend widget foundation lives in:

- `frontend/src/features/dashboard/DashboardPage.tsx`
- `frontend/src/features/dashboard/DashboardCustomizeModal.tsx`
- `frontend/src/features/dashboard/DashboardWidgets.tsx`
- `frontend/src/features/dashboard/WidgetRenderer.tsx`
- `frontend/src/features/dashboard/dashboard-widget-registry.ts`
- `frontend/src/features/dashboard/widget-types.ts`

The dashboard widget registry is code-only. Each widget definition has an id, display name, description, category, default order, default size hint, and component reference. The current widgets are:

- `TodayOverviewWidget`
- `QuickActionsWidget`
- `DailyTasksWidget` (legacy internal name for the One-time Tasks widget)
- `WeeklyTasksWidget`
- `RecentNotesWidget`
- `UpcomingEventsWidget`
- `TrackerSummaryWidget`
- `PlanningSummaryWidget`

The backend stores layout preferences in `dashboard_widget_preferences`:

- `widget_key`
- `sort_order`
- `is_visible`
- `config_json`, currently reserved and defaulting to an empty object
- timestamps

The database does not define widgets. It only stores preferences for the code-defined widget keys.

What remains fixed:

- widget implementation and metadata are still code-defined
- widget content and behavior are unchanged
- the dashboard still uses the existing registry and `WidgetRenderer`
- there is no drag-and-drop, resizing, grid placement, sheet selection, auth, plugin system, or advanced widget configuration

Future direction:

- evolve preferences into configurable widget instances when the sheet system is ready
- add a fuller `WidgetRenderer` contract
- later connect widgets to the postponed no-scroll sheet system and fixed 4x2 grid

The backend dashboard module composes data owned by the Notes, Tasks, Calendar, and Tracker modules. It now owns only dashboard layout preferences and does not duplicate module data.

The module lives mainly in:

- `backend/app/modules/dashboard/models.py`
- `backend/app/modules/dashboard/router.py`
- `backend/app/modules/dashboard/service.py`
- `backend/app/modules/dashboard/schemas.py`
- `backend/app/modules/dashboard/widget_catalog.py`
- `frontend/app/page.tsx`
- `frontend/src/features/dashboard/`

## Dashboard API Overview

```text
GET /api/dashboard/summary?date=YYYY-MM-DD
GET /api/dashboard/widgets
PUT /api/dashboard/widgets
POST /api/dashboard/widgets/reset
```

The response includes:

- selected date
- one-time tasks for that date
- weekly tasks scheduled for that date and their completion state
- upcoming active calendar events from the selected date onward
- tracker summary for that date, including calorie total
- recent active notes
- simple dashboard counts

The widget layout endpoints use this simple shape:

```json
{
  "widgets": [
    {
      "widget_key": "today-overview",
      "sort_order": 0,
      "is_visible": true,
      "config_json": {}
    }
  ]
}
```

`GET /api/dashboard/widgets` returns the current layout and creates or normalizes the default preferences when needed. `PUT /api/dashboard/widgets` stores the submitted widget array order and visibility, rejects unknown or duplicate widget keys, and appends omitted known widgets safely. `POST /api/dashboard/widgets/reset` restores the default order and sets all widgets visible.

## Task/Event Concept Model

The product model is intentionally clearer without merging modules yet:

- One-time Tasks are completable things planned for a specific date.
- Recurring Tasks are completable task templates with weekly, bi-weekly, or monthly-by-day occurrences.
- Calendar Events are scheduled things that happen at a date or time.
- Planning combines tasks and events into daily and weekly review views.
- Calendar remains the simple date/time event view.

The backend still uses `DailyTask`, the `daily_tasks` table, and `/api/tasks/daily` routes as legacy/internal names for one-time dated tasks. Those names are kept for compatibility in this phase.

The backend still uses `WeeklyTask`, the `weekly_tasks` table, and `/api/tasks/weekly` routes as legacy/internal names for recurring task templates. Those endpoints now support weekly, bi-weekly, and monthly-by-day recurrence.

One-time task fields:

- `task_date`: required planned date where the task appears.
- `planned_time`: optional time the user wants to do the task.
- `due_date`: optional deadline date.
- `due_time`: optional deadline time.

Due dates are allowed before, on, or after the planned date for now. The app treats the deadline fields as flexible metadata and does not add reminders or notifications.

## Sheet Workspace Shell v1

The Sheets workspace lives at `http://localhost:3000/sheets`. Sheet Workspace Shell v1 plus the current hardening pass make `/sheets` feel closer to the long-term sheet-based GUI idea, but it does not replace the normal dashboard at `http://localhost:3000`.

The dashboard and sheets are different:

- Dashboard is the stable home route with saved show/hide and ordering preferences.
- Sheets is an experimental workspace route with one visible named sheet and fixed 4 columns x 2 rows slots.
- Both use the same code-defined dashboard widget registry and `WidgetRenderer` where possible.
- Dashboard preferences do not control sheet slots, and sheet slots do not control the dashboard.

Workspace shell behavior:

- one sheet is shown at a time
- the user should not get stuck with no active sheet; listing sheets creates defaults when none exist
- creating a sheet selects it immediately
- deleting a sheet selects another available sheet
- reset recreates and selects the default sheet set
- stale sheet selections recover by reloading the available sheets
- the last active sheet is remembered in browser `localStorage`
- returning to `/sheets` restores the remembered sheet when it still exists
- if the remembered sheet was deleted, `/sheets` falls back to the first valid sheet
- the primary surface is a desktop-first 4 columns x 2 rows grid
- the sheet area fills the available viewport below the app shell as much as practical
- normal long page scrolling is avoided on `/sheets`
- each cell is visually contained
- widget content is clipped or internally scrollable inside its own cell
- top-level error, notice, and loading states stay compact

Top-center dropdown behavior:

- a small top-center Workspace trigger is always clickable on `/sheets`
- clicking it opens a simple dropdown/control panel
- the dropdown links to Dashboard, Notes, Tasks, Calendar, Tracker, Planning, and Search
- the dropdown includes a Quick Add button wired to the existing global Quick Add modal
- the dropdown includes the shared day DateNavigator for the sheet widgets
- the dropdown includes current sheet controls, not a full command palette
- the dropdown documents the sheet keyboard shortcuts
- dangerous actions live under `Advanced`

Keyboard shortcuts on `/sheets`:

- `Left Arrow`: previous sheet
- `Right Arrow`: next sheet
- `Esc`: close the Workspace dropdown or slot editor
- `Ctrl+Shift+A`: open Quick Add
- shortcuts do not fire while typing in inputs, textareas, selects, or editable content
- the existing global `Ctrl+K` Quick Add shortcut also ignores typing fields

Sheet navigation behavior:

- previous/next buttons are available in both the workspace header and dropdown
- previous/next are disabled at the first or last sheet
- the current sheet name is shown in the workspace header and dropdown trigger
- the dropdown includes a sheet selector for jumping between sheets
- sheets can be created and renamed
- Move left and Move right reorder the current sheet without drag-and-drop
- reorder controls are disabled at the first or last sheet
- previous/next navigation follows the saved sheet order
- sheet order persists after refresh through backend `sort_order`
- delete sheet, reset sheets, and Use dashboard layout require explicit confirmation
- sheets can be deleted after confirmation, except the last remaining sheet is protected with a clear message
- reset restores the default sheet set after confirmation
- Use dashboard layout fills the current sheet from the current visible dashboard widget preferences after confirmation

Default sheets:

- `Today`: overview, one-time tasks, recurring tasks, upcoming events, recent notes, tracker summary, quick actions, and planning
- `Planning`: overview, one-time tasks, recurring tasks, upcoming events, planning, recent notes, and quick actions
- `Health`: tracker summary, one-time tasks, recurring tasks, overview, and quick actions
- if an active task category named `Health` exists when defaults are generated, the Health sheet task widgets use that category and a Health title override
- if no Health category exists, Health sheet task widgets stay generic

Slot editing behavior:

- Customize slots opens a focused slot editor panel
- the editor clearly shows the sheet name and active slot number
- the user selects one of the 8 slots, then chooses a widget type or Empty
- Clear slot empties the active slot
- One-time Tasks and Recurring Tasks expose category filter controls
- One-time Tasks and Recurring Tasks expose `title_override`
- the editor shows the current widget, category, and title config for the selected slot
- the editor shows whether there are unsaved slot changes
- Save changes persists all 8 slot definitions
- duplicate widgets on the same sheet remain supported because each slot is its own widget instance

Current persisted sheet behavior:

- sheets can be created and renamed
- sheets can be deleted, except the last remaining sheet is protected
- sheets can be moved left/right in order
- sheet order is saved in `sort_order` and normalized after destructive changes
- each sheet has exactly 8 slot positions, indexed 0 through 7
- each slot can hold one known `widget_key` or be empty
- each occupied slot is a widget instance with its own `widget_key` and `config_json`
- duplicate widgets on the same sheet are allowed
- task widget instances can store `category_id` and `title_override` in `config_json`
- slot layout persists after refresh

Examples:

- one One-time Tasks widget can show all one-time tasks
- another One-time Tasks widget can show only `School`
- another One-time Tasks widget can show only `Gym`
- Recurring Tasks widgets can do the same for categories such as `Health` or `Work`

Sheet widgets render in compact mode. The dashboard keeps normal widgets, while `/sheets` uses concise cell-friendly variants for task lists, notes, calendar events, tracking totals, and planning links. One-time and recurring task widgets show concise task counts, short lists, a more-count when clipped, and an action to Tasks. One-time tasks can show planned time and deadline metadata. Calendar, Notes, and Tracker compact widgets link to their full module pages. Clicking a note in the compact Recent Notes widget opens a simple preview modal inside `/sheets`; the modal shows the note title, content, folder id when present, a Close button, and an Open in Notes link. Cells still allow internal scrolling when content is too long.

Sheets Visual Refinement v1 keeps that behavior intact and focuses on polish:

- `/sheets` now reads more like a dedicated workspace canvas, with a warmer layered background, a softly separated sheet surface, and tile hover states that stay subtle.
- The top-center workspace control has a stronger floating-control identity, a clearer active sheet label, grouped app links, grouped sheet controls, and visually separated advanced actions.
- The workspace header shows the active sheet name plus its position in the sheet order, while previous/next controls keep the same simple navigation model.
- Compact widgets use a calmer shared card treatment, softer list rows, clearer metadata, consistent empty states, and less default admin-table styling.
- Motion is intentionally light: hover transitions and dropdown appearance only. There are no dramatic animations or new product behaviors.

Palette + Empty Slot Quick Add v1 adds two small frontend-only refinements:

- The default/current palette is named `Robot Vanilla`.
- Users can switch the accent palette to `DuckBerry` or `BozzyWheat` from the app shell palette selector.
- Palette choice is stored in browser `localStorage`, not the backend.
- Palette changes affect the global accent layer plus a subtle surface tint: primary buttons, focus rings, active/hover nav states, eyebrows, pills, sheet add affordances, selected sheet/widget accents, cards, panels, inputs, and other soft white surfaces.
- Empty sheet slots now show a soft plus/Add something affordance.
- Clicking an empty slot in normal `/sheets` viewing mode opens the existing global Quick Add modal.
- Slot assignment still happens through the existing Customize slots flow and slot editor; no sheet slot storage model changed.

Interaction philosophy for sheets:

- keep the workspace calm and scan-friendly
- preserve keyboard usability and visible focus states
- keep destructive sheet actions behind confirmation
- prefer contained internal scrolling inside slots over broken grid layout
- keep the fixed 4x2 grid and current widget model until a future feature spec changes it

Current sheet limitations:

- no drag-and-drop
- no widget resizing
- no `x/y/w/h` grid placement
- no advanced animation system
- no full command palette
- no final no-scroll workspace guarantee on every viewport
- no widget config beyond the current simple `category_id` and `title_override`
- no database-defined widgets, plugin system, auth, AI, external integrations, notifications, or reminders
- no backend-stored palette preference or per-sheet palette
- mobile is not heavily optimized yet
- Use dashboard layout copies visible dashboard widget order into the current sheet but does not create advanced per-widget config

Future direction:

- keep the dashboard stable while iterating on `/sheets`
- document a stronger sheet/widget contract for compact rendering and widget config schemas
- later add drag-and-drop, resizing, and `x/y/w/h` placement as a separate phase
- later evolve from code-defined dashboard widgets toward richer widget instances only when the UX contract is stable

The backend sheet module owns only sheet and slot persistence:

- `backend/app/modules/sheets/models.py`
- `backend/app/modules/sheets/router.py`
- `backend/app/modules/sheets/service.py`
- `backend/app/modules/sheets/schemas.py`

The frontend sheet prototype lives in:

- `frontend/app/sheets/page.tsx`
- `frontend/src/features/sheets/SheetsPage.tsx`
- `frontend/src/features/sheets/api.ts`
- `frontend/src/features/sheets/types.ts`

## Sheets API Overview

```text
GET    /api/sheets
POST   /api/sheets
GET    /api/sheets/{sheet_id}
PATCH  /api/sheets/{sheet_id}
DELETE /api/sheets/{sheet_id}
PUT    /api/sheets/{sheet_id}/slots
POST   /api/sheets/{sheet_id}/move-left
POST   /api/sheets/{sheet_id}/move-right
POST   /api/sheets/reset-default
```

Slot updates use this simple shape:

```json
{
  "slots": [
    {
      "slot_index": 0,
      "widget_key": "daily-tasks",
      "config_json": {
        "category_id": 1,
        "title_override": "School Tasks"
      }
    },
    {
      "slot_index": 1,
      "widget_key": null,
      "config_json": {}
    }
  ]
}
```

`slot_index` must be from 0 to 7. `widget_key` must be one of the code-defined dashboard widget keys or `null` for an empty slot. `config_json` must be an object. For `daily-tasks` and `weekly-tasks`, `category_id` must reference an existing task category when provided.

## Global Quick Add

Quick Add is a simple app-shell create panel available from every main page:

- Dashboard
- Sheets
- Notes
- Tasks
- Calendar
- Planning
- Tracker

Open it from the navigation bar with the `Quick Add` button. On Windows, `Ctrl+K` also opens it. The dashboard Quick Actions widget can also open the same app-shell Quick Add panel.

Quick Add can create:

- One-time task: title, optional description, planned date, optional planned time, optional due date, optional due time, optional category
- Recurring task: title, optional description, weekly/bi-weekly/monthly recurrence fields, optional end date, optional category
- Note: title and content, saved without a folder
- Calendar event: scheduled appointment/block/event with title, date, optional start time, optional end time, optional location, optional description
- Water entry: date, amount in ml, optional note
- Activity entry: date, activity type, optional duration, optional quantity, optional note
- Calorie entry: date, amount in kcal, optional label, optional note

Quick Add uses the existing module APIs:

```text
POST /api/tasks/daily
POST /api/tasks/weekly
POST /api/notes
POST /api/calendar/events
POST /api/tracker/water
POST /api/tracker/activity
POST /api/tracker/calories
```

One-time Task uses the existing `/api/tasks/daily` endpoint, whose `daily` name is legacy/internal. Recurring Task uses the existing `/api/tasks/weekly` endpoint, whose `weekly` name is legacy/internal. Quick Add supports weekly, bi-weekly, and monthly-by-day recurring tasks without adding command-palette infrastructure, AI, reminders, or integrations. After a successful create, the current page listens for the Quick Add event and refreshes its existing data.

## Global Search

Global Search is a lightweight keyword search page at `http://localhost:3000/search`. It is available from the app shell navigation and is meant to make the existing modules feel connected without introducing AI, semantic search, pgvector, or command-palette infrastructure.

Search includes active, non-archived records from:

- Notes: title and content
- Folders: folder name
- One-time tasks: title and description
- Recurring tasks: title and description
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

The calendar module is a simple internal event system and visual planning surface. It is not external calendar sync, not a shared calendar, and not a recurrence engine.

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

- A monthly calendar grid for the visible month
- Previous month, Today, and next month navigation
- Day selection from the month grid
- Compact month-cell indicators for calendar events, one-time tasks, and recurring task occurrences
- Frontend-only visibility toggles for events, one-time tasks, and recurring tasks
- A selected-day panel separated into Events, One-time Tasks, and Recurring Tasks
- An upcoming events list
- Event creation
- Event editing
- Event archive/delete
- One-time task complete/incomplete from the selected-day panel
- Recurring task occurrence complete/incomplete from the selected-day panel
- Links from the selected-day task sections back to Tasks
- Loading, empty, success, and error states

Calendar Tasks View v1 keeps the product model separated: Calendar Events are scheduled happenings, One-time Tasks are dated completable tasks, and Recurring Tasks are task templates with occurrences. The Calendar page displays these items together for planning, but tasks and events are not merged in the backend data model. Event create/edit/archive behavior still uses the Calendar event API, while task completion still uses the Tasks API.

Month navigation fetches a read-only composed calendar overview for the visible grid range. Day cells show grouped counts rather than full task/event lists to avoid overcrowding. Selecting a day updates the selected-day panel and creates new events for that date by default.

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
GET    /api/calendar/overview?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
POST   /api/calendar/events
GET    /api/calendar/events/{event_id}
PATCH  /api/calendar/events/{event_id}
DELETE /api/calendar/events/{event_id}
```

Deletes are soft archives in this phase. Normal list and detail endpoints only return active, non-archived events.

The calendar overview endpoint is read-only and composes data owned by Calendar and Tasks. Its response contains one entry per date with separate `calendar_events`, `daily_tasks`, and `recurring_tasks` arrays.

Current calendar limitations:

- No recurring calendar events
- No reminders or notifications
- No external calendar sync
- No drag-and-drop event moving
- No advanced week/day calendar views
- No task/event unification
- No calendar-side task create/edit forms beyond completion toggles
- No task category filtering on Calendar yet

## Planning Module

The planning module is a simple read-only planning view. It does not own planning tables and does not duplicate task or calendar data.

It composes:

- One-time tasks
- Recurring task occurrences scheduled for the relevant dates
- Calendar events

The browser UI at `http://localhost:3000/planning` currently provides:

- A selected date
- Day Plan for that date
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

The daily planning endpoint returns the selected date, one-time tasks, recurring task occurrences, and calendar events for that date. The weekly endpoint returns week start/end plus seven grouped day summaries.

## Shared Frontend UI And Data Layer

The frontend now has a small shared foundation to keep the MVP pages from feeling like disconnected test screens:

- `frontend/app/globals.css`: UI Foundation v1 visual tokens and app-level component classes for soft surfaces, buttons, inputs, cards, and sheet tiles.
- `frontend/src/components/ui.tsx`: shared `PageHeader`, `SectionCard`, `AppButton`, `AppCard`, `Badge`, `EmptyState`, `LoadingState`, `ErrorState`, `NoticeState`, `DateSelector`, `DateNavigator`, and shared input class tokens.
- `frontend/src/lib/api.ts`: shared API request wrapper, environment-backed API base URL, consistent JSON headers, `204 No Content` handling, and validation/error message formatting.
- `frontend/src/lib/date.ts`: shared local ISO date, local day math, display-date, and weekday helpers.

UI Foundation v1 gives the app a soft minimalist personal-workspace direction: warm off-white backgrounds, pale cream surfaces, muted sage/teal primary actions, lavender/sage supporting accents, soft rose danger actions, low-contrast borders, rounded cards, readable typography, and gentle shadows. The current/default palette is `Robot Vanilla`; `DuckBerry` and `BozzyWheat` are local-only palette options saved in browser `localStorage` that tint both accents and soft white surfaces.

Dashboard widgets and sheet widgets now share a calmer card language. Sheets Visual Refinement v1 extends that foundation for `/sheets` with a dedicated workspace-canvas surface, softer tile elevation, more coherent compact widget rows, and a more intentional floating workspace dropdown while preserving the existing fixed 4x2 layout and behavior.

Feature modules still own their product-specific API functions and page behavior. The shared layer is intentionally small and practical; it is not a full design system, brand system, or state framework.

## MVP Hardening Notes

This pass focused on consistency, preparation, and a small controlled customization layer:

- Navigation spacing and hover states are more consistent.
- UI Foundation v1 adds the first coherent visual token layer and soft pastel workspace styling.
- Date selectors and status messages use shared UI primitives where practical.
- `DateNavigator` provides previous day, date input, Today, and next day controls while keeping browser-local `YYYY-MM-DD` date handling.
- `DateNavigator` is used on the dashboard date widget, Tasks, Calendar, Tracker, Planning, and the Sheets widget date control.
- Frontend API error handling is centralized instead of duplicated per feature.
- Dashboard sections now render through code-defined widget definitions and a lightweight widget renderer.
- Widget Foundation v1 prepares the dashboard for future configurable widgets while keeping the dashboard fixed.
- Dashboard Customization v1 persists widget visibility and order without making widgets database-defined.
- Sheet/Grid Prototype v1 adds a separate `/sheets` route with persisted named sheets and fixed 4x2 widget slots.
- Workspace UX Safety + Navigation Polish adds sheet action confirmations, last active sheet restore, left/right sheet reordering, sheet note preview, DateNavigator adoption, and recurring task Quick Add.
- Backend module behavior was reviewed for archive/date/error consistency; stable APIs were left intact.

The app remains a modular monolith. Dashboard and Planning compose data owned by Notes, Tasks, Calendar, and Tracker. The dashboard owns only its layout preference table, and Sheets owns only sheet/slot persistence.

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

Task categories are a lightweight grouping layer for one-time and recurring tasks. They are not tags, projects, or a tracker category system.

Categories:

- have a name and optional color string
- must have a non-empty name
- are unique among active categories by application validation
- can be archived
- remain referenced by existing tasks after archive for historical safety
- cannot be assigned to new or updated tasks after archive

One-time tasks:

- Belong to one specific date.
- Have a title, optional description, optional planned time, optional due date/time, completion state, and soft archive flag.
- Can optionally belong to one task category.
- Can be created, edited, completed, marked incomplete, and archived.
- Normal lists only return active, non-archived tasks and can filter by category.
- Use `DailyTask`, `daily_tasks`, and `/api/tasks/daily` internally for compatibility.

Recurring tasks:

- Are templates with a title, optional description, recurrence type, and optional end date.
- Can optionally belong to one task category.
- Support weekly recurrence with one or more weekdays.
- Support bi-weekly recurrence with one or more weekdays and an anchor date.
- Support monthly-by-day recurrence with a day of month from 1 through 31.
- Skip months that do not contain the selected monthly day, such as day 31 in April.
- Use weekday integers internally for weekly-style recurrence: `0` is Monday and `6` is Sunday.
- Can be created, edited, filtered by weekday/category, and archived.
- Completion is tracked per occurrence date in `weekly_task_completions`.
- Completing and uncompleting a recurring occurrence is idempotent.
- A recurring occurrence can only be completed for a date that matches the template's recurrence rule.
- Use `WeeklyTask`, `weekly_tasks`, and `/api/tasks/weekly` internally for compatibility.

The browser UI at `http://localhost:3000/tasks` currently provides:

- A working date selector
- Simple task category management
- One-time task list for that date
- One-time task category filtering
- One-time task create/edit/archive with optional planned time and deadline fields
- One-time task category assignment
- One-time task complete/incomplete
- Recurring task occurrence list for the selected date
- Recurring task category filtering
- Weekly, bi-weekly, and monthly-by-day recurrence form controls
- Recurring task category assignment
- Recurring occurrence complete/incomplete for the selected date when the task is scheduled
- Recurring task archive
- Loading, empty, success, and error states

The module lives mainly in:

- `backend/app/modules/tasks/models.py`
- `backend/app/modules/tasks/schemas.py`
- `backend/app/modules/tasks/router.py`
- `frontend/app/tasks/page.tsx`
- `frontend/src/features/tasks/`

## Tasks API Overview

One-time tasks:

```text
GET    /api/tasks/daily?date=YYYY-MM-DD
GET    /api/tasks/daily?date=YYYY-MM-DD&category_id=1
POST   /api/tasks/daily
PATCH  /api/tasks/daily/{task_id}
DELETE /api/tasks/daily/{task_id}
POST   /api/tasks/daily/{task_id}/complete
POST   /api/tasks/daily/{task_id}/incomplete
```

The `/api/tasks/daily` name is legacy/internal for one-time dated tasks. Create/update/read responses include `planned_time`, `due_date`, and `due_time` as nullable fields. Empty optional time/date fields can be sent as `null` or omitted.

Recurring tasks using legacy `/weekly` routes:

```text
GET    /api/tasks/weekly
GET    /api/tasks/weekly?date=YYYY-MM-DD
GET    /api/tasks/weekly?weekday=0
GET    /api/tasks/weekly?weekday=0&category_id=1
POST   /api/tasks/weekly
PATCH  /api/tasks/weekly/{task_id}
DELETE /api/tasks/weekly/{task_id}
GET    /api/tasks/weekly/completions?completion_date=YYYY-MM-DD
POST   /api/tasks/weekly/{task_id}/complete?completion_date=YYYY-MM-DD
POST   /api/tasks/weekly/{task_id}/incomplete?completion_date=YYYY-MM-DD
```

Task categories:

```text
GET    /api/tasks/categories
POST   /api/tasks/categories
PATCH  /api/tasks/categories/{category_id}
DELETE /api/tasks/categories/{category_id}
```

Deletes are soft archives in this phase.

## Run Migrations

Start the stack first:

```powershell
docker compose up --build -d
```

In a second PowerShell window, apply migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Check the current migration:

```powershell
docker compose exec backend alembic current
```

The first migration is intentionally empty. The second migration creates the `folders` and `notes` tables. The third migration creates `daily_tasks`, `weekly_tasks`, and `weekly_task_completions`. The fourth migration creates `calendar_events`. The fifth migration creates `water_entries` and `activity_entries`. The sixth migration creates `calorie_entries`. The seventh migration creates `dashboard_widget_preferences` for Dashboard Customization v1. The eighth migration creates `sheets` and `sheet_widget_slots` for Sheet/Grid Prototype v1. The ninth migration adds `task_categories`, nullable task category references, and per-slot `config_json`. The tenth migration adds nullable `planned_time`, `due_date`, and `due_time` fields to one-time tasks while keeping the existing `daily_tasks` table. The eleventh migration adds recurrence fields to `weekly_tasks` while keeping the existing table and API names.

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

The tests check the database foundation plus practical notes/folders, tasks, calendar, tracker, planning, dashboard, dashboard layout customization, sheets, and search behavior: folder nesting, note CRUD/archive, one-time task CRUD/time fields/deadline fields/completion/archive/category assignment/category filtering, recurring task weekly/bi-weekly/monthly validation, recurring task editing/filtering/category assignment/category filtering, recurring occurrence completion idempotency, invalid occurrence dates, recurring task archive, task category create/edit/archive behavior, calendar event CRUD/archive/date filtering/upcoming lists, tracker water/activity/calorie CRUD/archive/summary behavior, tracker independence from task categories, planning daily/weekly composition, dashboard summaries for selected dates, dashboard widget default layout, visibility, reorder, validation, reset behavior, sheet default creation, create/rename/delete/reorder behavior, sheet boundary move behavior, sheet order persistence, last-sheet delete protection, duplicate sheet widget instances, per-slot config persistence, slot validation, grouped search results, case-insensitive matching, empty-query handling, and archived-record exclusion.

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
- Drag-and-drop, resizable widgets, final no-scroll sheets, or `x/y/w/h` grid placement
- Persisted widget instances, database-defined widgets, widget plugin APIs, advanced widget configuration, or formal sheet-scoped widget settings
- A formal command palette engine
- External calendar sync, recurring calendar events, invitations, attendees, reminders, or notifications
- Advanced tracker analytics, charts, wearable integrations, macros, food database, nutrition database, meal planning, or a custom tracker builder
- Editable planning engine, time blocking, planning tables, or planning-specific reminders
- Tags, backlinks, markdown preview, rich text editing, attachments, or semantic search for notes
- Recursive folder archive/delete
- Search deep links to module pages instead of opening specific result detail views
- Choosing a folder from Quick Add note creation
- Advanced task recurrence rules, subtasks, priorities, labels, dependencies, reminders, or notifications
- Dark mode, a full branding/logo system, and a complete design-system package

Those belong in later phases from the roadmap.

## Troubleshooting On Windows

If `docker compose` is not recognized, install or update Docker Desktop and reopen PowerShell.

If Docker cannot connect to `dockerDesktopLinuxEngine`, start Docker Desktop and wait until it says the engine is running.

If ports are already in use, edit `.env` and change `FRONTEND_PORT`, `BACKEND_PORT`, or `POSTGRES_PORT`, then run `docker compose up --build -d` again.

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
docker compose up --build -d
```

If the database is in a broken local state and you do not need its data:

```powershell
docker compose down -v
docker compose up --build -d
docker compose exec backend alembic upgrade head
```
