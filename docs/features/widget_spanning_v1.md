# Widget Spanning v1

## Goal

Allow sheet widgets to span multiple grid cells in a controlled way.

This is the next step toward the long-term sheet system, where some widgets can be larger than others.

Examples:

- 1x1 normal widget
- 2x1 wide widget
- 1x2 tall widget
- optional 2x2 large widget if simple

This is NOT freeform resizing and NOT drag-and-drop.

## Current State

Sheets currently use:

- fixed 4x2 grid
- one widget slot per cell
- widget instances with config_json
- duplicate widget instances
- widget library / slot editor
- compact widget rendering
- palettes
- empty slot Quick Add

Current limitation:

- every widget occupies exactly one cell
- some widgets need more room to feel useful

## Scope

Add controlled widget spanning on `/sheets`.

A widget instance should be able to have a size preset:

- `1x1`
- `2x1`
- `1x2`
- optionally `2x2`

Keep the grid fixed at 4 columns x 2 rows.

## Non-Goals

Do not implement:

- drag-and-drop
- freeform resizing
- arbitrary x/y/w/h layout
- mobile layout redesign
- per-widget custom dimensions
- dashboard spanning
- sheet templates
- animation-heavy layout changes
- unrelated product features

## Backend Changes

Update the sheet slot/widget instance model to support spanning.

Preferred simple model:

- `slot_index`
- `col_span`
- `row_span`

Where:

- `slot_index` is the top-left anchor cell
- `col_span` is 1 or 2
- `row_span` is 1 or 2

Allowed sizes:

- 1x1
- 2x1
- 1x2
- 2x2 if simple

Validation:

- widget must fit inside the 4x2 grid
- widget must not overlap another widget
- slot_index must remain 0–7
- duplicate widget types are still allowed
- config_json behavior remains unchanged

Add an Alembic migration if needed.

## Collision Rules

The backend should reject invalid layouts.

Examples:

- 2x1 widget cannot start at the last column
- 1x2 widget cannot start on the bottom row
- widgets cannot overlap occupied cells
- clearing a widget frees its occupied cells

Keep the algorithm simple and well-tested.

## API Behavior

Existing sheet slot update API should support size fields.

If the current endpoint updates all slots at once, include span info in each slot.

If the current endpoint updates one slot at a time, include span info there.

Do not add a separate complex layout engine.

## Frontend Changes

Update `/sheets`.

Slot editor should allow selecting widget size:

- Normal 1x1
- Wide 2x1
- Tall 1x2
- Large 2x2 if implemented

The UI should explain that larger widgets occupy neighboring cells.

Requirements:

- user can choose widget size in slot editor
- unavailable sizes should be disabled or show a readable error
- occupied cells should visually merge into one widget area
- empty cells covered by a spanning widget should not show separate empty slots
- clearing a spanning widget frees all covered cells
- widget configs still work
- duplicate widget types still work
- category filters still work
- title overrides still work

## Visual Behavior

The sheet grid should still feel calm and stable.

Spanning widgets should:

- visually occupy the correct space
- keep rounded card style
- avoid breaking the sheet layout
- use compact rendering, but allow more content when larger
- stay readable

Do not make the grid feel technical or harsh.

## Widget Rendering

Widgets may receive size/span information if useful.

Example:

- 1x1 widgets show compact summary
- 2x1 or 1x2 widgets can show slightly more content
- 2x2 widgets can show richer content

Keep this simple.

Do not redesign every widget deeply in this phase.

Prioritize:

- One-time tasks
- Recurring tasks
- Calendar/events
- Notes
- Tracker summary

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md
- docs/UI_SYSTEM.md if useful

Mention:

- supported widget sizes
- collision behavior
- current limitations
- no drag-and-drop yet
- no freeform resizing yet

## Acceptance Criteria

- `/sheets` still works
- existing routes still work
- widget library still works
- empty slot Quick Add still works in normal mode
- edit mode slot configuration still works
- user can create a 1x1 widget
- user can create a 2x1 widget
- user can create a 1x2 widget
- 2x2 works if implemented
- invalid spans are rejected safely
- overlapping widgets are prevented
- clearing a spanning widget frees its occupied cells
- widget configs persist after refresh
- duplicate widget instances still work
- task category filters still work
- title overrides still work
- palette selection still works
- frontend build passes
- backend tests pass
- migration applies if added
- README.md and ForCO.txt are updated