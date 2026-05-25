# Review Center v1

## Goal

Add a simple Review Center that helps the user understand their day/week across the whole app.

This should make the app feel more like a personal productivity workspace instead of separate modules.

The Review Center should be read-focused and summary-focused.

## Scope

Add a new route:

```text
/review

The Review Center should include:

Daily Review
Weekly Review
Category Summary
Tracker Summary
Links back to source modules

This feature should compose existing data. Avoid creating new review tables unless absolutely necessary.

Product Behavior

The user should be able to select a date.

From that date, the page should show:

Daily review for selected date
Weekly review for the week containing selected date
Daily Review

Daily Review should show:

one-time tasks planned for the selected date
completed vs incomplete one-time tasks
recurring task occurrences for the selected date
completed vs incomplete recurring occurrences
calendar events for the selected date
notes created or updated on the selected date if easy
tracker totals:
water
calories
activity count or activity minutes

Keep it readable and calm.

Weekly Review

Weekly Review should show a seven-day overview.

For each day, show compact summaries:

task completion count
recurring task completion count
event count
tracker summary
notes count if easy

Also include week-level totals:

completed one-time tasks
incomplete one-time tasks
completed recurring occurrences
incomplete recurring occurrences
event count
water total
calorie total
activity count/minutes
notes created/updated count if easy
Category Summary

Because categories now apply to tasks, notes, and events, add a category summary section.

Show active categories with simple counts for the selected week:

tasks
recurring task occurrences
notes
events

Tracker remains category-free.

If category counts are complicated, keep this first version simple and document limitations.

Backend

Prefer a new read-only review module.

Suggested endpoint:

GET /api/review/summary?date=YYYY-MM-DD

The endpoint should return:

selected date
week start/end
daily summary
weekly summary
category summary

The review module should compose existing modules.

It should not own task, note, event, or tracker data.

Do not create new tables unless absolutely necessary.

Do not add migrations unless absolutely necessary.

Frontend

Add /review.

The UI should follow the current soft workspace design.

Requirements:

date selector using existing DateNavigator if appropriate
Daily Review section
Weekly Review section
Category Summary section
Tracker Summary section
empty states
loading/error states
links to Tasks, Calendar, Tracker, Notes, Categories where useful

Keep it compact but readable.

Sheets / Widgets

Add a simple Review widget if low-risk.

Possible widget:

Review Summary

It can show:

selected date
completed/incomplete task counts
event count
tracker summary
link to /review

This widget should work in sheets and dashboard registry if consistent.

If adding the widget creates too much risk, skip it and document as future work.

Non-Goals

Do not implement:

AI-generated reviews
natural language summaries
charts-heavy analytics
habit scoring
streak systems
advanced statistics
export/report generation
new tracker types
new recurrence rules
notifications/reminders
auth
external integrations
Tests

Add practical backend tests if a review API is created.

Test:

daily review includes one-time tasks
daily review includes recurring task occurrences
daily review includes calendar events
daily review includes tracker totals
weekly review returns seven days
weekly totals exclude archived records
category summary includes categorized tasks/notes/events
tracker remains category-free

Keep tests practical.

Documentation

Update:

README.md
ForCO.txt
docs/MASTER_CONTEXT.md if useful
docs/SHEETS_VISION.md if adding Review widget

Mention:

Review Center is read-focused
it composes existing modules
no AI summaries yet
no heavy analytics yet
Acceptance Criteria
/review route exists
existing routes still work
Review page shows Daily Review
Review page shows Weekly Review
Review page shows Category Summary
Review page shows Tracker Summary
User can change selected date
Review data updates with selected date
Archived records are excluded
Tracker remains category-free
Existing dashboard still works
Existing sheets still work
Quick Add still works
Global Search still works
Recurring tasks/events still work
Category Workspace still works
frontend build passes
backend tests pass
README.md updated
ForCO.txt updated