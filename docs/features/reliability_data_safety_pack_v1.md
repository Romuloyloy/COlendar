# Reliability + Data Safety Pack v1

## Goal

Add the first serious-app reliability/data-safety layer before continuing with more product expansion.

This package should make the local MVP feel safer, more professional, and easier to freeze as a v0.1 alpha milestone.

This is not a flashy feature. It is a product-quality package.

## Scope

Implement:

1. Backup / Export v1
2. Settings / Utilities page
3. App diagnostics/status view
4. v0.1 milestone documentation cleanup
5. Known limitations documentation
6. Data safety notes for local-first usage

## 1. Backup / Export v1

Add a simple way to export user data.

The user should be able to export:

- all data as JSON
- notes as JSON or CSV
- tasks as JSON or CSV
- calendar events as JSON or CSV
- tracker entries as JSON or CSV
- categories as JSON or CSV
- sheets/layout data as JSON

Preferred v1 behavior:

- one full JSON export button
- optional per-module export buttons if simple

The full JSON export should include:

- categories
- folders
- notes
- one-time tasks
- recurring tasks
- task completions
- calendar events
- water entries
- activity entries
- calorie entries
- sheets
- sheet widget slots/configs
- dashboard/widget preferences if applicable
- metadata such as export timestamp and app version/milestone if available

## Export Format

Use clear, readable JSON.

Suggested top-level shape:

```json
{
  "metadata": {
    "exported_at": "...",
    "app": "COlendar",
    "version": "v0.1-alpha"
  },
  "data": {
    "categories": [],
    "folders": [],
    "notes": [],
    "tasks": {},
    "calendar": {},
    "tracker": {},
    "sheets": {}
  }
}

Exact shape can follow existing models.

Do not expose internal SQLAlchemy objects directly.

Use stable field names.

Import / Restore

Do NOT implement full import/restore in this phase unless it is extremely simple and safe.

For v1:

export is required
import is optional future work
document that restore/import is not yet implemented
2. Settings / Utilities Page

Add a route:

/settings

or:

/utilities

Choose the name that best fits the current app.

Preferred:

/settings

The page should include:

Export / Backup section
Appearance section if palette/Stark controls are appropriate there
App status / diagnostics section
Links to important docs or local notes if useful
Known limitations summary
Reset/destructive actions only if already existing and safely confirmed

Do not turn this into a huge settings system.

3. App Diagnostics / Status

Add a simple diagnostics/status area.

It can show:

backend health status
database health status
frontend/app version label if available
current active palette
sheets Stark Mode status
maybe export readiness

This can be frontend-composed from existing /health and /health/db.

Do not add complex monitoring.

4. v0.1 Milestone Documentation Cleanup

Update docs so the repo clearly describes the current milestone.

Add or update:

docs/MILESTONE_V0_1_ALPHA.md

Include:

what exists
what is stable enough to use
what is experimental
known limitations
suggested next development paths

Also update:

README.md
ForCO.txt
MASTER_CONTEXT.md if needed

The docs should clearly say:

COlendar v0.1 — Stable Local Workspace Alpha
5. Known Limitations

Create or update:

docs/KNOWN_LIMITATIONS.md

Include current known limitations such as:

local-first only
no auth
no import/restore yet
no external calendar sync
no mobile-first UI
no AI features yet
no notifications/reminders
no drag-and-drop sheet widgets yet
no full production deployment hardening yet
export exists but restore/import is future work

Keep it honest and useful.

6. Local-First Data Safety Notes

Add a short data safety section to README or a doc.

Mention:

data is stored in local PostgreSQL through Docker
user should create exports/backups before major changes
Docker volumes matter for data persistence
deleting Docker volumes may delete local app data
export should be used before risky migrations or resets

Do not overcomplicate.

Backend

Add export endpoints.

Suggested routes:

GET /api/export/full
GET /api/export/notes
GET /api/export/tasks
GET /api/export/calendar
GET /api/export/tracker
GET /api/export/sheets
GET /api/export/categories

If this is too many routes, implement:

GET /api/export/full

first, plus only the easiest per-module exports.

Prefer JSON for v1.

CSV is optional if simple.

Do not create new database tables.

Do not create migrations unless absolutely necessary.

Frontend

Add Settings/Utilities page.

Requirements:

accessible from app navigation / sheet top dropdown if appropriate
full export button
per-module export buttons if implemented
clear explanation of what export does
diagnostics/status section
known limitations summary
calm soft UI style

Export download behavior:

clicking export downloads a .json file
filename should include date/time if simple
example: calendar-export-2026-06-05.json or colendar-export-YYYY-MM-DD.json
Security Note

The app is local-first and currently has no auth.

Do not add auth in this phase.

But document that export endpoints contain personal productivity data and should not be exposed publicly without auth/deployment hardening.

Tests

Add practical backend tests for export endpoints.

Test:

full export returns expected top-level structure
full export includes metadata
full export includes categories
full export includes notes/folders
full export includes tasks/recurring tasks/completions
full export includes calendar events
full export includes tracker entries
full export includes sheets/layout data
archived records behavior is documented and consistent

Decide whether archived records are included in export.

Recommended:

exports should include archived records for backup completeness
UI can mention that export is a backup-style export
Documentation

Update:

README.md
ForCO.txt
docs/MASTER_CONTEXT.md if needed
docs/KNOWN_LIMITATIONS.md
docs/MILESTONE_V0_1_ALPHA.md
docs/DEFINITION_OF_DONE.md only if needed

Mention:

export/backup behavior
settings page
diagnostics/status
known limitations
local data safety
v0.1 alpha milestone state
Non-Goals

Do not implement:

auth
AI
import/restore unless extremely safe and explicitly simple
cloud backup
external integrations
notifications/reminders
drag-and-drop
new sheet templates
new recurrence features
major UI redesign
production deployment hardening
Acceptance Criteria
/settings or chosen settings route exists
existing important routes still work:
/
/sheets
/notes
/tasks
/calendar
/tracker
/review
/search
/categories
full JSON export works
export downloads a readable JSON file
export includes metadata
export includes notes/folders
export includes tasks and recurring tasks
export includes calendar events
export includes tracker entries
export includes categories
export includes sheets/layout data
settings page shows export/backup section
settings page shows simple diagnostics/status
settings page explains local-first data safety
known limitations doc exists
v0.1 milestone doc exists
README.md updated
ForCO.txt updated
no migrations added unless absolutely necessary
frontend build passes
backend tests pass