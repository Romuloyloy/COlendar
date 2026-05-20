# Widget Library + Slot Editor UX v2

## Goal

Improve the sheet slot editing experience so adding/configuring widgets feels clearer, calmer, and more intentional.

This should make the difference clear:

- Normal sheet mode: empty slot opens Quick Add
- Edit/customize mode: empty slot opens widget configuration

This is mostly frontend/UI polish. Avoid backend changes unless absolutely necessary.

## Scope

Improve the widget selection/configuration experience for `/sheets`.

### Widget Library

Create a simple widget library UI inside the slot editor.

The widget library should show available widgets as clear selectable cards/list items.

Each widget option should show:

- display name
- short description
- category/type if useful
- whether it supports configuration
- maybe a small icon or visual marker if simple

Example widget groups:

- Tasks
- Notes
- Calendar
- Tracker
- Planning
- Overview / Utility

Do not create a plugin system.

Use the existing widget registry as the source of truth.

## Slot Editor UX

Improve the slot editor so the user understands:

- which slot is selected
- what widget is currently assigned
- what config is active
- what changes are unsaved
- how to save
- how to clear the slot

Requirements:

- show selected slot number/location
- show current widget name
- show widget library when choosing/changing widget
- show category filter only for widgets that support task categories
- show title override only where supported
- allow duplicate widget types on different slots
- preserve existing config behavior
- keep the editor calm and compact

## Empty Slot Behavior

Preserve current behavior:

- normal sheet mode: clicking empty slot opens Quick Add
- edit/customize mode: clicking empty slot selects slot for widget configuration

Make this visually obvious.

Possible visual cues:

- normal mode empty slot: plus icon + “Quick add”
- edit mode empty slot: plus icon + “Add widget”
- use different helper text

## Widget Metadata

If needed, extend frontend widget metadata with fields like:

- displayName
- description
- group
- supportsCategoryFilter
- supportsTitleOverride
- defaultTitle
- compactPreviewLabel

Keep metadata lightweight and code-defined.

Do not add database-backed widget definitions.

## Visual Direction

Follow the existing soft workspace UI system.

Widget library should feel:

- calm
- pastel
- readable
- compact
- not enterprise-like

Avoid:

- huge modal complexity
- noisy cards
- neon/high-saturation colors
- drag-and-drop
- resizing

## Backend Changes

Prefer no backend changes.

Do not create migrations.

Do not add widget APIs.

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md if useful
- docs/UI_SYSTEM.md if useful

Mention:

- normal empty slot click opens Quick Add
- edit mode empty slot opens widget selection
- widget library is frontend/code-defined
- duplicate widget instances remain supported

## Acceptance Criteria

- `/sheets` still works
- normal empty slot click still opens Quick Add
- edit mode empty slot opens/selects slot editor
- widget library exists in slot editor
- user can select a widget from the library
- user can configure supported widgets
- duplicate widget instances still work
- task category filters still work
- title overrides still work
- slot configs persist after refresh
- dashboard widgets still work
- dashboard customization still works
- palette selection still works
- existing routes still work
- frontend build passes
- backend tests pass according to Definition of Done
- README.md and ForCO.txt are updated