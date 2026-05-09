# Definition Of Done

Use this checklist for implementation tasks. Documentation-only tasks may skip build/test commands when no product behavior changed.

## Standard Checklist

Every implementation should generally:

- Read `docs/MASTER_CONTEXT.md` first.
- Respect `docs/PROJECT_CONSTRAINTS.md`.
- Keep existing pages working.
- Keep the Docker Compose workflow working.
- Apply migrations if any exist.
- Pass backend tests.
- Pass the frontend build.
- Update `README.md` when behavior or setup changes.
- Update `ForCO.txt` with an owner-friendly summary.
- Avoid breaking existing APIs unless documented.
- Include practical tests for backend behavior.
- Include loading, error, and empty states when UI is affected.

## Windows/Docker Verification

Run from the repository root in PowerShell:

```powershell
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend pytest
docker compose exec frontend npm run build
```

## Important Routes

When UI behavior changes, check the relevant pages and usually these core routes:

- `/`
- `/notes`
- `/tasks`
- `/calendar`
- `/tracker`
- `/planning`
- `/search`
- `/sheets`

## Documentation Notes

- If behavior changes, update the relevant project docs.
- If a new feature has non-trivial scope, add or update a feature spec in `docs/features/`.
