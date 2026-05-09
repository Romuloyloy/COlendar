# Recurrence v1

## Goal

Expand recurring task support beyond weekly weekday templates, while keeping the system simple and safe.

The app currently supports:

- One-time Tasks
- Weekly Tasks based on selected weekdays
- Calendar Events without recurrence

This feature should add limited recurrence options for tasks only.

## Current State

Current recurring task support:

- Weekly tasks can repeat on one or more weekdays.
- Completion is tracked per occurrence date.
- Weekly recurrence is intentionally simple.
- Calendar events are not recurring.
- One-time tasks are separate from recurring tasks.

Current user need:

The user wants to be able to create tasks like:

- Every 2 weeks
- 11th of every month
- Every month on a specific day
- Possibly tasks that continue until a certain end date

## Product Model

Tasks are completable things.

Recurring Tasks are templates that generate or represent occurrences.

Calendar Events are still separate and should not gain recurrence in this feature.

Planning, Dashboard, Sheets, and Tasks should display recurring task occurrences for relevant dates.

## Scope

Implement Recurrence v1 for tasks.

Add support for these recurring task patterns:

1. Weekly recurrence, existing behavior
2. Bi-weekly recurrence
3. Monthly recurrence by day of month
4. Optional recurrence end date if simple

This should be an evolution of the current Weekly Task system.

## Non-Goals

Do not implement:

- Full RFC 5545 recurrence rules
- Natural language recurrence parsing
- Calendar event recurrence
- Yearly recurrence
- Custom complex intervals beyond bi-weekly/monthly
- “Every N days” unless very simple and clearly scoped
- Recurrence exceptions
- Skipped occurrences
- Editing individual generated occurrences
- Drag-and-drop scheduling
- Notifications
- Reminders
- AI recurrence generation
- External calendar sync
- Major task/event unification

## Backend Design Direction

Prefer evolving the current weekly recurring task model rather than creating a huge new recurrence engine.

However, avoid hardcoding in a way that blocks future recurrence improvements.

Possible approach:

Rename conceptually in code/API only if low-risk. Otherwise keep existing `WeeklyTask` internally but extend it carefully.

A cleaner model may be:

- RecurringTask
- RecurringTaskCompletion

But do not do risky table renames unless necessary.

If keeping current table names, document that `WeeklyTask` is legacy/internal naming for recurring task templates.

## Data Model

Add recurrence fields to the current recurring task model.

Suggested fields:

- `recurrence_type`
  - `weekly`
  - `biweekly`
  - `monthly_day`
- `weekdays`
  - used for weekly and biweekly recurrence
- `interval_weeks`
  - optional, for weekly/biweekly style
  - can be 1 for weekly and 2 for biweekly
- `anchor_date`
  - required for biweekly recurrence to know which week pattern starts the cycle
- `day_of_month`
  - required for monthly_day recurrence
- `start_date`
  - optional or required depending on current model
- `end_date`
  - optional

Keep the final chosen model simple and document it.

## Recurrence Behavior

### Weekly

Existing behavior should remain:

- Task can occur on one or more weekdays.
- Completion is tracked per occurrence date.

### Bi-weekly

Bi-weekly recurrence should support:

- One or more weekdays
- An anchor/start date
- Occurs every 2 weeks based on the anchor date week

Example:

- Task starts on 2026-05-04
- Recurs every 2 weeks on Monday
- It appears on Mondays in alternating weeks

Use a simple predictable algorithm and document it.

### Monthly by Day of Month

Monthly recurrence should support:

- A day of month such as 11
- Occurs on that day every month

Example:

- Pay rent on the 1st of every month
- Submit report on the 11th of every month

Edge case:

- If `day_of_month` is 31 and a month does not have 31 days, choose one simple behavior:
  - skip that month
  - or use last day of month

Prefer the simpler behavior and document it clearly.

Recommended: skip months that do not contain the selected day.

### End Date

If implemented:

- Recurring task does not appear after end_date.
- Existing completions before end_date remain valid.

If adding end_date complicates implementation too much, skip it and document as future work.

## API Behavior

Existing weekly task API may remain if safer.

But user-facing behavior should become “Recurring Tasks” where practical.

Existing endpoints may remain:

- `GET /api/tasks/weekly`
- `POST /api/tasks/weekly`
- `PATCH /api/tasks/weekly/{task_id}`
- completion endpoints

If keeping `/weekly` endpoints, document that they now represent recurring task templates internally/legacy.

API should support:

