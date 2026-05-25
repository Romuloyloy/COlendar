# Task/Event Model

This document defines the current product language around tasks, recurring tasks, events, planning, and calendar.

## Current Model

- Tasks are things to complete.
- Events are things that happen at a time and can optionally repeat.
- Planning is a combined overview of tasks and events.
- Calendar is the date/time visual view.
- Categories are context filters across tasks, notes, and calendar events; tracker entries stay outside this model.

## Tasks

- One-time Tasks are currently implemented internally as daily tasks.
- User-facing language should move toward "One-time Tasks."
- One-time Tasks are completable things attached to a planned date.
- Recurring Tasks are templates with weekly, bi-weekly, or monthly-by-day occurrences.
- Weekly recurrence uses one or more weekdays.
- Bi-weekly recurrence uses one or more weekdays plus an anchor date.
- Monthly recurrence uses a day of month and skips months that do not contain that day.
- Recurring Task completion is tracked per occurrence date.

## Events, Planning, And Calendar

- Calendar Events are scheduled happenings, appointments, or blocks.
- Recurring Calendar Events are event templates projected into dated occurrences.
- Planning composes One-time Tasks, Weekly Tasks, and Calendar Events.
- Calendar is the visual date/time view and may display task occurrences next to events.
- Showing tasks on Calendar does not merge task and event ownership or data models.

## Current Limitations

- No advanced recurrence engine yet.
- No recurrence exceptions or skipped-occurrence editing yet.
- Events and tasks are not unified yet.
- Backend `/api/tasks/daily` may remain legacy naming for one-time dated tasks.
- Backend `/api/tasks/weekly` may remain legacy naming for recurring task templates.

## Practical Rule

Do not merge tasks and events just because they appear together in planning. Keep ownership separate until a feature spec explicitly defines a unification phase.
