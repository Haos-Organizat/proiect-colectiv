# Claude Code Instructions

Please refer to [AGENTS.md](./AGENTS.md) for full project architecture, conventions, and memory.

## Essential Commands
- Start dev environment: `just dev`
- Install / sync dependencies: `just setup`
- Reset local database / run migrations: `just reset-db`
- Lint code: `just lint`
- Format code: `just format`

## Golden Rules
1. **Frontend API Calls**: Always use relative paths (`fetch('/api/...')`). Vite proxies `/api` to port 5000 in dev; Vercel routes `/api/*` to `backend/api/index.py` in prod.
2. **Backend Structure**: Keep `backend/api/index.py` thin; place modular routes in `backend/blueprints/`.
3. **Database**: Never modify the database directly without creating a migration file in `supabase/migrations/`.
4. **Skills**: Follow the guidelines installed in `.claude/skills/` (`flask-python`, `typescript`, `vercel-composition-patterns`, `vercel-react-best-practices`).
