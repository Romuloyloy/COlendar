# Sheets Vision

Sheets are the main workspace surface, and they should evolve gradually.

## Current Direction

- A sheet is a full-page workspace.
- Sheet layout is a fixed 4x2 grid for now.
- Each widget instance anchors to a slot and may occupy `1x1`, `2x1`, `1x2`, or `2x2` cells.
- Multiple instances of the same widget type must be allowed.
- A sheet may optionally carry one shared category context.
- Widget instances may have `config_json`.
- Widget instances store controlled `col_span` and `row_span` values; this is not freeform layout.
- Widgets can temporarily open in frontend-only focus mode for more reading and interaction space.
- Sheet widget items can offer lightweight previews and links back to their owning module.
- Task, note, event, and category overview widgets can filter by shared category where relevant, either directly or by inheriting the sheet context.
- One-time task widgets can show selected-date tasks or open/carry-forward tasks.
- Upcoming Events widgets can use a 7, 14, or 30 day horizon.
- Recent Notes widgets can filter by folder and include descendant folders.
- Task widgets, Notes widgets, and Category Overview can use a title override where relevant.
- Review Summary can be used as a simple sheet widget that links to the read-focused Review Center.
- Sheets have a local-only Stark Mode toggle that darkens only the sheet workspace using the active palette.
- Slot editing uses a frontend/code-defined widget library sourced from the existing dashboard widget registry.
- Compact rendering matters.
- The top-center workspace dropdown is part of the intended UX.

## Dashboard And Sheets

- Dashboard and sheets remain separate code paths.
- `/sheets` is the primary workspace destination and `/` redirects there.
- Dashboard remains as a reusable widget foundation and compatibility surface.
- Planning has been retired from primary navigation; `/planning` redirects to Review.

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

- Keep dashboard/widget code intact where Sheets, Review, Calendar, or tests still compose it.
- Do not add drag-and-drop, resizing, or coordinate-based layout unless a feature spec asks for it.
- Keep widget spanning constrained to the supported presets and reject overlaps server-side.
- Keep focus mode temporary; do not persist it or turn it into floating windows.
- Keep previews lightweight; full editing belongs in Tasks, Notes, Calendar, and other owning modules.
- Keep compact widget rendering reliable inside the fixed grid.
- Preserve support for duplicate widget instances on the same sheet.
- Keep category-aware widgets scoped to shared task/note/event categories; tracker widgets remain category-free.
- Keep sheet context optional and nullable; widgets that do not inherit it should continue to render normally.
- Do not add backend widget APIs or database-defined widget definitions until a future spec asks for them.
