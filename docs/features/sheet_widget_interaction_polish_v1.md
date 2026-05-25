# Sheet Widget Interaction Polish v1

## Goal

Make widgets inside `/sheets` feel more useful, clickable, and workspace-like.

The goal is not to add new data models.  
The goal is to improve how existing widgets behave inside the sheet workspace.

## Scope

Improve sheet widget interactions for:

- one-time task widgets
- recurring task widgets
- notes widgets
- calendar/event widgets
- category overview widgets
- tracker summary widgets where useful

## Widget Header Actions

Each sheet widget should have a clearer header/action area.

Where useful, show actions like:

- Focus / Expand
- Open full page
- Configure
- Refresh if already meaningful

Keep actions subtle and not visually noisy.

## Item Click Behavior

Improve click behavior inside widgets.

Suggested behavior:

### Notes

- clicking a note opens note preview/focus modal
- include “Open in Notes”

### One-time Tasks

- checkbox toggles completion
- clicking task title can show lightweight detail/focus view if simple
- include “Open in Tasks”

### Recurring Tasks

- checkbox toggles occurrence completion
- clicking task title can show lightweight detail/focus view if simple
- include “Open in Tasks”

### Events

- clicking event opens event preview/focus modal
- include “Open in Calendar”

### Category Overview

- clicking section/item navigates or opens preview where simple
- include “Open Category” or “Open full view” if category page exists

Do not build full editing modals unless already easy and safe.

## Focus Mode Integration

If focus mode already exists:

- make widget focus action consistent across widgets
- focused widget should show more readable content
- Escape should still close focus mode if supported
- focus mode should preserve sheet state

If focus mode does not exist or is incomplete, keep this phase to lightweight previews and links.

## Context Awareness

Widgets should respect existing config behavior:

- sheet context category
- specific category filter
- no category filter
- title override
- duplicate widget instances

Do not break category inheritance.

## Empty / Loading / Error States

Improve compact states inside widgets:

- empty states should suggest what to do next
- loading states should be calm and compact
- error states should not break the grid
- text should stay readable

## Visual Direction

Follow the current soft pastel workspace UI.

Interactions should feel:

- calm
- clear
- light
- useful
- not enterprise-like

Avoid:

- noisy action bars
- too many icons
- aggressive hover effects
- large modals for tiny actions

## Backend Changes

Prefer no backend changes.

Do not create migrations.

Only add backend changes if a small missing read endpoint blocks a sensible preview.

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md if useful
- docs/UX_GUIDELINES.md if useful

Mention:

- improved sheet widget interactions
- click behavior
- preview/focus behavior
- current limitations

## Acceptance Criteria

- `/sheets` still works
- existing routes still work
- sheet context category still works
- widget category filters still work
- duplicate widget instances still work
- clicking notes/events/tasks in widgets feels useful
- widgets have clearer action affordances
- focus/preview behavior is consistent where implemented
- compact states are improved
- no backend migration is added unless absolutely necessary
- Quick Add still works
- Global Search still works
- frontend build passes
- backend tests pass according to Definition of Done
- README.md updated
- ForCO.txt updated