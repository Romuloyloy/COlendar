# MASTER_CONTEXT.md

## Project Identity

This project is a desktop-first, local-first personal productivity workspace web app.

The app is:
- productivity/sheets workspace first
- AI second (future)
- modular
- extensible
- built with production-style engineering practices

The app is intentionally being developed as if it could later become a serious deployable product.

---

## Supporting Docs

These docs are source of truth for repeated project rules and future feature prompts:

- [PROJECT_CONSTRAINTS.md](PROJECT_CONSTRAINTS.md): default non-goals, architecture principles, and scope guardrails.
- [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md): standard completion checklist and Docker verification commands.
- [TASK_EVENT_MODEL.md](TASK_EVENT_MODEL.md): product language for one-time tasks, weekly tasks, events, planning, and calendar.
- [SHEETS_VISION.md](SHEETS_VISION.md): long-term sheet workspace direction and current sheet guardrails.
- [UX_GUIDELINES.md](UX_GUIDELINES.md): practical UI and product behavior rules.
- [features/](features/): feature specs for future scoped implementation work.

Do not duplicate those docs here; link to them from prompts and feature specs.

---

# Core Product Philosophy

The app should feel like:
- a personal productivity workspace
- a central place for planning, notes, tracking, and organization
- fast and practical for daily use

The app is NOT:
- an AI-first chat app
- a social/collaborative platform
- a microservices architecture
- a feature-explosion productivity suite

The product should remain coherent and understandable.

---

# Current Architecture

## Frontend
- Next.js
- TypeScript
- Tailwind CSS

## Backend
- FastAPI
- Python
- SQLAlchemy
- Alembic

## Database
- PostgreSQL

## Environment
- Docker Compose
- Windows-first local development

---

# Architecture Style

The app uses a modular monolith architecture.

Current major modules:
- dashboard
- sheets
- notes
- tasks
- calendar
- tracker
- planning
- review

Future modules may include:
- AI
- auth

Modules should:
- own their own core logic/data
- avoid tight coupling
- expose clean APIs
- compose through higher-level modules when needed

Examples:
- dashboard composes data
- planning composes data
- notes/tasks/calendar/tracker own data

---

# Current Product Capabilities

Implemented:
- notes + nested folders
- one-time dated tasks
- weekly recurring tasks
- internal calendar events
- water tracking
- activity tracking
- calorie tracking
- dashboard summaries
- sheet workspace as the primary UI surface
- retired planning route redirected to Review
- Sheets-only Stark Mode
- read-focused review center
- archive behavior
- migrations
- backend tests
- frontend pages
- Dockerized local setup

Not implemented:
- auth
- AI
- drag-and-drop
- notifications
- reminders
- external integrations
- advanced analytics
- advanced recurrence systems

---

# Dashboard And Sheets Philosophy

The `/sheets` workspace is the primary UI surface. The dashboard remains as a reusable widget foundation and compatibility surface.

However:
- dashboard sections should be reusable
- dashboard sections now feed widget-like sheet components where practical

Examples:
- DailyTasksSection
- RecentNotesSection
- UpcomingEventsSection
- TrackerSummarySection

Current sheet direction:
- no-scroll workspace
- sheet-based navigation
- fixed 4x2 grid
- reusable widgets
- top-center dropdown/navigation layer
- multiple sheets for contexts:
  - work
  - health
  - school
  - etc.

Do not add drag-and-drop, freeform resizing, arbitrary `x/y/w/h` layout, or sheet templates unless explicitly requested.

---

# Engineering Philosophy

Prefer:
- simple solutions
- consistency
- modularity
- readability
- practical UX
- explicit architecture
- maintainable code

Avoid:
- overengineering
- premature abstraction
- unnecessary libraries
- massive rewrites
- introducing infrastructure too early

---

# Coding Expectations

When implementing features:
- follow existing patterns first
- keep APIs consistent
- keep archive behavior consistent
- keep frontend patterns consistent
- use reusable components where appropriate
- avoid duplicate logic
- keep migrations clean
- keep tests practical

Do not:
- redesign stable modules unnecessarily
- introduce unrelated features
- change architecture direction without strong reason

---

# Prompting Expectations

Assume:
- repo docs are source of truth
- README.md is maintained
- ROADMAP.md exists
- ForCO.txt exists
- current architecture should be respected

Future prompts will usually provide:
- goal
- constraints
- acceptance criteria

Do not require re-explaining the entire project each time.

---

# Current Development Phase

Current phase:
- MVP stabilization
- QA cleanup
- sheet workspace hardening

The project is transitioning from:
"adding features"

to:
"refining a product"

Priorities now:
- coherence
- consistency
- extensibility
- UX polish
- architecture quality

NOT:
- rapid uncontrolled feature expansion

---

# Important Constraints

Unless explicitly requested:
- do not implement auth
- do not implement AI
- do not implement Redis/workers
- do not implement drag-and-drop
- do not implement freeform sheet resizing or arbitrary coordinate layout
- do not implement external integrations
- do not implement notifications/reminders
- do not implement advanced analytics
- do not implement advanced recurrence systems

---

# Development Workflow

Preferred workflow:
1. understand current architecture
2. implement minimal practical change
3. test through Docker Compose
4. verify frontend build
5. verify backend tests
6. update README.md
7. update ForCO.txt

Windows PowerShell instructions should be preferred where commands are documented.
