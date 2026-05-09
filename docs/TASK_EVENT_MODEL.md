# Task/Event Model

This document defines the current product language around tasks, recurring tasks, events, planning, and calendar.

## Current Model

- Tasks are things to complete.
- Events are things that happen at a time.
- Planning is a combined overview of tasks and events.
- Calendar is the date/time visual view.

## Tasks

- One-time Tasks are currently implemented internally as daily tasks.
- User-facing language should move toward "One-time Tasks."
- One-time Tasks are completable things attached to a planned date.
- Weekly Tasks are recurring task templates with weekday-based occurrences.
- Weekly Task completion is tracked per occurrence date.

## Events, Planning, And Calendar

- Calendar Events are scheduled happenings, appointments, or blocks.
- Planning composes One-time Tasks, Weekly Tasks, and Calendar Events.
- Calendar should eventually become a more visual calendar view.

## Current Limitations

- No monthly recurrence yet.
- No bi-weekly recurrence yet.
- No advanced recurrence engine yet.
- Events and tasks are not unified yet.
- Backend `/api/tasks/daily` may remain legacy naming for one-time dated tasks.

## Practical Rule

Do not merge tasks and events just because they appear together in planning. Keep ownership separate until a feature spec explicitly defines a unification phase.
