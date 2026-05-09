# Calendar Month View v1

## Goal

Upgrade the Calendar page from a basic event list into a simple visual monthly calendar.

The goal is to make the Calendar page feel like an actual calendar while keeping the implementation MVP-level and safe.

This feature should not introduce advanced recurrence, external calendar sync, reminders, notifications, or task/event unification.

## Current State

The app currently has:

- internal calendar events
- a Calendar page at `/calendar`
- calendar event CRUD/archive behavior
- dashboard upcoming events
- planning views that compose tasks and events
- one-time tasks, weekly tasks, tracker, notes, sheets, quick add, and search

The Calendar page currently works, but it is more like an event management page than a visual calendar.

## Product Model

Calendar Events are scheduled happenings, appointments, or time blocks.

Tasks are things to complete.

Planning is a composed overview of tasks and events.

Calendar should become the visual date/time view of scheduled events.

Do not merge tasks and events in this feature.

## Scope

Implement a simple monthly calendar view.

The user should be able to:

- open `/calendar`
- see the current month as a calendar grid
- move to previous month
- move to next month
- jump back to current month
- select a day
- see events for the selected day
- create an event for the selected day
- edit an event
- archive/delete an event
- see events visually inside day cells, at least as short titles/counts

## Non-Goals

Do not implement:

- Google Calendar sync
- Outlook sync
- invitations
- attendees
- recurring calendar events
- reminders
- notifications
- drag-and-drop event moving
- time-block editing
- task/event unification
- advanced calendar week/day views
- color-coded calendars unless very simple
- external integrations
- AI

## Backend Changes

Prefer minimal backend changes.

The existing calendar event API should be reused if possible.

Backend changes are allowed only if needed for efficient month queries.

Useful behavior:

- query events by date range
- return active/non-archived events only by default
- preserve existing create/edit/archive behavior

If the current endpoint already supports `from_date` and `to_date`, use it.

If it does not, add or adjust range query support carefully.

Suggested query:

```text
GET /api/calendar/events?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD

or an equivalent existing route.

Backend should support fetching events for the visible month range.

Do not create new tables unless absolutely necessary.

Do not add migrations unless absolutely necessary.

Frontend Changes

Update the Calendar page.

Requirements:

Add month grid UI
Add month navigation controls
Add selected day panel
Reuse existing event create/edit/archive logic where possible
Preserve existing calendar event behavior
Keep UI desktop-first
Keep styling consistent with the rest of the app
Use shared UI components where appropriate
Use DateNavigator only if it fits; do not force it awkwardly
Dashboard and Planning

Dashboard and Planning should continue working as before.

Do not redesign Dashboard or Planning in this feature.

If Calendar API response shape changes, update Dashboard/Planning safely.

Tests

Add or update backend tests if API behavior changes.

Possible backend tests:

List events by date range
Month range excludes archived events
Events outside date range are excluded
Existing event create/edit/archive tests still pass

Frontend build must pass.

No heavy frontend test setup is required unless already established.

Documentation

Update README.md with:

Calendar Month View v1 overview
How month navigation works
How selected-day events work
Current limitations
Windows PowerShell run/test commands if relevant

Update ForCO.txt with:

What changed
How to test it
What success looks like
Known limitations
Recommended next phase
Constraints

Follow:

docs/MASTER_CONTEXT.md
docs/PROJECT_CONSTRAINTS.md
docs/DEFINITION_OF_DONE.md
docs/TASK_EVENT_MODEL.md
docs/UX_GUIDELINES.md

Do not violate the project constraints.

Acceptance Criteria
Docker Compose app starts successfully
Existing routes still work:
/
/notes
/tasks
/calendar
/tracker
/planning
/search
/sheets
Calendar page shows a monthly grid
User can navigate previous/next month
User can return to current month
User can select a day
Selected day events are shown clearly
Events appear in the month grid as compact indicators or titles
User can create an event for the selected day
User can edit an event
User can archive/delete an event
Archived events do not appear in normal calendar views
Dashboard still shows upcoming events
Planning still shows events
Quick Add still works
Global Search still works
Backend health works
DB health works
Backend tests pass
Frontend build passes
README.md is updated
ForCO.txt is updated