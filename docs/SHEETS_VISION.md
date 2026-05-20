# Sheets Vision

Sheets are the long-term main workspace idea, but they should evolve gradually.

## Current Direction

- A sheet is a full-page workspace.
- Sheet layout is a fixed 4x2 grid for now.
- Each widget instance anchors to a slot and may occupy `1x1`, `2x1`, `1x2`, or `2x2` cells.
- Multiple instances of the same widget type must be allowed.
- Widget instances may have `config_json`.
- Widget instances store controlled `col_span` and `row_span` values; this is not freeform layout.
- Widgets can temporarily open in frontend-only focus mode for more reading and interaction space.
- Task widgets can filter by category and use a title override.
- Slot editing uses a frontend/code-defined widget library sourced from the existing dashboard widget registry.
- Compact rendering matters.
- The top-center workspace dropdown is part of the intended UX.

## Dashboard And Sheets

- Dashboard and sheets are currently separate.
- Dashboard is stable/classic.
- Sheets are the experimental workspace direction.
- Sheets may eventually become the main homepage, but not yet.

## Future Possibilities

Possible later features include:

- Drag-and-drop.
- Resizing.
- `x/y/w/h` layout.
- Stronger command/navigation layer.
- Better widget configs.
- Sheet templates.

These should be implemented gradually, not all at once.

## Implementation Guardrails

- Do not replace the dashboard with sheets unless explicitly requested.
- Do not add drag-and-drop, resizing, or coordinate-based layout unless a feature spec asks for it.
- Keep widget spanning constrained to the supported presets and reject overlaps server-side.
- Keep focus mode temporary; do not persist it or turn it into floating windows.
- Keep compact widget rendering reliable inside the fixed grid.
- Preserve support for duplicate widget instances on the same sheet.
- Do not add backend widget APIs or database-defined widget definitions until a future spec asks for them.
