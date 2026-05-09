# Task/Event Cleanup v1

## Goal

Clarify the difference between tasks and events without fully merging them.

The app currently has daily tasks, weekly tasks, and calendar events. Daily tasks are really one-time dated tasks, so the user-facing language should become clearer.

This feature should improve the product model and UI wording while avoiding a risky backend rewrite.

## Current State

The app currently has:

- One-time dated tasks implemented internally as daily tasks
- Weekly recurring tasks
- Calendar events
- Planning views that combine tasks and events
- Dashboard and sheet widgets that show tasks/events
- Quick Add support for one-time tasks, weekly tasks, events, notes, tracker entries
- Task categories for daily/weekly tasks

Current issue:

- “Daily Task” sounds like a repeating daily task, but it is actually a one-time task attached to a date.
- Calendar events and one-time tasks feel conceptually close.
- The app needs clearer wording before adding more recurrence or planning features.

## Product Model

Use this conceptual distinction:

- One-time Tasks = things to complete, attached to a planned date
- Weekly Tasks = recurring task templates with weekday-based occurrences
- Calendar Events = scheduled happenings/appointments/blocks
- Planning = combined overview of tasks and events
- Calendar = visual date/time view

Tasks are completable.
Events are scheduled things that happen.
Planning combines both.

## Scope

Implement Task/Event Cleanup v1.

Main changes:

1. Rename user-facing “Daily Task(s)” to “One-time Task(s)”
2. Add optional planned time to one-time tasks
3. Add optional due date to one-time tasks
4. Update relevant UI labels and docs
5. Keep backend routes mostly stable
6. Keep calendar events separate

## Non-Goals

Do not implement:

- Full task/event unification
- Advanced recurrence
- Monthly recurrence
- Bi-weekly recurrence
- Reminders
- Notifications
- Event checkboxes
- Task subtasks
- Task priorities
- Task dependencies
- External calendar sync
- Drag-and-drop
- Widget resizing
- Major database table renames
- Major API rewrites

## Backend Changes

Keep existing `/api/tasks/daily` endpoints unless there is a strong reason to change them.

It is acceptable that the backend still internally uses names like `DailyTask`.

Add optional fields to the existing one-time/daily task model:

- `planned_time` optional
- `due_date` optional

Optional if simple:

- `due_time`

If `due_time` adds too much complexity, skip it and document as future work.

Meaning:

- `task_date` = date the task is planned/shown on
- `planned_time` = optional time the user intends to do it
- `due_date` = optional deadline
- `due_time` = optional deadline time, if implemented

## Migration

Add an Alembic migration for the new optional task fields.

Do not rename existing tables in this phase.

Existing tasks must continue to work.

## API Behavior

Update create/update/list responses for one-time/daily tasks to include the new optional fields.

Existing task creation without these fields must continue to work.

Validation:

- Title must not be empty
- `task_date` remains required
- `planned_time` is optional
- `due_date` is optional
- `due_time` is optional if implemented
- Invalid date/time values should produce readable errors

Do not add complex deadline rules unless simple.

## Frontend Changes

Update user-facing wording across the app:

Replace:

- “Daily Task”
- “Daily Tasks”

With:

- “One-time Task”
- “One-time Tasks”

Update at least:

- Tasks page
- Dashboard widgets
- Sheet widgets
- Planning page
- Quick Add
- Search result labels if relevant
- Empty states
- Form labels
- README / ForCO

## Tasks Page Changes

One-time task forms should support:

- title
- optional description
- planned date
- optional planned time
- optional due date
- optional due time if implemented
- optional category
- complete/incomplete
- archive/delete

Display one-time task metadata clearly:

- planned time if present
- due date if present
- due time if present
- category if present

Keep the UI simple.

## Quick Add Changes

Update Quick Add wording:

- “One-time Task”
- “Weekly Task”
- “Calendar Event”

One-time Task Quick Add should support:

- title
- optional description
- planned date
- optional planned time
- optional due date
- optional category

If due time is implemented, include it only if the form stays simple.

Weekly Task Quick Add should continue working.

Calendar Event Quick Add should remain separate.

## Dashboard, Sheets, and Planning

Update all relevant task displays:

Dashboard:

- show “One-time Tasks”
- show planned time/due date briefly if useful

Sheets:

- compact task widgets should use “One-time Tasks”
- category filtering must still work
- duplicate configured widget instances must still work
- title overrides must still work

Planning:

- daily plan should show:
  - one-time tasks
  - weekly task occurrences
  - calendar events

Search:

- search result type should say “One-time Task” instead of “Daily Task” if user-facing

## Calendar/Event Clarification

Do not merge calendar events with tasks.

Calendar events should remain:

- scheduled happenings
- appointments
- blocks
- events with date/time/details

Tasks should remain:

- completable items

Do not add checkboxes to events.

## Tests

Update or add backend tests for:

- creating one-time task without optional fields
- creating one-time task with planned time
- creating one-time task with due date
- updating planned time
- updating due date
- listing tasks includes new optional fields
- completing/uncompleting still works
- category filtering still works
- dashboard/planning summaries still work if backend tests exist
- search still finds tasks

Keep tests practical.

## Documentation

Update `README.md` with:

- One-time Tasks explanation
- Weekly Tasks explanation
- Calendar Events explanation
- Difference between tasks and events
- Note that `/api/tasks/daily` may remain legacy/internal naming
- Optional planned time/deadline behavior
- Migration/test commands
- Current limitations

Update `ForCO.txt` with:

- What changed
- How to test it
- What success looks like
- Known limitations
- Recommended next phase

## Constraints

Follow:

- `docs/MASTER_CONTEXT.md`
- `docs/PROJECT_CONSTRAINTS.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/TASK_EVENT_MODEL.md`
- `docs/UX_GUIDELINES.md`

Do not violate project constraints.

## Acceptance Criteria

- Docker Compose app starts successfully
- Existing routes still work:
  - `/`
  - `/notes`
  - `/tasks`
  - `/calendar`
  - `/tracker`
  - `/planning`
  - `/search`
  - `/sheets`
- User-facing UI says “One-time Tasks” instead of “Daily Tasks”
- Existing task behavior still works
- One-time tasks can be created without optional fields
- One-time tasks can be created with planned time
- One-time tasks can be created with due date
- One-time tasks can be edited with planned time/due date
- One-time task completion still works
- Weekly tasks still work
- Task categories still work
- Quick Add still works
- Quick Add supports one-time task fields
- Calendar events remain separate
- Dashboard still works
- Sheets still work
- Planning still works
- Search still works
- Backend health works
- DB health works
- Alembic migration applies
- Backend tests pass
- Frontend build passes
- README.md is updated
- ForCO.txt is updated