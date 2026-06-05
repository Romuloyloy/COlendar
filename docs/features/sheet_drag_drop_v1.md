# Sheet Drag-and-Drop v1

## Goal

Make sheet widget arrangement more natural by allowing widgets to be moved between slots with drag-and-drop.

This should improve the `/sheets` workspace editing experience without changing the core 4x2 grid model.

## Scope

Add controlled drag-and-drop for widgets inside `/sheets`.

The user should be able to:

- enter sheet edit/customize mode
- drag a widget from one slot to another
- drop it into an empty valid slot
- swap or move widgets, depending on the safest implementation
- persist the new layout after saving or immediately after drop
- keep widget configs intact

## Current Model

Sheets currently support:

- fixed 4x2 grid
- widget slots
- widget configs
- duplicate widget instances
- category-aware widgets
- sheet context
- widget spanning
- empty slot configuration
- immersive sheet chrome

Do not replace this model.

## Non-Goals

Do not implement:

- freeform x/y/w/h layout
- arbitrary resizing
- floating widgets
- sheet templates
- dashboard drag-and-drop
- mobile-first drag behavior
- new product modules
- AI
- auth
- external integrations

## Drag Behavior

Drag-and-drop should work only in edit/customize mode.

Normal sheet mode should remain focused on using widgets.

Requirements:

- draggable widgets have a clear drag handle or edit-mode affordance
- empty slots show valid drop targets
- invalid drop targets are visually rejected
- drag behavior should feel calm and not flashy
- user should not accidentally rearrange widgets during normal usage

## Spanning Rules

Existing widget spanning must remain valid.

Rules:

- a dragged widget keeps its current size/span
- drop is allowed only if the widget fits from the target slot
- drop is rejected if it would overflow the 4x2 grid
- drop is rejected if it would overlap another widget, unless swap behavior is intentionally supported
- clearing/moving a spanning widget frees its old occupied cells

If swap behavior with spanning widgets is risky, do not implement swapping. Use move-to-empty-slot only and document it.

## Persistence

After moving a widget:

- layout should persist after refresh
- widget config should remain intact
- title override should remain intact
- category config should remain intact
- sheet context behavior should remain intact

Use existing sheet slot save/update APIs if possible.

Avoid backend changes unless necessary.

## Backend

Prefer no new tables.

Backend changes are allowed only if needed for:

- validating moved slots
- persisting moved slots
- improving layout update safety

Do not add migrations unless absolutely necessary.

If backend layout validation already exists, reuse it.

## Frontend

Update `/sheets`.

Requirements:

- drag-and-drop works in edit/customize mode
- drag handles or affordances are visible only in edit mode
- valid/invalid drop states are clear
- layout updates smoothly after drop
- user feedback appears after successful save/move
- errors are readable
- keyboard/manual fallback exists if already simple, such as move controls

Do not let drag-and-drop make the UI visually noisy.

## Fallback / Accessibility

If full drag-and-drop is fragile, add simple move controls as fallback:

- move widget left
- move widget right
- move widget up
- move widget down

These controls can appear in edit mode or slot editor.

Drag-and-drop is the main goal, but reliable move controls are acceptable as a safety fallback.

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md
- docs/UX_GUIDELINES.md if useful

Mention:

- drag-and-drop works only in edit mode
- fixed 4x2 grid remains
- spanning rules
- invalid drops are rejected
- no freeform layout yet

## Acceptance Criteria

- `/sheets` still works
- existing important routes still work
- normal sheet mode does not accidentally rearrange widgets
- edit/customize mode allows moving widgets
- dragged widget keeps its config
- dragged widget keeps its span/size
- invalid drops are rejected
- layout persists after refresh
- duplicate widget instances still work
- category filters still work
- sheet context still works
- widget spanning still works
- empty slot configuration still works
- Quick Add still works
- Global Search still works
- Calendar week view still works
- frontend build passes
- backend tests pass according to Definition of Done
- README.md updated
- ForCO.txt updated