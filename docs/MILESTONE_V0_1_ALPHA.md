# COlendar v0.1 - Stable Local Workspace Alpha

## What Exists

- Primary `/sheets` workspace with fixed-grid widgets, sheet context, widget spanning presets, focus mode, and immersive chrome.
- Notes with nested folders and shared category assignment.
- One-time tasks, recurring tasks, completions, and carry-forward open work.
- Calendar month view with events, recurring event projection, and task occurrences.
- Tracker entries for water, activity, and calories.
- Shared categories across tasks, notes, and calendar events.
- Review Center, Global Search, Quick Add, and retired Planning redirect.
- Settings & Utilities page with backup-style JSON export and diagnostics.
- Backend health and database health endpoints.
- Docker Compose local development flow.
- Practical backend test coverage and frontend production build verification.

## Stable Enough To Use Locally

- Local Docker Compose usage on a trusted machine.
- Local PostgreSQL persistence through Docker volumes.
- Exporting readable JSON backups before risky changes.
- Daily workspace flows across sheets, notes, tasks, calendar, tracker, categories, review, and search.

## Experimental Or Incomplete

- Import/restore from exports is not implemented.
- No auth, cloud sync, external integrations, AI, notifications, or reminders.
- No production deployment hardening.
- Mobile layouts are usable opportunistically but not the design target yet.
- Sheet widgets do not support drag-and-drop, freeform resizing, or templates.

## Local-First Data Safety

COlendar stores data in the local PostgreSQL database created by Docker Compose. Docker volumes preserve that database across container rebuilds. Removing volumes can remove local app data.

Use `/settings` exports before:

- migrations
- resets
- large refactors
- Docker volume cleanup
- experiments with real data

Exports include archived records for backup completeness. Export files contain personal productivity data and should be stored carefully.

## Suggested Next Development Paths

- Import/restore design after export has proven stable.
- Better in-app backup reminders or manual safety checklist.
- Mobile ergonomics pass.
- Production deployment and auth plan.
- Continued sheet widget polish without adding drag-and-drop prematurely.
