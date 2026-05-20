# UI System

UI Foundation v1 gives COlendar a calm, soft personal-workspace visual baseline without changing product behavior.

## Palette Tokens

The frontend defines the first visual tokens in `frontend/app/globals.css`:

- App background: warm off-white and soft cream.
- Surface: soft white / pale cream.
- Muted surface: pale sage.
- Primary accent: muted sage/teal.
- Secondary accent: muted lavender.
- Success: soft green.
- Warning: warm ochre.
- Danger: soft rose.
- Text: charcoal.
- Muted text: warm gray.
- Border: low-contrast warm gray.
- Shadow: soft low-elevation shadows.

Palette + Empty Slot Quick Add v1 names the default palette `Robot Vanilla` and adds two local-only accent palettes:

- `Robot Vanilla`: the original soft minimalist pastel workspace palette.
- `DuckBerry`: deep berry/lavender accents with soft lavender support colors.
- `BozzyWheat`: muted wheat/olive/golden accents with calm warm support colors.

Palette selection is stored in browser `localStorage` and applied through CSS variables. It should affect the accent layer and a subtle surface tint: primary buttons, focus rings, active/hover nav states, eyebrows, pills, sheet add affordances, selected slot accents, cards, panels, inputs, and related workspace highlights. Do not turn every surface into a strong palette color.

## Component Philosophy

Keep the shared component set small and practical. Use shared primitives when they make pages more consistent:

- `PageHeader`
- `SectionCard`
- `AppButton`
- `AppCard`
- `Badge`
- shared state components
- shared input class tokens

Feature modules should still own feature-specific layout and behavior.

## Cards And Widgets

Cards and widgets should use:

- rounded corners
- warm surfaces
- low-contrast borders
- soft shadows
- readable section titles
- muted metadata text
- contained overflow for compact widgets

Dashboard widgets and sheet widgets should feel related, while sheet widgets may stay more compact.

## Sheets Direction

`/sheets` is the long-term workspace identity. Its visual style should feel like a soft workspace canvas:

- floating top-center controls
- calm tile-like sheet cells
- compact readable widgets
- controlled `1x1`, `2x1`, `1x2`, and `2x2` widget spans that visually merge covered cells
- temporary widget focus overlays for deeper reading without changing the saved grid
- clear dangerous-action separation
- no drag-and-drop, resizing, or coordinate layout until a future spec asks for it

Sheets Visual Refinement v1 adds a more intentional workspace layer without changing product behavior:

- a warm layered canvas behind the fixed grid
- a lightly separated sheet surface around the 4x2 cells
- soft tile hover states and contained internal slot scrolling
- a clearer active-sheet header with sheet order context
- a floating workspace dropdown with grouped navigation, sheet controls, and advanced actions
- compact widget cards with consistent row, metadata, metric, empty, and link treatments
- light motion only for hover and dropdown entrance
- empty slots that show a soft add affordance and open Quick Add in normal viewing mode
- a calm slot editor with a grouped widget library for configuration mode

Widget Library + Slot Editor UX v2 keeps the library frontend/code-defined. Widget cards should be compact and readable, show a widget name, group/type, short preview, and configuration support, and keep duplicate widget instances possible by assigning widgets to individual slots.

Widget Spanning v1 keeps spans calm and preset-based. Larger widgets should occupy the correct fixed-grid area, hide covered empty cells, and preserve the same rounded tile language without introducing handles, drag states, or technical coordinate controls.

Workspace Focus Mode v1 should feel like a quiet enlargement of the current widget: softened backdrop, centered large panel, clear close affordance, and no floating-window language or permanent resize controls.

The visual goal is cozy focus, not a dense dashboard, spreadsheet, kanban board, or command palette.

## Current Limits

This is not a full design system, dark mode, brand system, or complete page redesign. It is a foundation for future UI passes.
