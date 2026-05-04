# Roadmap

## Purpose of This Document

This roadmap describes the planned development phases for the personal productivity dashboard.

The goal is to build slowly, with strong foundations, and avoid overengineering early.

## Current Product Direction

The app is a desktop-first, local-first personal productivity dashboard.

The MVP should provide:

- dashboard
- notes with folders
- daily tasks
- weekly recurring tasks
- simple internal calendar events
- water/activity tracking

The long-term vision includes:

- customizable widgets
- sheet-based full-screen grid interface
- multiple sheets for different contexts
- stats
- possible AI features

## Phase 0: Planning Foundation

### Goal

Prepare the project so development starts with clarity.

### Tasks

- Create Product Brief
- Create MVP Scope
- Create Architecture document
- Create Roadmap
- Decide initial repo structure
- Decide initial development workflow
- Decide naming conventions
- Decide how Codex will be used

### Done When

- The project has enough documentation for a human or LLM coding assistant to understand the intended direction.
- MVP and non-MVP features are clearly separated.

## Phase 1: Project Skeleton

### Goal

Create a reproducible local development setup.

### Tasks

- Initialize repository
- Create frontend app
- Create backend app
- Add PostgreSQL
- Add Docker Compose
- Add environment variable templates
- Add backend health check
- Add frontend app shell
- Add basic README setup instructions

### Done When

- A developer can clone the repo and start the app locally.
- Frontend, backend, and database can run together.
- Backend can connect to the database.
- Basic health check works.

## Phase 2: Database and Migration Foundation

### Goal

Make database changes safe and repeatable.

### Tasks

- Set up SQLAlchemy
- Set up Alembic
- Create initial migration flow
- Add base timestamp fields where useful
- Add simple seed/dev data approach if helpful

### Done When

- Migrations can be created and applied.
- Database schema is not managed manually.
- Future model changes have a clear workflow.

## Phase 3: Notes and Folders Module

### Goal

Build the first real vertical feature.

### Why First

Notes and folders are a good starting module because they teach:

- CRUD
- database relationships
- nested structures
- UI lists/details
- module boundaries

### Tasks

- Folder model
- Nested folder support
- Note model
- Note CRUD API
- Folder CRUD API
- Move note between folders
- Notes page UI
- Folder tree UI, simple version
- Basic backend tests

### Done When

- User can create folders and nested folders.
- User can create notes.
- User can place notes inside folders.
- User can edit and delete/archive notes.
- Data persists.

## Phase 4: Tasks Module

### Goal

Support daily and weekly planning.

### Tasks

- Daily task model
- Weekly recurring task model
- Completion model or completion fields
- API routes for task CRUD
- UI for today's tasks
- UI for weekly tasks
- Mark complete/incomplete
- Basic backend tests

### Done When

- User can add daily tasks.
- User can complete daily tasks.
- User can add weekly recurring tasks.
- User can see weekly tasks by weekday.
- Task data persists.

## Phase 5: Fixed Dashboard

### Goal

Create the first useful home screen.

### Tasks

- Dashboard page
- Today section
- Daily tasks section
- Weekly tasks section
- Upcoming events section placeholder or real data if calendar exists
- Recent notes section
- Tracker summary placeholder or real data if tracker exists
- Dashboard API or composed frontend queries

### Done When

- Opening the app gives a useful overview.
- Dashboard sections are separate reusable components.
- Dashboard is not yet customizable, but is architecturally ready to become widget-based later.

## Phase 6: Calendar Module

### Goal

Create a simple internal calendar.

### Tasks

- Calendar event model
- Create/edit/delete event API
- Upcoming events query
- Calendar list or simple month/week view
- Dashboard upcoming events integration

### Done When

- User can create events.
- User can view upcoming events.
- Dashboard shows upcoming events.
- No external calendar sync exists yet.

## Phase 7: Tracker Module

### Goal

Add lightweight daily tracking.

### Tasks

- Water entry model
- Activity entry model
- API routes for tracker entries
- Simple tracker UI
- Dashboard tracker summary

### Done When

- User can log water.
- User can log activity.
- Dashboard shows simple daily summary.

## Phase 8: Hardening Pass

### Goal

Improve reliability and maintainability before adding complex UI customization.

### Tasks

- Improve error handling
- Improve loading/empty/error states
- Add missing tests
- Clean module boundaries
- Improve README
- Review environment config
- Review database migrations
- Add basic logging conventions
- Fix rough UI issues

### Done When

- The MVP feels stable.
- The codebase is understandable.
- The app can be safely extended.

## Phase 9: Widget Foundation

### Goal

Prepare dashboard sections to become formal widgets.

### Tasks

- Identify existing dashboard sections as widget candidates
- Create widget type definitions in code
- Create a WidgetRenderer concept if useful
- Keep layout fixed at first
- Do not add drag-and-drop yet

### Done When

- Dashboard sections are clearly represented as reusable widget-like components.
- Adding a new dashboard block is straightforward.
- The future sheet/grid system has a clear path.

## Phase 10: Sheet/Grid Prototype

### Goal

Prototype the signature UI idea after the core product works.

### Tasks

- Create Sheet model
- Create WidgetInstance model
- Create fixed 4x2 layout renderer
- Allow multiple sheets
- Add left/right sheet navigation
- Add top-center dropdown trigger
- Render existing widgets inside grid cells
- Save sheet layout to database

### Not Yet

- Free drag-and-drop
- Advanced resizing
- Complex collision detection
- Full customization UI

### Done When

- User can switch between sheets.
- Each sheet displays widgets in a fixed grid.
- Existing dashboard widgets can appear inside sheet cells.

## Phase 11: Customization

### Goal

Allow the user to shape the workspace.

### Tasks

- Add customize mode
- Add/remove widgets from a sheet
- Reorder widgets
- Configure widget settings
- Possibly allow widget spanning such as 1x2 or 2x1
- Add constraints so widgets do not become unusable with too much data

### Done When

- User can create a workspace layout that fits their own contexts.
- Work, health, school, and other contexts can be separated into different sheets.

## Phase 12: Stats and Review Features

### Goal

Add insight and review tools.

### Possible Features

- Daily review
- Weekly review
- Task completion stats
- Water/activity history
- Calendar/task correlation
- Simple charts
- Streaks if useful

### Done When

- The user can understand patterns in their productivity and habits.

## Phase 13: AI Features

### Goal

Add AI only after the app has reliable data and workflows.

### Possible Features

- Natural language task/event creation
- Note summarization
- Weekly planning suggestions
- Semantic search
- Daily review generation
- Chat with personal notes/tasks/calendar

### Important Rule

AI should enhance the app, not replace the core UI.

The app must remain useful without AI.

## Backlog: Later Ideas

- External calendar sync
- Mobile-friendly version
- Desktop app packaging
- Notifications
- Advanced recurring rules
- Tags for notes
- Rich text editor
- Markdown editor
- Attachments
- Search
- Semantic search
- Backups and export/import
- Themes
- Keyboard shortcuts
- Command palette
- Offline-first sync
- Multi-user support

## Current Immediate Next Step

After these documents are created, the next step is:

1. Decide repository structure.
2. Create the initial project skeleton.
3. Set up frontend, backend, database, and Docker Compose.
4. Build the notes/folders module first.
