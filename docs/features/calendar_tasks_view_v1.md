# Calendar Tasks View v1

## Goal

Make the Calendar page more useful as a visual planning surface by showing both:

- Calendar Events
- One-time Tasks
- Recurring Task occurrences

This should not merge tasks and events. It should only display them together in a calendar view.

## Current State

The app has:

- Calendar month view
- One-time Tasks
- Recurring Tasks with expanded recurrence support
- Calendar Events
- Planning views
- Dashboard
- Sheets
- Task categories

Current product model:

- Tasks = completable things
- Events = scheduled happenings
- Planning = combined overview
- Calendar = visual date/time view

## Scope

Update the Calendar page so the monthly calendar can show:

- Events
- One-time tasks
- Recurring task occurrences

The selected-day panel should clearly separate:

1. Events
2. One-time Tasks
3. Recurring Tasks

## Non-Goals

Do not implement:

- Task/event unification
- Event recurrence
- Drag-and-drop scheduling
- Time-block calendar editor
- Notifications
- Reminders
- External calendar integrations
- AI features
- Advanced recurrence beyond current recurrence support
- Editing full tasks inside calendar unless simple
- Creating all item types from calendar unless simple

## Product Behavior

Calendar day cells should show compact indicators for:

- Events
- One-time Tasks
- Recurring Tasks

The user should be able to understand at a glance:

- which days have events
- which days have tasks
- which days have recurring task occurrences

Use simple visual labels or grouped counts.

Example:

```text
May 11
2 events
3 tasks
1 recurring

or compact badges.

Selected Day Panel

When a day is selected, show sections:

Events
list events for selected date
keep existing event create/edit/archive behavior
One-time Tasks
list one-time tasks planned for selected date
show complete/incomplete state
allow complete/uncomplete if simple
link to Tasks page
Recurring Tasks
list recurring task occurrences for selected date
show complete/incomplete state
allow complete/uncomplete if simple
link to Tasks page

Keep the panel readable and not overloaded.

Filtering

Add simple visibility toggles if practical:

Show events
Show one-time tasks
Show recurring tasks

These can be frontend-only toggles.

Do not build advanced filtering yet.

Task category filtering on Calendar is optional for this version. If added, keep it simple. If not added, document it as future work.

Backend Changes

Prefer using existing APIs if possible.

If the Calendar page needs a composed endpoint, add a read-only calendar overview endpoint.

Possible endpoint:

GET /api/calendar/overview?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD

Response may include:

events by date
one-time tasks by date
recurring task occurrences by date

This endpoint should compose existing modules and should not own task/calendar data.

Do not create new tables unless absolutely necessary.

Do not add migrations unless absolutely necessary.

Frontend Changes

Update the Calendar page.

Requirements:

Month grid shows events and task indicators
Selected day panel shows separate sections
Existing event creation/edit/archive still works
One-time task completion from selected-day panel if simple
Recurring task occurrence completion from selected-day panel if simple
Keep UI desktop-first
Keep it visually consistent with the app
Avoid overcrowding day cells
Dashboard, Planning, Sheets

Do not redesign these in this feature.

They should continue working.

If shared APIs or types change, update them safely.

Tests

If a backend overview endpoint is added, test:

overview includes events in date range
overview includes one-time tasks in date range
overview includes recurring task occurrences in date range
archived events/tasks are excluded
recurring tasks appear only on valid occurrence dates
completed state is represented correctly if included

Existing backend tests must continue passing.

Frontend build must pass.

Documentation

Update README.md with:

Calendar Tasks View v1 overview
Explanation that tasks and events remain separate
What appears in month cells
What appears in selected-day panel
Current limitations
Windows PowerShell run/test commands

Update ForCO.txt with:

What changed
How to test it
What success looks like
Known limitations
Recommended next phase

Update docs/TASK_EVENT_MODEL.md if needed to clarify that Calendar can visually show tasks without merging task/event models.

Constraints

Follow:

docs/MASTER_CONTEXT.md
docs/PROJECT_CONSTRAINTS.md
docs/DEFINITION_OF_DONE.md
docs/TASK_EVENT_MODEL.md
docs/UX_GUIDELINES.md

Do not violate project constraints.

Acceptance Criteria
Existing routes still work:
/
/notes
/tasks
/calendar
/tracker
/planning
/search
/sheets
Calendar month grid shows event indicators
Calendar month grid shows one-time task indicators
Calendar month grid shows recurring task occurrence indicators
Selecting a day shows events for that day
Selecting a day shows one-time tasks for that day
Selecting a day shows recurring task occurrences for that day
Events and tasks are visually separated
Tasks and events are not merged in the data model
Event create/edit/archive still works
One-time task completion still works if exposed in Calendar
Recurring task occurrence completion still works if exposed in Calendar
Dashboard still works
Planning still works
Sheets still work
Quick Add still works
Global Search still works
Backend health works
DB health works
Backend tests pass
Frontend build passes
README.md is updated
ForCO.txt is updated