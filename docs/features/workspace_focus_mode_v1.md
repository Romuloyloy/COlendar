# Workspace Focus Mode v1

## Goal

Allow widgets inside `/sheets` to temporarily enter a focused/enlarged state for deeper interaction and readability.

This should make the workspace feel more immersive and useful without changing the underlying sheet layout model.

Examples:

- expand Notes widget for reading
- expand Calendar widget for more events
- expand Tasks widget for easier interaction
- expand Tracker widget for detailed summary

This is a temporary focus/view mode, not permanent resizing.

## Current State

Sheets currently support:

- fixed 4x2 grid
- widget spanning
- widget configs
- compact widgets
- workspace dropdown
- palette system
- widget library
- Quick Add integration

Current limitation:

- compact widgets are good for overview
- but some interactions feel cramped
- notes/calendar/tasks sometimes need temporary breathing room

## Scope

Add Focus Mode for widgets inside `/sheets`.

A widget should be able to temporarily expand into a larger overlay/panel while preserving the underlying sheet layout.

## Non-Goals

Do not implement:

- permanent resizing
- drag-and-drop
- freeform layouts
- floating windows
- multi-window desktop system
- sheet templates
- advanced animations
- backend persistence of focus mode
- mobile redesign
- unrelated product features

## Product Behavior

Widgets should support a lightweight “Focus” action.

Possible interactions:

- click focus icon/button
- double click widget header if tasteful
- keyboard shortcut optional if simple

When focused:

- widget expands into a centered overlay/panel
- background workspace becomes slightly subdued
- focused widget shows richer content
- user can still close and return to normal sheet view

The original sheet layout should remain intact underneath.

## Focused Widget Experience

Focused widgets should feel:

- calm
- immersive
- workspace-like
- distraction-reduced
- soft and readable

Not:

- full-screen takeover
- harsh modal
- separate page
- enterprise popup

## Widget Types

Focus mode should work especially well for:

### Notes

- easier reading
- larger preview/content area

### Calendar

- more visible events/details

### One-time Tasks

- easier scrolling/interactions

### Recurring Tasks

- more readable occurrence lists

### Tracker

- more detailed summaries/history

Other widgets may support focus mode later.

## Visual Direction

Focus mode should visually fit the soft workspace system.

Suggested direction:

- softened backdrop
- centered large card/panel
- rounded corners
- slightly elevated surface
- subtle transition
- comfortable spacing

Avoid:

- heavy glassmorphism
- giant shadows
- flashy transitions
- harsh dark overlays

## Interaction Rules

Requirements:

- focus mode can be opened from widgets
- focus mode can be closed easily
- Escape key closes focus mode if simple
- background interaction should be disabled while focused
- focus mode should not break keyboard usability
- sheet state should remain preserved

Do not persist focus state across refresh.

## Widget Rendering

Widgets may support:

- compact mode
- normal mode
- focus mode

Focus mode can show more content/details than compact mode.

Keep implementation pragmatic.

Do not redesign every widget deeply in this phase.

## Backend Changes

Prefer none.

Do not create migrations.
Do not redesign APIs.

Reuse existing frontend data flows where possible.

## Frontend Changes

Implement focus mode system.

Potential structure:

- FocusOverlay
- FocusableWidget wrapper
- widget-specific focused rendering
- lightweight transition handling

Keep architecture simple.

Avoid overengineering a huge modal/window system.

## Accessibility / UX

Preserve:

- readable contrast
- keyboard usability
- clear close affordance
- focus trapping if simple
- accessible Escape behavior if implemented

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md
- docs/UI_SYSTEM.md if useful
- docs/UX_GUIDELINES.md if useful

Mention:

- focus mode behavior
- temporary enlargement concept
- no permanent resizing yet
- no floating windows yet

## Acceptance Criteria

- `/sheets` still works
- existing routes still work
- widget spanning still works
- compact widgets still work
- user can open focus mode from supported widgets
- focused widget appears enlarged/centered
- sheet layout remains preserved underneath
- user can close focus mode easily
- Escape closes focus mode if implemented
- focus mode visually fits the workspace style
- palettes still work
- duplicate widget instances still work
- widget configs still work
- category filters still work
- frontend build passes
- backend tests pass according to Definition of Done
- README.md and ForCO.txt updated