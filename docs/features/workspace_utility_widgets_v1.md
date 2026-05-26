# Workspace Utility Widgets v1

## Goal

Fix several daily-use friction points around tasks, events, notes, and widgets.

This feature focuses on practical utility, not a major redesign.

## Scope

Implement:

1. Carry-forward / open one-time tasks
2. Configurable upcoming events widget horizon
3. Notes widget filtered by folder
4. Folder selection in Quick Add for notes

## 1. Carry-Forward / Open One-Time Tasks

Current issue:

If a one-time task was planned for yesterday and is not completed, it is not visible today unless the user manually checks yesterday.

Desired behavior:

The app should support an “open tasks” view/concept.

Open one-time tasks are:

- incomplete one-time tasks
- planned for today or earlier
- still relevant until completed
- if they have a due date, they should clearly show due/overdue status

Do not silently hide overdue tasks unless there is a clearly documented reason.

Preferred behavior:

- Past incomplete tasks remain visible in an “Open Tasks” section/widget.
- Tasks with due dates in the past show as overdue.
- Completed tasks disappear from Open Tasks.
- Archived tasks are excluded.

Apply where useful:

- Tasks page
- Sheets task widget option
- Dashboard/review if low-risk

Widget config:

Add or extend one-time task widget mode:

- selected date tasks
- open/carry-forward tasks

The sheet slot editor should allow selecting this mode.

## 2. Upcoming Events Widget Horizon

Current issue:

Upcoming events may need different horizons, such as 7 days or 30 days.

Desired behavior:

Upcoming Events widget should support a configurable horizon.

Widget config options:

- 7 days
- 14 days
- 30 days
- maybe custom number if simple

Requirements:

- Include one-time and recurring calendar event occurrences.
- Respect category filters if already supported.
- Keep compact rendering readable.
- Slot editor should expose the horizon setting.
- Dashboard can keep its current default if changing it is risky.

## 3. Notes Widget Filtered by Folder

Current issue:

The user cannot add a Notes widget that only displays one folder.

Desired behavior:

Recent Notes / Notes widget should support folder filtering.

Widget config:

- folder_id optional
- include_descendants true by default
- title_override optional

Behavior:

- No folder selected = normal recent notes
- Folder selected = notes from that folder
- Include notes from child folders if include_descendants is true
- Show folder/path indicator when useful

Slot editor should allow choosing a folder for notes widgets.

## 4. Quick Add Note Folder Selection

Current issue:

Quick Add can create notes, but cannot choose a folder.

Desired behavior:

Quick Add note creation should support:

- title
- content
- optional folder
- optional category if notes already support categories

Folder dropdown should include active folders.

Keep it simple.

## Backend

Add backend support only where needed.

Possible additions:

- endpoint/query for open one-time tasks
- event query horizon support if missing
- note query by folder with descendants if missing
- folder list for Quick Add if frontend cannot already fetch it

Avoid new tables unless absolutely necessary.

Avoid migrations unless absolutely necessary.

## Frontend

Update:

- Tasks page if adding Open Tasks section
- Sheets widget config UI
- One-time task widget rendering
- Upcoming Events widget config/rendering
- Notes widget config/rendering
- Quick Add note form

Keep UI consistent with the current soft workspace design.

## Non-Goals

Do not implement:

- Calendar weekly view
- Immersive edge-hover sheet chrome
- drag-and-drop
- new sheet layout system
- AI
- auth
- reminders/notifications
- task/event unification
- advanced recurrence changes
- major redesign

## Tests

Add practical backend tests if backend behavior changes:

- open tasks includes incomplete past tasks
- open tasks excludes completed tasks
- open tasks excludes archived tasks
- open tasks marks/returns due or overdue info if implemented
- upcoming event horizon includes valid events/occurrences
- notes by folder includes descendant notes
- notes by folder excludes archived notes/folders
- Quick Add note creation with folder uses existing note API correctly if backend test coverage exists

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md if useful
- docs/UX_GUIDELINES.md if useful

Mention:

- Open Tasks / carry-forward behavior
- Upcoming Events widget horizon
- Notes widget folder filter
- Quick Add note folder selection

## Acceptance Criteria

- Existing important routes still work:
  - `/`
  - `/sheets`
  - `/notes`
  - `/tasks`
  - `/calendar`
  - `/tracker`
  - `/review`
  - `/search`
  - `/categories`
- Past incomplete one-time tasks can be shown as open/carry-forward tasks
- Completed tasks do not appear in open tasks
- Archived tasks do not appear in open tasks
- One-time task widget can show open/carry-forward tasks
- Upcoming Events widget can be configured for a horizon such as 7 or 30 days
- Upcoming Events widget still supports recurring event occurrences
- Notes widget can filter by folder
- Notes widget can include descendant folders
- Quick Add note form can choose a folder
- Quick Add note creation still works without folder
- Existing category behavior still works
- Sheets still work
- Widget configs still persist
- Frontend build passes
- Backend tests pass
- README.md updated
- ForCO.txt updated