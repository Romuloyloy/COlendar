# UX Guidelines

The product should stay fast, understandable, and useful for daily personal productivity.

## Product Feel

- Desktop-first.
- Local-first.
- Practical over fancy.
- Navigation should stay understandable.
- Quick Add should remain fast and simple.
- Global Search should remain keyword-based unless AI or semantic search is explicitly requested.

## UI Behavior

- Provide clear empty, loading, and error states.
- Forms should have readable validation errors.
- Dangerous actions require confirmation.
- Sheet actions like delete, reset, and apply layout must not be one-click destructive.
- Date navigation should use previous/today/next where practical.
- Avoid UTC date bugs; use browser local date where appropriate.

## Sheets And Widgets

- Compact widgets must not break the sheet grid.
- Prefer internal scroll or clipping inside sheet cells over broken layout.
- Keep sheet controls obvious and reversible where practical.

## Engineering UX Rules

- Avoid overcomponentization.
- Prefer existing shared UI primitives and feature patterns.
- Do not add broad design-system work unless it is required for the requested change.
