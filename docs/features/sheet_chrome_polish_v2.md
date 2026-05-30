# Sheet Chrome Polish v2

## Goal

Fix current immersive sheet chrome issues and make sheet navigation/menu behavior feel stable, intentional, and polished.

This is a focused UI/UX polish pass for `/sheets`.

## Scope

Implement:

1. Click-outside behavior for dropdown menus
2. Correct dropdown opening animation/positioning
3. Sheet-change fade title indicator
4. Move theme/palette controls into the top dropdown
5. Fix “Sheet config saved” title/message not disappearing

## 1. Click Outside Closes Dropdown

Current issue:

The top dropdown/menu remains open when clicking outside.

Desired behavior:

- Clicking outside the dropdown should close it.
- If the dropdown is pinned, clicking outside should NOT close it.
- Escape should close it if unpinned.
- Pinned behavior should remain predictable.

Acceptance:

- Unpinned menu closes on outside click.
- Pinned menu stays open on outside click.
- Existing menu actions still work.

## 2. Dropdown Animation / Position Fix

Current issue:

When opening, the dropdown first appears in an incorrect top/bottom-right location and then moves to the correct place.

Desired behavior:

- Dropdown should appear from the correct top-center position immediately.
- It should animate down smoothly from the top-center area.
- No visible jump from another location.
- Animation should be subtle and calm.

Implementation notes:

- Check initial render positioning.
- Avoid measuring/positioning logic that briefly defaults to wrong coordinates.
- Prefer stable CSS positioning if possible.
- Keep the soft workspace visual style.

## 3. Sheet Change Fade Indicator

Add a temporary fade indicator when changing sheets.

Behavior:

When user moves to another sheet:

- Show sheet name near the bottom center.
- Show sheet order like `3 / 6` near the bottom right.
- Both appear for a short time and fade away.
- This should happen when navigating by:
  - left/right edge arrows
  - keyboard navigation
  - dropdown sheet navigation
  - sheet selector if applicable

Example:

```text
bottom center: Health
bottom right: 3 / 6

Visual direction:

soft, subtle overlay
readable but not distracting
fits Robot Vanilla / DuckBerry / BozzyWheat palettes
works in Stark Mode too
4. Move Theme/Palette Controls to Top Dropdown

Current issue:

Palette/theme controls should be available from the top workspace dropdown.

Desired behavior:

Top dropdown should include:

palette selector:
Robot Vanilla
DuckBerry
BozzyWheat
Stark Mode toggle for sheets

Requirements:

Current palette behavior still works.
Palette persists after refresh.
Stark Mode persists after refresh.
Do not duplicate theme controls in confusing places.
If old theme controls exist elsewhere, either remove them or make the top dropdown the clear primary location.
5. “Sheet Config Saved” Message Should Disappear

Current issue:

After saving sheet config, the success title/message remains visible too long or never disappears.

Desired behavior:

Success feedback should appear briefly.
It should fade/disappear automatically.
It should not block interaction.
It should reset cleanly after another save.
Error messages may remain until dismissed or until next action, but success messages should be temporary.
Non-Goals

Do not implement:

calendar week view
drag-and-drop
new backend models
new migrations
sheet templates
new palette families
new product modules
auth
AI
external integrations
major redesign outside /sheets
Regression Safety

Do not break:

/sheets
palette switching
Stark Mode
top menu pin behavior
left/right sheet arrows
bottom menu
sheet ordering
sheet config persistence
widget configs
widget spanning
Quick Add
Global Search
Review Center
Category Workspace
recurring tasks/events
Documentation

Update:

README.md
ForCO.txt
docs/SHEETS_VISION.md if useful
docs/UI_SYSTEM.md if useful
docs/UX_GUIDELINES.md if useful

Mention:

dropdown closes on outside click unless pinned
dropdown opens from correct position
sheet-change fade indicator
theme controls are in top dropdown
sheet config success message auto-clears
Acceptance Criteria
/sheets still works
existing important routes still work
unpinned top dropdown closes on outside click
pinned top dropdown does not close on outside click
dropdown animation starts from the correct position without visual jumping
changing sheets shows bottom-center sheet name briefly
changing sheets shows bottom-right order indicator briefly, e.g. 3 / 6
fade indicator works with edge arrows, keyboard navigation, and menu navigation
palette controls exist in the top dropdown
Stark Mode toggle exists in the top dropdown
palette selection still persists
Stark Mode still persists
“Sheet config saved” success feedback disappears automatically
sheet ordering still works
widget configs still persist
Quick Add still works
Global Search still works
frontend build passes
backend tests pass according to Definition of Done
README.md updated
ForCO.txt updated