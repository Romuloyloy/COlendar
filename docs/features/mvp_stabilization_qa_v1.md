# MVP Stabilization / QA Pass v1

## Goal

Stabilize the current MVP surface before marking the app as a solid v0.1 local workspace alpha.

This phase should focus on cleanup, UX fixes, route simplification, and quality-of-life corrections.

This is not a feature-expansion phase.

## Scope

Implement the following stabilization items:

1. Retire Home and Planning from the primary product surface
2. Improve nested-folder note visibility
3. Improve Notes page layout proportions
4. Fix Calendar month-view flashing/month-jump behavior
5. Add Sheets-only Stark Mode variants for existing palettes
6. General QA/regression cleanup

## 1. Retire Home and Planning

Current issue:

- The app now centers around Sheets.
- Home/dashboard and Planning are becoming less necessary as top-level product areas.

Desired behavior:

- Remove `Home` from primary navigation.
- Remove `Planning` from primary navigation.
- Make `/sheets` the primary workspace destination.

Root behavior:

- `/` should no longer feel like a separate Home dashboard.
- Prefer redirecting `/` to `/sheets`, or rendering the Sheets workspace at `/` if that is cleaner.
- Do not break shared dashboard/widget code that Sheets still depends on.

Planning behavior:

- Remove the Planning page from main navigation.
- If `/planning` still exists, either:
  - redirect it to `/review`, or
  - show a simple “Planning moved into Review/Calendar/Sheets” transition page.
- Do not delete backend planning code if it is still used by Review, Dashboard, Calendar, or tests.
- Prefer safe retirement over aggressive deletion.

Documentation should explain that Sheets are now the main workspace surface.

## 2. Parent Folder Should Show Descendant Notes

Current issue:

When selecting a parent folder, notes inside child folders are not clearly visible.

Desired behavior:

- When a parent folder is selected, show notes directly inside that folder AND notes inside its descendant folders.
- Make it clear when a note comes from a child folder.

Example:

```text
School
  Lecture Notes
    Signals Note

Selecting School should show Signals Note, with a folder/path indicator like:

Lecture Notes / Signals Note

Requirements:

Existing direct-folder note behavior should still work.
Root/all notes behavior should remain understandable.
Archived notes/folders should remain excluded as currently intended.
Avoid expensive/fragile recursion if the existing folder tree can provide this safely.

Backend or frontend implementation is acceptable. Choose the simpler reliable approach.

3. Notes Page Layout Proportions

Update the Notes page layout.

Desired desktop layout:

25% folder tree / 25% notes list / 50% note editor-detail

Requirements:

Folder segment around 25%
Notes list segment around 25%
Actual note editor/detail segment around 50%
Desktop-first
Keep it usable on smaller screens, but do not do a mobile redesign
Editor/detail area should feel more important and comfortable
Preserve current note create/edit/archive/category behavior
4. Calendar Month View No-Flash / No Month Jump

Current issues:

Calendar view flashes during month/date changes.
When viewing May and clicking April 30 shown in the May grid, the calendar jumps to April.

Desired behavior:

Month navigation
Pressing previous/next month should transition cleanly.
Avoid visible flash/blank state if possible.
Keep previous data visible until new data is ready if that fits the current frontend data pattern.
Loading state should be subtle and not destructive.
Clicking adjacent-month days

If the current month view shows adjacent-month days, clicking those days should select that date but should NOT automatically navigate the visible month.

Example:

Visible month: May
Calendar grid includes April 30
User clicks April 30
Selected date becomes April 30
Visible month remains May

This keeps month view stable.

If there is a strong reason to navigate months on adjacent-day click, make it explicit through a separate control, not the default day click.

5. Sheets-Only Stark Mode

Current palettes:

Robot Vanilla
DuckBerry
BozzyWheat

Add a Stark Mode variant/toggle for Sheets only.

Goal:

Stark Mode should make the /sheets workspace visually bold/dark using the selected palette.
This should apply only to the Sheets segment/workspace, not necessarily the whole app.

Behavior:

User can enable/disable Stark Mode for Sheets.
Preference persists after refresh using localStorage or current frontend preference pattern.
Stark Mode should work with all current palettes:
Robot Vanilla Stark
DuckBerry Stark
BozzyWheat Stark

Visual direction:

Robot Vanilla Stark
darker neutral/warm background
white or near-white text
soft vanilla accent
DuckBerry Stark
deep berry/purple workspace background
white or near-white text
muted lavender/berry accents
BozzyWheat Stark
dark olive/wheat background, inspired by #423e02
white or near-white text
muted wheat/gold accent, inspired by #bab01c
softer wheat surface/accent, inspired by #d9d3b4

Important:

Stark Mode should feel intentional and readable.
Avoid neon/high-saturation styling.
Keep sheet widgets readable.
Do not destroy the calm workspace identity.
Do not add full app-wide dark mode yet.
6. General QA / Regression Cleanup

While implementing the above, check for obvious regressions:

Quick Add still works
Global Search still works
Review Center still works
Category Workspace still works
Sheets still work
Sheet context still works
Widget configs still persist
Recurring tasks still work
Recurring events still work
Notes categories still work
Event categories still work
Tracker remains category-free
Palettes still work

Do not add unrelated features.

Backend Changes

Expected backend changes are minimal.

Possible backend changes:

note/folder query support for descendant notes if frontend-only implementation is not clean
tests for descendant notes if backend behavior changes

Avoid:

new tables unless absolutely necessary
migrations unless absolutely necessary
major route changes
deleting backend modules aggressively
Frontend Changes

Expected frontend changes:

route/nav simplification
Notes layout update
Calendar state/loading behavior fix
Sheets Stark Mode toggle and styling
folder descendant notes display
documentation updates
Tests

Add/update practical tests where behavior changes.

Suggested tests if backend changes:

selecting/querying parent folder includes descendant notes
archived notes/folders remain excluded
existing note filtering still works

Frontend build must pass.

Backend tests must pass.

Documentation

Update:

README.md
ForCO.txt
docs/MASTER_CONTEXT.md if needed
docs/SHEETS_VISION.md
docs/UI_SYSTEM.md
docs/UX_GUIDELINES.md if needed

Mention:

Sheets are now the primary workspace surface
Home/Planning have been retired from primary navigation
parent folders show descendant notes
Notes layout is now 25/25/50 on desktop
Calendar month view selection behavior
Sheets-only Stark Mode
Stark Mode is not full app-wide dark mode
Non-Goals

Do not implement:

AI
auth
drag-and-drop
new sheet templates
advanced analytics
mobile redesign
full app-wide dark mode
new recurrence features
task/event unification
external integrations
notifications/reminders
major backend rewrites
Acceptance Criteria
/sheets is the primary workspace destination
Home is removed from primary navigation
Planning is removed from primary navigation
/ redirects to or clearly opens the sheet workspace
/planning is safely retired, redirected, or clearly handled
Existing important routes still work or redirect intentionally:
/
/notes
/tasks
/calendar
/tracker
/review
/search
/sheets
Parent folder selection shows descendant notes
Notes page desktop layout is approximately 25% / 25% / 50%
Calendar month navigation does not visibly flash/blank harshly
Clicking adjacent-month dates does not automatically change visible month
Robot Vanilla Stark works on Sheets
DuckBerry Stark works on Sheets
BozzyWheat Stark works on Sheets
Stark Mode persists after refresh
Normal soft palette mode still works
Quick Add still works
Global Search still works
Review Center still works
Category Workspace still works
Sheet widget configs still persist
Recurring tasks/events still work
Frontend build passes
Backend tests pass
README.md updated
ForCO.txt updated