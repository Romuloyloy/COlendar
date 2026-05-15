# Palette + Empty Slot Quick Add v1

## Goal

Add two small UX improvements after the UI/sheets visual refinement:

1. Empty sheet slots should feel actionable and open Quick Add.
2. The current visual palette should be named `Robot Vanilla`, and two additional palette options should be added:
   - `DuckBerry`
   - `BozzyWheat`

This is a frontend/UI feature. Avoid backend changes unless absolutely necessary.

## Scope

### 1. Empty Sheet Slot Quick Add

In normal `/sheets` viewing mode:

- Empty widget slots should show a clear plus icon or soft “Add something” affordance.
- Clicking an empty slot should open the existing Quick Add menu/modal.
- The interaction should feel intentional and lightweight.
- The empty slot should still visually fit the soft workspace style.

Important behavior:

- If the user is in slot-edit/customization mode, empty slots should still support slot editing/configuration.
- Do not remove the ability to assign widgets to empty slots.
- Normal mode click = Quick Add.
- Edit/customize mode click = slot/widget configuration.

### 2. Palette System v1

Rename the current/default palette to:

```text
Robot Vanilla

Add two more palettes:

DuckBerry
BozzyWheat

Palette direction:

Robot Vanilla

Current soft minimalist pastel workspace palette.

DuckBerry

Accent direction:

dark:   #2e105c
normal: #5c104d
light:  choose a soft pastel lavender/berry variant

Should feel deep berry/lavender but still calm. Avoid neon.

BozzyWheat

Accent direction:

dark:   #423e02
normal: #bab01c
light:  #d9d3b4

Should feel muted wheat/olive/golden, cozy and calm. Avoid harsh yellow.

The exact derived colors can be adjusted to fit readability and the current UI system.

Palette UX

Add a simple palette selector.

Acceptable locations:

app shell
settings-style area
workspace dropdown
small appearance section

Keep it simple.

Requirements:

User can select Robot Vanilla, DuckBerry, or BozzyWheat.
Selection persists after refresh using localStorage or existing frontend preference pattern.
No backend storage needed.
Palette should affect global accent colors and key UI highlights.
Do not rebuild the entire UI theme system.
Do not add dark mode.
Implementation Notes

Prefer CSS variables or Tailwind-friendly theme tokens if consistent with the current UI foundation.

Palette should affect things like:

primary buttons
active nav state
focus rings
selected sheet/widget accents
badges/pills where appropriate
workspace dropdown accents

Do not make every surface strongly colored. Keep the soft minimalist base.

Non-Goals

Do not implement:

backend palette preferences
user accounts
dark mode
custom color picker
per-sheet palettes
per-widget palettes
major redesign
new product modules
Documentation

Update:

README.md
ForCO.txt
docs/UI_SYSTEM.md if it exists
docs/UX_GUIDELINES.md if needed

Mention:

Robot Vanilla is the default/current palette
DuckBerry and BozzyWheat are available
palette preference is stored locally
empty sheet slots open Quick Add in normal mode
Acceptance Criteria
/sheets still works.
Empty sheet slots show a plus/add affordance.
Clicking an empty slot in normal sheet mode opens Quick Add.
Slot editing still works in customization/edit mode.
Robot Vanilla is the default/current palette name.
DuckBerry palette exists.
BozzyWheat palette exists.
User can switch palettes.
Selected palette persists after refresh.
Existing routes still work.
Quick Add still works normally.
Sheets visual refinement remains intact.
Frontend build passes.
Backend tests pass if run by Definition of Done.
README.md and ForCO.txt are updated.