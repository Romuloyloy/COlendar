# Project Constraints

These constraints are the default guardrails for future implementation work. Do not add excluded capabilities unless a task or feature spec explicitly asks for them.

## Default Non-Goals

Unless explicitly requested, do not implement:

- Authentication or user accounts.
- AI features.
- Redis, workers, background jobs, or queue infrastructure.
- Semantic search or pgvector.
- External integrations.
- Notifications or reminders.
- Drag-and-drop.
- Widget resizing.
- `x/y/w/h` sheet layout.
- Replacing the dashboard with sheets as the homepage.
- Advanced recurrence.
- Major module rewrites unless clearly justified.
- Unrelated feature additions.

## Preferred Principles

- Keep the app a modular monolith.
- Prefer simple, practical UX over clever UI.
- Design desktop-first.
- Keep the product local-first.
- Use the Docker Compose workflow as the main development path.
- Follow existing frontend and backend patterns.
- Keep modules owning their own core data.
- Let dashboard and planning compose existing module data instead of duplicating it.
- Update docs when behavior changes.

## Change Discipline

- Keep changes scoped to the requested task or feature spec.
- Preserve existing pages and APIs unless the change is documented.
- Avoid infrastructure, framework, or architecture changes during ordinary feature work.
