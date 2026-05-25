# UX Guidelines

The product should stay fast, understandable, and useful for daily personal productivity.

## Product Feel

- Desktop-first.
- Local-first.
- Practical over fancy.
- Soft minimalist personal workspace.
- Calm pastel surfaces with warm off-white backgrounds.
- Cozy and readable without becoming decorative or low contrast.
- Navigation should stay understandable.
- Sheets are the primary workspace surface; Home and Planning are retired from primary navigation.
- Category views should feel like read-focused workspaces, not project-management dashboards.
- Review Center should feel like a calm read-focused synthesis, not analytics software.
- Quick Add should remain fast and simple.
- Global Search should remain keyword-based unless AI or semantic search is explicitly requested.

## Visual Direction

- Use warm off-white app backgrounds and soft white/pale cream surfaces.
- Use muted sage/teal as the primary action color.
- Use restrained lavender, sage, and dusty blue accents for secondary emphasis.
- Use soft rose/red for danger actions.
- Prefer rounded cards, low-contrast borders, and gentle shadows over harsh panels.
- Keep typography calm: clear page titles, concise subtitles, readable section titles, and muted metadata.
- Avoid neon colors, heavy gradients, dense admin-table styling, and overanimated UI.
- Palette options should change the accent layer and softly tint white surfaces. Robot Vanilla is the default; DuckBerry and BozzyWheat should stay calm, readable, and local-only unless a later spec asks for backend preferences.
- Sheets-only Stark Mode may darken the sheet workspace for each palette, but it is not full app-wide dark mode.

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
- Sheets should feel like a soft workspace canvas, not a rigid table.
- Sheet cells should feel like calm workspace tiles while preserving the fixed grid.
- The workspace dropdown should feel like a lightweight floating control surface, with app navigation, sheet controls, and dangerous actions visually grouped.
- Compact widget rows should prioritize fast scanning: clear titles, muted metadata, soft row hover states, and calm empty states.
- Sheet motion should stay subtle and functional: hover, opacity, and small position changes only.
- Empty sheet slots should feel gently actionable in normal viewing mode: primary click opens slot editing for that slot, without a nested Quick Add shortcut.
- Widget focus mode should feel temporary and calm: centered overlay, subdued sheet background, clear close affordance, and Escape-to-close behavior when available.
- Sheet widget item clicks should feel useful without becoming editing workflows: use lightweight previews and clear links to the owning full page.
- Sheet context should be visible near sheet identity, and category-aware widgets should clearly distinguish no filter, sheet-context inheritance, and a specific category.

## Engineering UX Rules

- Avoid overcomponentization.
- Prefer existing shared UI primitives and feature patterns.
- Do not add broad design-system work unless it is required for the requested change.
- Add shared primitives only when they reduce duplication or strengthen visual consistency.
