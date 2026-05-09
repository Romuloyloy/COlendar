# Feature Specs

Feature specs keep future Codex prompts short and concrete. Write them as practical implementation notes, not essays.

## Feature Spec Template

```markdown
# Feature Name

## Goal

## Current State

## Scope

## Non-Goals

## Backend Changes

## Frontend Changes

## Tests

## Documentation

## Acceptance Criteria
```

## Prompt Pattern

Future Codex prompts should usually say:

> Read `docs/MASTER_CONTEXT.md`, `docs/PROJECT_CONSTRAINTS.md`, `docs/DEFINITION_OF_DONE.md`, and this feature spec. Implement the feature spec.

## Writing Guidance

- Keep specs concise and explicit.
- List non-goals so Codex does not expand scope.
- Name expected API, database, frontend, test, and documentation changes.
- Add acceptance criteria that can be verified.
