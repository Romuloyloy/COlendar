# Sheet Context Setup v1

## Goal

Make sheets category-aware so a sheet can represent a context such as Work, Health, School, Gym, or Personal.

This builds on Category Workspace v1.

This is not sheet templates.  
This is not automatic sheet generation.  
This is a lightweight context/category setting for each sheet.

## Scope

Add optional category context to sheets.

A sheet may have:

- no context category
- one selected category context

When a sheet has a context category, relevant widgets should be easier to configure around that category.

## Product Behavior

Example:

A sheet named “Health” can have category context “Health”.

Then:

- task widgets can default to Health
- notes widgets can default to Health
- events widgets can default to Health
- category overview widget can default to Health

Tracker remains category-free.

## Non-Goals

Do not implement:

- sheet templates
- automatic sheet generation
- multiple categories per sheet
- tracker categories
- AI setup
- drag-and-drop
- new layout system
- widget resizing changes
- major sheet redesign
- replacing dashboard with sheets

## Backend

Add optional `context_category_id` to sheets.

Requirements:

- nullable
- references existing category system
- sheet can have no category context
- archived category should not be assignable as sheet context
- if category later archives, sheet should not break
- migration required

Update sheet APIs so they can:

- return context_category_id
- update context_category_id when renaming/updating sheet
- clear context_category_id

Add tests for:

- creating/updating sheet with context category
- clearing sheet context category
- rejecting invalid category id
- rejecting archived category as new context
- existing sheets without context still work

## Frontend

Update `/sheets`.

Sheet management should allow:

- choosing sheet context category
- clearing sheet context category
- showing current sheet context near sheet name or in workspace dropdown

Keep it simple.

## Widget Slot Editor Behavior

When editing a widget slot on a sheet with context category:

- category-capable widgets should offer “Use sheet context” as an option
- user can still choose a different category
- user can still choose no category
- existing explicit widget configs should not be overwritten unexpectedly

Suggested config behavior:

- `categoryMode: "sheet_context" | "specific" | "none"`
- `category_id` used only when mode is specific

If that is too much, use a simpler equivalent, but document it.

## Widget Rendering

Category-capable widgets should resolve category like this:

1. If widget config says specific category, use it.
2. If widget config says sheet context, use the sheet context category.
3. If no category mode/filter, show all.

Apply to:

- one-time task widget
- recurring task widget
- notes widget
- events widget
- category overview widget

Do not apply to tracker widgets.

## UX

Make this understandable.

Examples of labels:

- Sheet context: Health
- Widget filter: Use sheet context
- Widget filter: Specific category
- Widget filter: No filter

The user should understand that the sheet can carry a context and widgets can inherit it.

## Documentation

Update:

- README.md
- ForCO.txt
- docs/SHEETS_VISION.md
- docs/UX_GUIDELINES.md if useful

Mention:

- sheets can now have optional category context
- widgets can inherit sheet context
- this is not sheet templates
- tracker remains category-free

## Acceptance Criteria

- Existing routes still work
- `/sheets` still works
- sheet can be assigned a context category
- sheet context can be cleared
- archived/invalid categories cannot be newly assigned as context
- category-capable widgets can use sheet context
- category-capable widgets can still use specific category
- category-capable widgets can still show all
- duplicate widget instances still work
- widget configs still persist
- tracker widgets remain unaffected
- Category Workspace still works
- Quick Add still works
- Global Search still works
- recurring tasks/events still work
- frontend build passes
- backend tests pass
- migration applies cleanly
- README.md updated
- ForCO.txt updated