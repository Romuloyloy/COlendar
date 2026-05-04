# MVP Scope

## Purpose of This Document

This document defines what belongs in the first version of the app and what should be postponed.

This is especially important because the long-term vision includes customizable sheets, widgets, and possibly AI features. Those ideas should influence the architecture, but they should not overload the MVP.

## MVP Summary

The MVP is a local-first, desktop-first personal productivity dashboard.

It includes:

1. App shell and dashboard
2. Notes with folders
3. Daily tasks
4. Weekly recurring tasks
5. Simple internal calendar events
6. Basic water/activity tracking
7. A fixed dashboard showing useful sections

It does not include full customization, full sheet navigation, AI, collaboration, or external integrations.

## MVP Modules

## 1. App Shell

### Included

- Basic app layout
- Navigation between main sections
- Dashboard as the default home screen
- Local development setup
- Basic error and loading states

### Not Included

- Final sheet-based top dropdown navigation
- Advanced animations
- Mobile-first navigation
- User-created themes

## 2. Dashboard

### Included

The dashboard should show a fixed overview of:

- Today's date
- Daily tasks
- Weekly tasks relevant to the current week
- Upcoming events
- Recent or pinned notes
- Water/activity summary

### Not Included

- Drag-and-drop customization
- Multiple sheets
- Movable widgets
- Resizable widgets
- No-scroll full-screen sheet UI

### Future Direction

The fixed dashboard sections should be implemented in a way that they can later become widget components.

For example:

- DailyTasksSection can later become DailyTasksWidget
- UpcomingEventsSection can later become UpcomingEventsWidget
- RecentNotesSection can later become NotesWidget
- TrackerSummarySection can later become TrackerWidget

## 3. Notes

### Included

- Create note
- Edit note
- Delete or archive note
- View note list
- View note details
- Create folders
- Nested folders
- Move note into folder
- Notes may optionally exist without a folder

### Not Included

- Rich text editor
- Markdown preview as a must-have
- Tags
- Backlinks
- Full-text search
- AI summaries
- Attachments

### Important Design Requirement

The note/folder model should support nested folders from the beginning.

## 4. Tasks

### Included

- Create daily task
- Edit task
- Mark task complete/incomplete
- Delete/archive task
- Show tasks for today
- Create simple weekly recurring task
- Show weekly tasks by day of week

### Daily Task Definition

A daily task is a task connected to a specific date.

Example:

- Buy groceries today
- Study German today
- Clean room today

### Weekly Task Definition

A weekly task is a recurring task connected to one or more weekdays.

Example:

- Gym upper body every Tuesday
- Run every Friday
- Review lecture notes every Sunday

### Not Included

- Complex recurrence rules
- Dependencies between tasks
- Subtasks
- Team task assignment
- Priority systems beyond a simple optional field
- Time blocking unless added later

## 5. Calendar

### Included

- Create event
- Edit event
- Delete event
- View upcoming events
- Store title, date, start time, end time, and optional description

### Not Included

- Google Calendar sync
- Outlook sync
- Invitations
- Shared calendars
- Complex recurring events
- Time zone complexity beyond local usage

## 6. Tracker

### Included

Start with simple tracking only.

Initial tracker types:

- Water intake
- Activity entry

### Water Entry

Fields may include:

- date
- amount
- unit

### Activity Entry

Fields may include:

- date
- activity type
- duration or quantity
- optional note

### Not Included

- Fully customizable tracker builder
- Charts-heavy analytics
- Wearable integration
- Nutrition database
- Advanced health statistics

## 7. Authentication and Users

### MVP Decision

The app is single-user first.

### Included

- The architecture may include a user_id field where appropriate to avoid future rewrites.
- A simple authentication approach may be added if the app is exposed outside localhost.

### Not Included

- Collaboration
- Role-based access control
- Teams
- Sharing
- Invitations
- Admin panel

## 8. AI / LLM Features

### MVP Decision

No in-app AI features in MVP.

LLMs may be used as development assistance tools, especially Codex, but the product itself should not depend on AI for its first usable version.

### Postponed AI Ideas

Possible future AI features:

- Summarize notes
- Suggest daily plans
- Generate weekly review
- Search notes semantically
- Convert natural language into tasks/events
- Chat with personal productivity data

## 9. Future Sheet/Grid Interface

### MVP Decision

Do not implement the full sheet/grid system in MVP.

### Must Preserve Future Possibility

The MVP dashboard should be built using reusable section components so those sections can later become widgets.

Future concepts:

- Sheet
- WidgetInstance
- WidgetType
- WidgetConfig
- 4x2 grid layout
- Widget resizing
- Sheet navigation
- Top-center dropdown/command bar

## Definition of Done for MVP Features

A feature is done only when:

1. The data model is considered.
2. Backend validation exists.
3. Database migration exists if needed.
4. API routes are implemented.
5. UI has loading, empty, error, and success states where relevant.
6. Data persists correctly.
7. Basic tests exist for important backend logic.
8. The feature does not break unrelated modules.
9. Documentation is updated if the behavior or setup changes.
10. Future extensibility is considered but not overbuilt.

## MVP Development Order

Recommended order:

1. Project setup
2. App shell
3. Database setup
4. Notes and folders
5. Tasks
6. Dashboard
7. Calendar events
8. Tracker
9. Cleanup and hardening
10. Prepare future widget foundation

## Out of Scope Until Later

Do not implement these until explicitly planned:

- Full sheet UI
- Drag-and-drop layout
- Resizable widgets
- External calendar sync
- AI assistant
- Semantic search
- Mobile app
- Team features
- Advanced notification system
- Advanced analytics
- Plugin marketplace
