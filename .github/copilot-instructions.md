# Copilot Instructions for Proiect Colectiv

See [AGENTS.md](../AGENTS.md) for full context, architecture decisions, and workflow guidelines.

## Quick Summary
- **Backend**: Python 3.12, Flask, Supabase Client (`uv` package manager). Thin entrypoint in `backend/api/index.py`, routes organized in `backend/blueprints/`.
- **Frontend**: React 19, TypeScript, Vite. Organized in `frontend/src/{api,components,hooks,pages,types,assets}`.
- **API Calls**: Always use relative paths (`fetch('/api/...')`).
- **Database**: Supabase PostgreSQL. Migrations in `supabase/migrations/`. Reset with `just reset-db`.
- **Task Runner**: `just` (`just dev`, `just setup`, `just lint`, `just format`).