- create weekly recurring task
- create bi-weekly recurring task
- create monthly day recurring task
- list recurring tasks relevant to a date
- filter by category
- complete occurrence for a date
- uncomplete occurrence for a date
- archive recurring task

Validation:

- title must not be empty
- recurrence_type must be valid
- weekly/biweekly tasks need at least one weekday
- biweekly tasks need anchor_date/start_date
- monthly_day tasks need valid day_of_month
- day_of_month must be 1–31
- end_date, if present, should not be before start/anchor date
- category filtering must continue to work
- archived recurring tasks should not appear in normal lists

## Occurrence Logic

Occurrence matching should be centralized in backend logic.

Avoid duplicating recurrence logic across Dashboard, Planning, Sheets, and Tasks.

Places that need occurrence behavior:

- Tasks page
- Dashboard
- Planning
- Sheets widgets
- Search if it shows recurring tasks
- Quick Add if it creates recurring tasks

## Frontend Changes

Update the Tasks page recurring task section.

User should be able to create/edit recurring tasks with recurrence type:

- Weekly
- Bi-weekly
- Monthly by day

For weekly:

- choose weekdays

For bi-weekly:

- choose weekdays
- choose anchor/start date

For monthly by day:

- choose day of month

Optional:

- end date if implemented

Keep the UI simple and understandable.

Do not build a complex recurrence rule builder.

## Quick Add Changes

Update Quick Add recurring task creation.

It should support:

- Weekly recurring task
- Bi-weekly recurring task
- Monthly day recurring task

If this makes Quick Add too crowded, use a simple recurrence type selector.

Do not add advanced recurrence options.

## Dashboard, Planning, and Sheets

Update recurring task displays so they respect recurrence type.

Dashboard:

- show recurring tasks scheduled for selected/today date
- weekly/biweekly/monthly occurrences should appear correctly

Planning:

- daily plan should show recurring tasks scheduled for selected date
- weekly plan should show recurring tasks scheduled on each day of the week

Sheets:

- recurring task widgets should show occurrences for the sheet/workspace selected date
- category filters must still work
- duplicate configured widget instances must still work
- compact rendering must remain contained

## Calendar

Do not add recurring calendar events.

Do not merge recurring tasks into calendar events.

If Calendar currently displays tasks, keep behavior consistent. If Calendar only displays events, do not force tasks into the calendar in this feature.

## Search

Search should still find recurring task templates by title/description/category where applicable.

No need to search individual future occurrences.

## Tests

Add or update backend tests for:

- existing weekly recurrence still works
- creating weekly recurring task
- creating bi-weekly recurring task
- bi-weekly task appears on valid alternating weeks
- bi-weekly task does not appear on off weeks
- creating monthly day recurring task
- monthly task appears on matching day of month
- monthly task does not appear on non-matching days
- monthly day 31 edge case follows documented behavior
- recurrence end_date behavior if implemented
- category filtering still works
- completing weekly occurrence still works
- completing bi-weekly occurrence works
- completing monthly occurrence works
- invalid recurrence_type is rejected
- invalid weekdays are rejected
- invalid day_of_month is rejected
- archived recurring tasks are excluded
- dashboard/planning recurring task summaries still work if those tests exist

Keep tests practical.

## Documentation

Update `README.md` with:

- Recurrence v1 overview
- Supported recurrence types
- Weekly behavior
- Bi-weekly behavior
- Monthly day behavior
- End date behavior if implemented
- Known limitations
- API naming note if `/weekly` remains legacy/internal
- Windows PowerShell test/run commands

Update `ForCO.txt` with:

- What changed
- How to test it
- What success looks like
- Known limitations
- Recommended next phase

Update `docs/TASK_EVENT_MODEL.md` if needed to reflect Recurrence v1.

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
- Existing weekly recurring tasks still work
- User can create weekly recurring tasks
- User can create bi-weekly recurring tasks
- User can create monthly day recurring tasks
- Recurring task occurrences appear on correct dates
- Recurring task occurrences do not appear on incorrect dates
- Recurring task completion still works per occurrence date
- Category filtering still works
- Quick Add can create supported recurring task types
- Dashboard shows recurring task occurrences correctly
- Planning shows recurring task occurrences correctly
- Sheets show recurring task occurrences correctly
- Duplicate configured sheet widgets still work
- Backend health works
- DB health works
- Alembic migration applies if migration is needed
- Backend tests pass
- Frontend build passes
- README.md is updated
- ForCO.txt is updated
- TASK_EVENT_MODEL.md is updated if needed