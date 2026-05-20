# QoL / Utility Update v2

## Goal

Implement three practical quality-of-life improvements:

1. Shared categories for tasks, notes, and calendar events.
2. Correct empty sheet slot behavior so adding widgets is the primary action and Quick Add is secondary.
3. Add recurrence support for calendar events.

This is a utility/coherence update, not a major redesign.

## Scope

### Part 1 — Shared Categories

Current state:

- Categories currently exist for one-time and recurring tasks.
- Notes and events do not currently support categories.

Goal:

Use the same category system across:

- One-time tasks
- Recurring tasks
- Notes
- Calendar events

Tracker entries remain exempt from categories.

## Category Model Direction

User-facing language should become:

```text
Categories

not:

Task Categories

Implementation options:

If the current TaskCategory table/model can be safely renamed to a more general Category, do so carefully.
If renaming is risky, keep the existing database/model name internally and expose it as shared categories in the UI/API/docs.

Prefer safety over perfect naming.

Category Requirements

Categories should support:

name
optional color
archive/delete behavior consistent with existing category behavior

Notes and events should be able to reference a category.

Add optional category_id to:

notes
calendar events

Existing notes/events without categories must continue to work.

Validation:

category_id must exist if provided
archived categories should not be assignable to new/updated notes/events
archived notes/events should still behave as before
tracker entries should remain uncategorized
Category UI Requirements

Update UI where practical:

Notes
assign category when creating/editing a note
show category in note lists/details where useful
filter notes by category if simple
Calendar Events
assign category when creating/editing an event
show category in event lists/month view/day panel where useful
filter events by category if simple
Search

Search results should show category labels where useful.

Do not make category filtering advanced.

Part 2 — Empty Sheet Slot Behavior Correction

Current issue:

Empty sheet slot behavior is reversed/confusing.

Desired behavior:

Normal sheet mode
Empty slot should primarily mean: “Add/configure a widget here.”
Clicking the main empty slot area should open the slot editor/widget library.
Quick Add
Quick Add should still be available from empty slots, but as a secondary action.
Example: a small “Quick Add” button inside the empty slot.
Do not make Quick Add the primary empty-slot click behavior.
Edit/customize mode
Empty slot should continue to open/select the slot editor.

Requirements:

Main empty slot click = add/configure widget
Secondary small button = Quick Add
Visual labels should make this obvious
Existing Quick Add global behavior must still work
Existing widget library/slot editor must still work
Part 3 — Recurring Calendar Events

Current state:

Tasks support recurrence.
Calendar events are one-time only.

Goal:

Add simple recurrence support for calendar events.

This should mirror the current recurring task recurrence patterns where reasonable.

Supported recurrence types:

none / one-time event
weekly
bi-weekly
monthly by day of month

Optional end date if simple and consistent with recurring tasks.

Calendar Event Recurrence Behavior

Calendar events are not completable.

Recurring event occurrences should appear in:

Calendar month view
Calendar selected day panel
Dashboard upcoming events
Planning views
Sheets calendar/event widgets
Search should still find recurring event templates by title/description/location

Do not create individual stored event rows for every occurrence unless the existing architecture strongly suggests it.

Prefer storing recurrence on the event template and projecting occurrences for date ranges.

Calendar Event Recurrence Fields

Add fields to calendar events or a related recurrence structure.

Suggested fields:

recurrence_type
none
weekly
biweekly
monthly_day
weekdays for weekly/biweekly
anchor_date/start_date for biweekly
day_of_month for monthly_day
recurrence_end_date optional

Keep naming consistent with recurring task recurrence where possible.

Recurring Event Validation

Validation should include:

title must not be empty
event date/start date must remain valid
recurrence_type must be valid
weekly/biweekly events need at least one weekday
biweekly events need anchor/start date
monthly_day events need day_of_month 1–31
end date, if implemented, should not be before start/anchor date
archived recurring events should not appear in normal views

Monthly day edge case should follow the same rule as recurring tasks if already documented.

Calendar UI Requirements

Update event create/edit UI so the user can choose recurrence:

None
Weekly
Bi-weekly
Monthly by day

Keep it simple.

Do not build a complex recurrence rule builder.

Calendar month view should show recurring event occurrences on correct dates.

Selected day panel should show recurring event occurrences clearly.

Quick Add Requirements

Update Quick Add calendar event creation to support recurrence if practical.

If this makes Quick Add too crowded, add a simple recurrence type selector and show only relevant fields.

Do not overcomplicate Quick Add.

Backend Requirements

Expected migrations:

add category_id to notes
add category_id to calendar events
add recurrence fields for calendar events
possible category model/table rename only if safe

Avoid unnecessary table renames.

Centralize shared recurrence logic if practical, but do not do a massive rewrite.

Avoid duplicating recurrence occurrence logic too much between tasks and events.

Tests

Add/update practical backend tests for:

Categories
creating shared category still works
assigning category to one-time task still works
assigning category to recurring task still works
assigning category to note
assigning category to calendar event
rejecting invalid category_id for note/event
rejecting archived category assignment
category labels appear in relevant responses if expected
Empty Sheet Slot

Frontend build/regression is enough unless frontend tests exist.

Recurring Events
creating one-time event still works
creating weekly recurring event
creating bi-weekly recurring event
creating monthly day recurring event
recurring event appears on valid occurrence dates
recurring event does not appear on invalid dates
archived recurring events are excluded
dashboard upcoming events include recurring occurrences
planning views include recurring occurrences if backend tests exist
calendar overview/month endpoint includes recurring occurrences
search still finds recurring event templates

Keep tests practical.

Documentation

Update:

README.md
ForCO.txt
docs/TASK_EVENT_MODEL.md
docs/UX_GUIDELINES.md if needed
docs/SHEETS_VISION.md if needed

Mention:

categories are now shared across tasks, notes, and events
tracker remains uncategorized
empty sheet slot primary click opens widget configuration
Quick Add from empty slots is secondary
calendar events now support limited recurrence
recurrence limitations
Non-Goals

Do not implement:

tracker categories
advanced category hierarchy
tags separate from categories
calendar invitations
external calendar sync
recurring event exceptions
editing individual recurring event occurrences
reminders/notifications
AI
auth
drag-and-drop
widget resizing beyond what already exists
sheet templates
major task/event unification
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
Categories work for one-time tasks
Categories work for recurring tasks
Categories work for notes
Categories work for calendar events
Tracker remains category-free
Notes can show/assign categories
Events can show/assign categories
Empty sheet slot primary click opens widget/slot editor
Empty sheet slot has secondary Quick Add action
Global Quick Add still works
Calendar events can be one-time
Calendar events can be weekly recurring
Calendar events can be bi-weekly recurring
Calendar events can be monthly recurring by day
Recurring event occurrences appear correctly in calendar views
Recurring event occurrences appear in dashboard/planning/sheets where relevant
Archived events/categories are handled safely
Backend tests pass
Frontend build passes
Migrations apply cleanly
README.md updated
ForCO.txt updated