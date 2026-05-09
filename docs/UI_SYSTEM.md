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
- clear dangerous-action separation
- no drag-and-drop, resizing, or coordinate layout until a future spec asks for it

## Current Limits

This is not a full design system, dark mode, brand system, or complete page redesign. It is a foundation for future UI passes.
