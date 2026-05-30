# Immersive Sheet Chrome v1

## Goal

Make `/sheets` feel closer to the original workspace vision:

- the widget grid should dominate the screen
- navigation chrome should stay mostly hidden
- top/left/right/bottom edge controls should appear when needed
- sheet interaction should feel like a workspace, not a normal web page
- task completion controls inside widgets should be easier to click

This is a UI/workspace interaction update, not a data-model feature.

## Scope

Implement:

1. More immersive `/sheets` layout
2. Top edge hover arrow/menu behavior
3. Left/right edge hover sheet navigation arrows
4. Bottom edge hover sheet management/customization menu
5. Optional pin behavior for the top menu
6. Larger button-like task completion checkboxes in sheet task widgets

## Non-Goals

Do not implement:

- calendar week view
- drag-and-drop
- new sheet templates
- new backend models
- new migrations unless absolutely necessary
- auth
- AI
- external integrations
- notifications
- major redesign outside `/sheets`

## 1. Immersive Sheet Layout

The `/sheets` page should feel like a full workspace.

Requirements:

- the 4x2 widget grid should cover most of the available viewport
- reduce unnecessary margins around the grid
- avoid normal page-scroll feeling where practical
- keep widgets contained and readable
- preserve Stark Mode and existing palettes
- preserve widget spanning
- preserve widget configs
- preserve sheet context behavior

The grid should feel like the main product surface.

## 2. Top Edge Workspace Menu

Current workspace menu should become more immersive.

Desired behavior:

- when the mouse moves near the top center/top edge, a small arrow/handle appears
- clicking the arrow opens the workspace menu
- the menu can also have a pin option
- when pinned, the menu remains visible
- when unpinned, it behaves like a hidden/floating workspace control

Requirements:

- do not rely only on hover; there must be a clickable fallback
- menu should remain keyboard/mouse usable
- menu should still include important workspace navigation/actions
- dangerous actions should remain confirmation-protected
- visual style should match the soft workspace UI

## 3. Left/Right Edge Sheet Navigation

Add edge navigation controls for sheets.

Desired behavior:

- when mouse moves near the left edge, a left arrow appears
- clicking it moves to previous sheet
- when mouse moves near the right edge, a right arrow appears
- clicking it moves to next sheet
- controls should be subtle but discoverable
- keyboard sheet navigation should still work if it exists

Requirements:

- respect sheet ordering
- handle first/last sheet safely
- do not break last active sheet persistence
- do not make controls visually noisy

## 4. Bottom Edge Sheet Management Menu

Add bottom edge control for less frequent sheet actions.

Desired behavior:

- when mouse moves near the bottom center/bottom edge, a small arrow/handle appears
- clicking it opens a sheet management/customization menu

This bottom menu can include:

- edit/customize slots
- reorder sheets
- create sheet
- rename sheet
- delete sheet
- reset/apply layout actions if they exist

Requirements:

- dangerous actions remain confirmation-protected
- keep sheet management separate from the primary top navigation if practical
- do not duplicate too much UI if current structure already has it; reorganize carefully
- keep it simple and understandable

## 5. Task Widget Completion Control

In sheet task widgets, the completion checkbox is currently too small.

Improve the completion control inside compact sheet task widgets.

Requirements:

- completion control should be larger and easier to click
- it should feel almost button-like
- it must not exceed the task row height or make the row ugly
- it should remain visually calm
- it should clearly show complete/incomplete state
- it should work for:
  - one-time task widgets
  - recurring task occurrence widgets
  - category-filtered task widgets
  - duplicate task widget instances

This is primarily for sheet widgets, but shared task row components can be improved if safe.

## 6. Preserve Existing Behavior

Do not break:

- Quick Add
- Global Search
- Review Center
- Category Workspace
- sheet context categories
- widget library
- widget spanning
- widget focus mode if implemented
- Stark Mode
- palettes
- recurring tasks
- recurring events
- notes folder filtering
- upcoming event horizons

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md
- docs/UX_GUIDELINES.md
- docs/UI_SYSTEM.md if useful

Mention:

- immersive sheet chrome
- top edge menu
- left/right sheet arrows
- bottom sheet management menu
- pin behavior if implemented
- larger sheet task completion control
- current limitations

## Acceptance Criteria

- `/sheets` still works
- existing important routes still work:
  - `/`
  - `/sheets`
  - `/notes`
  - `/tasks`
  - `/calendar`
  - `/tracker`
  - `/review`
  - `/search`
  - `/categories`
- sheet grid visually covers more of the screen
- top edge arrow/menu works
- top menu can be pinned if implemented
- left/right edge sheet arrows work
- bottom edge sheet management/customization menu works
- dangerous actions still require confirmation
- last active sheet persistence still works
- sheet ordering still works
- widget configs still persist
- widget spanning still works
- Stark Mode still works
- palettes still work
- task completion control in sheet widgets is larger and easier to click
- recurring/one-time task completion still works
- Quick Add still works
- Global Search still works
- frontend build passes
- backend tests pass according to Definition of Done
- README.md updated
- ForCO.txt updated