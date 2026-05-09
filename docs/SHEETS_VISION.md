# Sheets Vision

Sheets are the long-term main workspace idea, but they should evolve gradually.

## Current Direction

- A sheet is a full-page workspace.
- Sheet layout is a fixed 4x2 grid for now.
- Each cell contains a widget instance.
- Multiple instances of the same widget type must be allowed.
- Widget instances may have `config_json`.
- Task widgets can filter by category and use a title override.
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
- Keep compact widget rendering reliable inside the fixed grid.
- Preserve support for duplicate widget instances on the same sheet.
