# Sheets Visual Refinement v1

## Goal

Refine the visual and interaction quality of the Sheets workspace so it feels like the true identity of the app.

The goal is to make sheets feel:

- calm
- cozy
- focused
- workspace-like
- polished
- soft
- intentional

without becoming flashy or overdesigned.

This is a visual/UX refinement phase, not a feature-expansion phase.

## Current State

The app already has:

- soft pastel UI foundation
- shared visual primitives
- 4x2 sheet workspace
- compact widgets
- top-center workspace dropdown
- widget instances/configs
- task category filtering
- calendar/planning/task systems

Sheets are now functional, but they still need stronger visual identity and interaction polish.

## Design Intent

Sheets should feel like:

- a personal workspace canvas
- a productivity desktop
- a calm operating environment
- a curated workspace page

NOT:

- a technical admin dashboard
- a spreadsheet
- a kanban board
- a finance analytics UI
- a widget overload page

The experience should encourage focus and comfort.

## Scope

Refine the Sheets workspace visually and behaviorally.

Focus areas:

1. Sheet canvas feel
2. Widget/card refinement
3. Workspace dropdown refinement
4. Compact widget hierarchy
5. Visual rhythm and spacing
6. Hover/focus states
7. Motion and transitions (light only)
8. Visual hierarchy
9. Sheet navigation feel

## Non-Goals

Do not implement:

- drag-and-drop
- widget resizing
- x/y/w/h layout
- sheet templates
- AI features
- auth
- notifications
- external integrations
- dark mode
- mobile redesign
- advanced animations
- backend changes unless necessary
- major architecture changes

## Sheet Canvas Feel

Improve the overall workspace atmosphere.

Potential improvements:

- softer page background treatment
- slightly separated sheet surface
- subtle gradients or layered surfaces if tasteful
- improved spacing around the 4x2 grid
- better balance between sheet and app shell
- calmer visual density

The sheet should feel like a dedicated workspace page.

Avoid over-decoration.

## Widget/Card Refinement

Refine widget cards so they feel premium but soft.

Goals:

- better spacing rhythm
- cleaner headers
- calmer typography hierarchy
- softer hover states
- clearer content grouping
- more breathing room
- contained overflow
- compact but readable

Widget cards should feel:

- tactile
- cozy
- calm
- lightweight

Avoid:

- harsh borders
- dense tables
- strong shadows
- glassmorphism excess
- flashy gradients
- noisy UI

## Compact Widget Hierarchy

Compact widgets should communicate quickly.

Improve:

- title hierarchy
- metadata styling
- count styling
- spacing between list items
- empty states
- task completion visuals
- category pill styling
- event time styling
- note preview styling

Widgets should scan well visually.

## Workspace Dropdown Refinement

Refine the top-center workspace dropdown.

Goals:

- floating workspace-control feeling
- softer visual hierarchy
- grouped controls
- clearer dangerous-action separation
- better spacing
- smoother open/close interaction
- lightweight workspace command feeling

Do not turn it into a complex command palette yet.

## Sheet Navigation Feel

Refine previous/next sheet controls.

Goals:

- clearer active sheet identity
- smoother workspace flow
- pleasant navigation rhythm
- intuitive ordering feel

Potential improvements:

- subtle transitions
- stronger active sheet label
- better positioning
- cleaner controls

Keep navigation simple.

## Motion and Interaction

Add very light motion only if tasteful.

Allowed:

- soft hover transitions
- fade transitions
- subtle scale/opacity shifts
- smooth dropdown appearance

Avoid:

- dramatic motion
- bouncy animations
- flashy transitions
- animation-heavy UI

The app should feel calm.

## Visual Consistency

Improve consistency between:

- dashboard widgets
- sheet widgets
- modals
- dropdowns
- forms
- buttons
- headers
- pills/badges

The app should feel like one coherent system.

## Focus and Readability

Preserve:

- readability
- usable spacing
- keyboard usability
- accessibility basics
- visible focus states

Do not sacrifice usability for aesthetics.

## Backend Changes

None expected.

Do not create migrations.
Do not redesign APIs.

## Tests

Backend tests should continue passing.

Frontend build must pass.

No new backend tests expected unless behavior accidentally changes.

## Documentation

Update `README.md` with:

- Sheets Visual Refinement v1 overview
- workspace visual direction
- interaction philosophy
- known limitations

Update `ForCO.txt` with:

- what visually changed
- how to inspect/test it
- what success looks like
- what remains postponed
- recommended next phase

Update `docs/UI_SYSTEM.md` if it exists.

Update `docs/UX_GUIDELINES.md` if needed.

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
- No backend behavior changes
- No migrations added
- Sheets feel visually calmer and more polished
- Widgets feel more cohesive and readable
- Compact widgets scan better visually
- Workspace dropdown feels more intentional
- Navigation feels smoother
- Motion remains subtle and calm
- Dashboard and Sheets remain visually coherent
- Frontend build passes
- Backend tests pass
- README.md updated
- ForCO.txt updated
- UI_SYSTEM.md / UX_GUIDELINES.md updated if needed