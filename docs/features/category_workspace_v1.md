# Category Workspace v1

## Goal

Make shared categories more useful across the app.

Categories now apply to:

- one-time tasks
- recurring tasks
- notes
- calendar events

This feature should turn categories into practical workspace/context filters.

Example use cases:

- Work category shows work tasks, notes, and events
- Health category shows gym tasks, health notes, and health events
- School category shows school planning items

Tracker remains category-free.

## Scope

Add category-aware views and widget filtering.

Main improvements:

1. Add a simple Category page or Category view
2. Add category filtering to relevant widgets
3. Add a Category Overview widget
4. Improve category visibility across the app
5. Keep categories simple, not tags

## Non-Goals

Do not implement:

- nested categories
- multiple categories per item
- tracker categories
- category analytics
- category permissions
- project management system
- AI
- auth
- external integrations
- major redesign
- sheet templates

## Category View

Add a simple route:

```text
/categories

or a category detail route if cleaner:

/categories/[id]

Choose the simplest reliable implementation.

The category view should allow the user to:

see all active categories
select a category
see related one-time tasks
see related recurring task occurrences/templates
see related notes
see related calendar events
navigate to the original module pages

Keep it read-focused for v1.

Category editing can stay wherever it currently exists unless moving it is simple.

Category Overview Widget

Add a new sheet/dashboard widget type:

Category Overview

Widget config:

category_id required or optional
optional title_override

Behavior:

When configured with a category, it should show a compact overview:

incomplete one-time tasks for selected date/category
recurring task occurrences for selected date/category
upcoming events for category
recent notes for category

If no category is selected, show a helpful empty/configuration state.

This widget should work well inside sheets.

Existing Widget Category Filters

Extend category filtering to widgets where it now makes sense:

Recent Notes widget can filter by category
Upcoming Events widget can filter by category
One-time Tasks widget already filters by category
Recurring Tasks widget already filters by category

Tracker widgets should not use categories.

Slot editor should expose category filter controls for:

task widgets
notes widget
events widget
category overview widget

Duplicate widget instances must still work.

Examples:

Notes — School
Events — Work
Category Overview — Health
One-time Tasks — Gym
Backend

Prefer using existing APIs if possible.

If needed, add lightweight query support:

notes by category
events by category
calendar overview by category
dashboard/category summary endpoint if useful

Possible endpoint:

GET /api/categories/{category_id}/overview?date=YYYY-MM-DD

This endpoint should compose existing modules and not own their data.

Do not create new tables unless absolutely necessary.

Do not add migrations unless absolutely necessary.

Frontend

Update:

app navigation if adding /categories
sheet slot editor
widget metadata
widget renderer/config behavior
relevant compact widgets

The UI should stay soft, calm, and workspace-like.

Search

If simple, show category labels in search results more consistently.

Do not add advanced category search.

Documentation

Update:

README.md
ForCO.txt
docs/SHEETS_VISION.md if useful
docs/TASK_EVENT_MODEL.md if useful
docs/UX_GUIDELINES.md if useful

Mention:

categories now act as workspace/context filters
tracker remains category-free
category overview widget exists
widget category filters exist for notes/events/tasks
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
Category view/page works if added
User can select a category and see related tasks, notes, and events
Recent Notes widget can filter by category
Upcoming Events widget can filter by category
Task widgets still filter by category
New Category Overview widget exists
Category Overview widget works in sheets
Duplicate configured widget instances still work
Slot editor supports category config for relevant widgets
Tracker remains category-free
Recurring event behavior still works
Recurring task behavior still works
Quick Add still works
Global Search still works
Frontend build passes
Backend tests pass
README.md updated
ForCO.txt updated