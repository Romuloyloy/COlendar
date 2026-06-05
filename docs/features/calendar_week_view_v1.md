# Calendar Week View v1

## Goal

Add a weekly calendar view to the Calendar page where events are shown visually by hour.

This should make the Calendar page useful not only as a monthly overview, but also as a time-based planning surface.

## Scope

Add a week view mode to `/calendar`.

The Calendar page should support switching between:

- Month view
- Week view

Month view should remain working.

Week view should show:

- seven days of the selected week
- hourly time grid
- calendar events positioned visually by time
- recurring calendar event occurrences
- selected day behavior if useful
- navigation to previous/next week
- jump to current week

## Non-Goals

Do not implement:

- drag-and-drop event rescheduling
- click-and-drag time blocking
- external calendar sync
- reminders/notifications
- task/event unification
- recurring task display in the hourly grid unless already simple and visually clean
- advanced agenda system
- AI features
- auth
- major calendar rewrite

## Product Behavior

Week view should feel like a classic weekly calendar.

Expected layout:

- columns: Monday to Sunday, or locale/current existing week convention
- rows: hours of the day
- event blocks placed according to start/end time
- all-day or no-time events shown in a simple all-day/top area if needed

If an event has no clear start/end time:

- show it in an “All-day / Unscheduled” area for that day
- do not force it into the hourly grid

## Week Navigation

Add controls:

- Previous week
- This week
- Next week

When user changes week:

- visible week changes cleanly
- avoid harsh flashing
- selected date updates predictably

Use browser local date behavior. Avoid UTC date bugs.

## Event Rendering

Events should show:

- title
- time range if available
- category color/label if available
- recurring indicator if useful

Visual rules:

- event blocks should be readable
- overlapping events can be stacked or slightly offset simply
- do not overengineer overlap layout
- keep soft pastel visual system
- avoid dense enterprise-calendar feeling

## Event Interaction

In week view:

- clicking an event should open existing event preview/edit behavior if available
- or select/show it in a side/detail panel
- event create/edit/archive should continue working

If creating an event from a clicked time slot is simple, it may prefill date/time.

If not simple, keep existing create event flow.

## Backend

Prefer existing calendar event/range APIs.

If needed, improve backend query support for:

```text
GET /api/calendar/events?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD