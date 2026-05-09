# UI Foundation v1

## Goal

Create the first real visual design foundation for the app.

The app should begin to feel like a calm, soft, minimalist personal productivity workspace rather than a default technical dashboard.

This is a UI/design-system foundation phase, not a product feature expansion.

## Design Direction

The visual identity should be:

- soft minimalist pastel workspace
- cozy but still productive
- rounded corners
- muted pastel palette
- calm and readable
- desktop-first
- compact but not harsh
- personal workspace feeling
- sheets/workspace as the core identity

Avoid:

- enterprise dashboard feeling
- neon/high-saturation aesthetics
- harsh borders
- dense admin panels
- overanimated UI
- heavy redesign that breaks functionality

## Current State

The app has many working modules:

- dashboard
- notes
- tasks
- calendar
- tracker
- planning
- search
- sheets
- quick add
- global search
- dashboard customization
- sheet widgets

The app now needs visual consistency before adding more complex features.

## Scope

Implement a UI foundation pass across the app.

This should include:

1. Design tokens / theme direction
2. Shared UI primitives
3. Consistent cards/widgets
4. Consistent buttons/forms
5. Consistent empty/loading/error states
6. Soft pastel workspace styling
7. Better visual treatment for sheets
8. Light application across major pages

## Non-Goals

Do not implement:

- new product features
- auth
- AI
- drag-and-drop
- widget resizing
- sheet layout changes
- dark mode
- mobile-first redesign
- external integrations
- notifications/reminders
- advanced animations
- full branding/logo system
- major frontend architecture rewrite

## Visual System

Create or standardize visual tokens for:

- background
- surface
- muted surface
- primary accent
- secondary accent
- success
- warning
- danger
- text primary
- text muted
- border
- shadow

The palette should be muted and pastel.

Suggested vibe:

- warm off-white background
- soft white/pale cream surfaces
- muted lavender/sage/dusty blue accents
- soft rose for destructive actions
- charcoal text
- warm gray muted text
- low-contrast borders

Use Tailwind-friendly classes or CSS variables depending on existing project style.

Prefer a small clear token set over a huge design system.

## Typography

Standardize typography patterns:

- page title
- page subtitle
- section title
- widget title
- body text
- metadata text
- button text
- empty state text

Typography should be readable and calm.

Avoid tiny dense enterprise-dashboard text.

## Shared Components

Create or improve shared UI components where appropriate.

Suggested components:

- AppButton
- AppCard
- WidgetCard
- SheetCell
- PageHeader
- SectionHeader
- EmptyState
- ErrorState
- LoadingState
- Badge/Pill
- FormField
- TextInput
- TextArea
- Select
- Modal/ConfirmModal if already present

Do not overcomponentize.

Only extract components that reduce duplication and improve consistency.

## Widget/Card Style

Dashboard widgets and sheet widgets should share a coherent card language.

Widget cards should have:

- rounded corners
- soft border or shadow
- comfortable padding
- clear header
- compact body
- calm hover/focus states
- contained overflow

Sheet widgets should use compact versions where needed.

## Sheets Visual Direction

The `/sheets` page is the core long-term identity.

Improve sheets visually so they feel like a personal workspace canvas.

Sheet requirements:

- full workspace feeling
- soft background
- 4x2 grid remains stable
- cells look like calm workspace tiles
- compact widgets stay readable
- top-center workspace dropdown feels like a floating soft control
- dangerous actions remain visually separated
- no harsh grid/table feeling

Do not change sheet behavior or layout model in this phase.

## Navigation Feel

The normal app shell should feel calm and consistent.

Navigation should:

- be readable
- make current section clear
- avoid looking like an enterprise admin sidebar if possible
- support the workspace feeling

Do not fully redesign navigation architecture unless the change is small and safe.

## Forms and Actions

Standardize form feel:

- clear labels
- readable inputs
- calm borders
- obvious focus states
- simple validation messages

Button hierarchy:

- primary
- secondary
- ghost/subtle
- danger

Danger actions should use soft rose/red styling and remain confirm-protected where applicable.

## States

Standardize:

- loading
- empty
- error
- success

Empty states should feel friendly and concise.

Error states should be readable but not visually aggressive.

## Application Across Pages

Apply the UI foundation to major pages:

- dashboard
- notes
- tasks
- calendar
- tracker
- planning
- search
- sheets

This does not mean redesign every detail.

Prioritize:

1. app shell/navigation
2. dashboard/widgets
3. sheets
4. forms/buttons
5. common states
6. major page headers

Keep behavior unchanged.

## Accessibility / Usability

Keep:

- readable contrast
- visible focus states
- usable button sizes
- forms understandable
- keyboard behavior not broken

Do not sacrifice readability for pastel aesthetics.

## Backend Changes

None expected.

Do not change backend behavior.

Do not create migrations.

## Tests

Backend tests should continue passing.

Frontend build must pass.

No new backend tests are expected unless code behavior changes unexpectedly.

## Documentation

Update `README.md` with:

- UI Foundation v1 overview
- visual direction
- shared UI component approach
- current limitations
- how to run/test

Update `ForCO.txt` with:

- what changed
- how to visually inspect it
- what success looks like
- what remains intentionally postponed
- recommended next phase

Update `docs/UX_GUIDELINES.md` to include the new visual direction.

If useful, add a short `docs/UI_SYSTEM.md` describing:

- palette tokens
- component philosophy
- card/widget style
- sheet visual direction

Keep it concise.

## Constraints

Follow:

- `docs/MASTER_CONTEXT.md`
- `docs/PROJECT_CONSTRAINTS.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/SHEETS_VISION.md`
- `docs/UX_GUIDELINES.md`

Do not violate project constraints.

## Acceptance Criteria

- Existing routes still work:
  - `/`
  - `/notes`
  - `/tasks`
  - `/calendar`
  - `/tracker`
  - `/planning`
  - `/search`
  - `/sheets`
- No product behavior is intentionally changed
- No backend migrations are added
- App has a softer, more coherent visual identity
- Shared UI components/tokens exist where useful
- Dashboard widgets look more consistent
- Sheet widgets/cells look more workspace-like
- Forms/buttons look more consistent
- Empty/loading/error states are more consistent
- Navigation feels calmer and clearer
- Backend tests pass
- Frontend build passes
- README.md is updated
- ForCO.txt is updated
- UX_GUIDELINES.md is updated
- UI_SYSTEM.md is added if useful