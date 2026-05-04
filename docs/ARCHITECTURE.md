# Architecture

## Purpose of This Document

This document defines the intended architecture of the app.

The goal is to build a serious, maintainable personal productivity web app that starts simple but can grow into a customizable dashboard/workspace system.

## Architecture Summary

The app should be built as a **modular monolith**.

This means:

- One main backend application
- One main frontend application
- One database
- Clear module boundaries inside the codebase
- No microservices at the beginning
- No distributed system complexity unless truly needed later

The app should be local-first at the start, but deployable later.

## Recommended Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query or equivalent query/state synchronization library

### Backend

- FastAPI
- Python
- Pydantic / Pydantic Settings
- SQLAlchemy
- Alembic

### Database

- PostgreSQL

### Future AI / Search Support

- pgvector may be added later if semantic search or embeddings become necessary.

### Background Jobs

- Redis + RQ may be added later if background processing is needed.

Examples of future background jobs:

- note summarization
- embedding generation
- reminder processing
- weekly report generation

Do not add a worker layer until there is a real need.

### Development and Deployment

- Docker Compose for local multi-service setup
- Environment variables for configuration
- Database migrations through Alembic
- Clear README setup instructions

## High-Level System

The app consists of:

1. Frontend web app
2. Backend API
3. PostgreSQL database
4. Optional future worker
5. Optional future AI service layer

## Module Boundaries

The app should be organized around product modules, not random pages.

Expected modules:

- dashboard
- notes
- tasks
- calendar
- tracker
- users/auth
- future widgets
- future sheets
- future ai

## Backend Module Responsibilities

### notes

Responsible for:

- folders
- nested folders
- notes
- note CRUD
- moving notes between folders

### tasks

Responsible for:

- daily tasks
- weekly recurring tasks
- completion state
- task filtering by date/week

### calendar

Responsible for:

- internal events
- upcoming event queries
- event CRUD

### tracker

Responsible for:

- water entries
- activity entries
- simple daily summaries

### dashboard

Responsible for:

- composing data from other modules
- returning dashboard summaries
- not owning core data itself

### widgets, future

Responsible for:

- widget types
- widget instances
- widget config
- mapping dashboard sections into reusable widget components

### sheets, future

Responsible for:

- sheet records
- sheet ordering
- layout grid
- widget placement
- widget sizing

## Frontend Structure Principle

Frontend should separate:

1. Page routes
2. Feature modules
3. Shared UI components
4. API client logic
5. Types
6. Layout/app shell

Avoid putting all logic directly inside route/page files.

## Data Ownership Principle

Each module should own its own core data.

For example:

- notes owns notes and folders
- tasks owns tasks and recurrence
- calendar owns events
- tracker owns tracking entries
- dashboard reads from other modules but should not duplicate their data

## Future Widget Model

The MVP should not implement a full widget system, but it should prepare for one.

Future conceptual model:

```text
Sheet
- id
- user_id
- name
- sort_order
- created_at
- updated_at

WidgetInstance
- id
- sheet_id
- widget_type
- x
- y
- w
- h
- config_json
- created_at
- updated_at
```

Possible widget types:

```text
daily_tasks
weekly_plan
upcoming_events
recent_notes
pinned_note
water_tracker
activity_summary
calendar_preview
stats_summary
```

## MVP Dashboard to Future Widget Migration

During MVP, create dashboard sections as separate reusable components.

Example:

```text
DashboardPage
  TodaySection
  DailyTasksSection
  WeeklyTasksSection
  UpcomingEventsSection
  RecentNotesSection
  TrackerSummarySection
```

Later, these can become:

```text
SheetPage
  WidgetRenderer
    DailyTasksWidget
    WeeklyTasksWidget
    UpcomingEventsWidget
    RecentNotesWidget
    TrackerSummaryWidget
```

This allows the product to start simple while preserving the future GUI direction.

## Future Sheet/Grid UI Concept

The long-term UI idea:

- The viewport is occupied by one sheet.
- Each sheet has a fixed 4x2 grid.
- Each grid cell can contain one widget.
- Some widgets may span multiple cells.
- There is no normal vertical scrolling in the main sheet view.
- Moving the mouse toward the top-center reveals an arrow or dropdown trigger.
- Clicking it opens a global dropdown/command bar.
- The dropdown includes:
  - home/dashboard
  - notes
  - daily plan
  - weekly plan
  - calendar
  - stats
  - customize
  - left/right sheet navigation

This should not be implemented until the core modules are stable.

## Database Design Principles

1. Prefer explicit relational models.
2. Use migrations for all schema changes.
3. Avoid storing important structured data only as JSON.
4. JSON fields are acceptable for future widget configuration.
5. Add user_id where it prevents future pain, even if the app is single-user first.
6. Prefer soft delete/archive for user-created content when appropriate.
7. Keep created_at and updated_at timestamps on major records.

## API Design Principles

1. APIs should be resource-oriented.
2. Validate input on the backend.
3. Return predictable error responses.
4. Avoid leaking database internals to the frontend.
5. Keep dashboard APIs read/composition-focused.
6. Keep module APIs focused on their own data.

Example resource areas:

```text
/api/notes
/api/folders
/api/tasks
/api/calendar/events
/api/tracker/water
/api/tracker/activity
/api/dashboard
```

## Authentication Stance

The app is single-user first.

However, avoid hardcoding assumptions that make future user support painful.

Suggested approach:

- Include user ownership in database models where reasonable.
- Avoid team/collaboration features.
- Do not implement role-based access control in MVP.
- Add proper authentication before exposing the app publicly.

## Configuration Principles

Use environment variables for configuration.

Examples:

- database URL
- secret keys
- environment name
- debug mode
- allowed origins
- future API keys

Do not commit secrets to the repository.

## Testing Principles

Start with practical tests.

Priority:

1. Backend unit tests for core domain logic
2. Backend API tests for important routes
3. Database migration sanity
4. Frontend component tests only where useful
5. End-to-end tests later for major flows

Important flows to test:

- create folder
- create nested folder
- create note in folder
- create daily task
- complete task
- create weekly recurring task
- create calendar event
- create tracker entry
- dashboard summary loads

## Logging and Error Handling

The app should have deliberate logging.

Log:

- startup information
- major backend errors
- failed validations where useful
- background job failures if workers exist later

Do not log sensitive data unnecessarily.

Frontend should show useful error states instead of silently failing.

## Codex / LLM Development Rules

Codex should be treated as a coding assistant, not the architect.

When asking Codex to implement a feature, provide:

1. Goal
2. Scope
3. Files/modules it may touch
4. Files/modules it should not touch
5. Data model expectations
6. API expectations
7. UI expectations
8. Tests required
9. Acceptance criteria

Codex should not be asked to "build the whole app" in one prompt.

Good Codex tasks are small and vertical.

Example:

```text
Implement the notes folder model and CRUD API only.
Do not modify dashboard, tasks, calendar, or tracker modules.
Include SQLAlchemy models, Pydantic schemas, Alembic migration, FastAPI routes, and basic tests.
```

## Architectural Decision Principle

When making important choices, write a short ADR.

ADR means Architecture Decision Record.

Examples:

- Why modular monolith?
- Why Postgres?
- Why no AI in MVP?
- Why fixed dashboard before sheet grid?
- Why internal calendar before external sync?

Keep ADRs short. A few paragraphs are enough.
