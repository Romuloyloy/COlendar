# Known Limitations

COlendar v0.1 is a Stable Local Workspace Alpha. It is useful locally, but it is not production-hardened.

## Current Limitations

- Local-first only; data is stored in the local PostgreSQL database used by Docker Compose.
- No authentication or user accounts.
- No cloud backup or sync.
- Export exists, but import/restore is future work.
- No external calendar sync.
- No AI features.
- No notifications or reminders.
- No mobile-first UI pass yet.
- No drag-and-drop sheet widgets, freeform resizing, sheet templates, or arbitrary layout coordinates.
- No production deployment hardening.
- No background workers, Redis, pgvector, or semantic search.

## Data Safety Notes

- Docker volumes matter for persistence.
- Deleting Docker volumes can delete local app data.
- Create exports before risky migrations, resets, or experiments.
- Export files may contain personal productivity data.
- Do not expose the local backend or export endpoints publicly without auth and deployment hardening.
