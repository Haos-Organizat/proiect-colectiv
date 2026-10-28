# Project Context & Agent Memory (AGENTS.md)

This file serves as the shared memory and context for AI coding agents (Antigravity, Claude Code, OpenAI Codex, GitHub Copilot, Cursor, etc.) and human developers working on **Proiect Colectiv**.

---

## 1. High-Level Overview
A full-stack application composed of:
- **Frontend**: React 19, TypeScript, Vite, ESLint, Prettier.
- **Backend**: Python 3.12, Flask, Supabase Client, managed with `uv`.
- **Database & Auth**: Supabase (PostgreSQL + GoTrue Auth) running locally via Docker.
- **Production Target**: Vercel (Vite frontend + Serverless Python backend) + Supabase Cloud.
- **Task Runner**: `just` (recipes defined in `Justfile`).

---

## 2. Developer Environment & Onboarding
- **Dev Container First**: The project uses `.devcontainer/devcontainer.json` containing Python 3.12, Node 20, `uv`, `just`, Docker-outside-of-docker, and Supabase CLI.
- **Auto-setup**: On container launch, `postCreateCommand` automatically executes `just setup`.
- **Windows Users**: Must install Docker Desktop on Windows with WSL 2 backend and enable WSL integration. Always clone the repository inside the WSL Linux filesystem (e.g., `~/proiect-colectiv`) to prevent slow 9p cross-OS file I/O.
- **Daily Dev Command**: `just dev` spins up local Supabase, the Flask API (`:5000`), and the Vite dev server (`:5173`) concurrently.

---

## 3. Frontend Architecture (`frontend/`)

### Directory Layout
```text
frontend/src/
├── api/             # API client calls & backend services (e.g. authApi.ts, usersApi.ts)
├── components/      # Reusable UI components (buttons, dialogs, forms)
├── hooks/           # Custom React hooks (useAuth, useFetch)
├── pages/           # Route views / screens (Dashboard, Login, Settings)
├── types/           # TypeScript types, schemas, and interfaces
├── assets/          # Static assets (images, icons, SVGs)
├── App.tsx          # Main application view & router setup
├── App.css / index.css
└── main.tsx         # React root mounting
```

### Key Frontend Rules & Conventions
1. **Zero-CORS API Calls**: Vite's dev server (`vite.config.ts`) proxies `/api` requests to `http://localhost:5000`. In production, Vercel routes `/api/*` to `backend/api/index.py`. Always make API requests using relative paths:
   ```ts
   // ALWAYS DO THIS:
   const res = await fetch('/api/health');
   // NEVER HARDCODE http://localhost:5000 or production domains in fetch calls!
   ```
2. **React 19 & Composition**:
   - Avoid boolean prop explosion (e.g., `<Card isHeader isSmall isBlue />`).
   - Use compound components, children composition, and explicit variants.
   - Do not use `forwardRef` in React 19 (`ref` is a standard prop).
3. **Strict TypeScript**:
   - Avoid `any`. Use strict interfaces, type unions, and type guards.
   - Keep types shared in `frontend/src/types/`.

---

## 4. Backend Architecture (`backend/`)

### Directory Layout
```text
backend/
├── api/
│   └── index.py     # Main Flask entrypoint & Vercel serverless handler
├── blueprints/      # Modular route handlers (e.g., auth.py, items.py, users.py)
├── services/        # Business logic, Supabase database client queries
├── models/          # Data structures, classes, or database models
├── schemas/         # Request/response validation (Marshmallow or Pydantic)
├── tests/           # Pytest integration & unit test suites
├── pyproject.toml   # Package configuration managed by uv
├── uv.lock          # Locked Python dependency tree
└── requirements.txt # Pinned dependencies auto-exported by uv for Vercel
```

### Key Backend Rules & Conventions
1. **Why `backend/api/` exists**: Vercel Serverless Python uses `@vercel/python` pointing to `backend/api/index.py`. Keep `index.py` clean—use it to initialize Flask, register blueprints, and handle global error handlers.
2. **Modular Blueprints**: Place API routes into `backend/blueprints/<feature>.py` with URL prefixes (e.g. `/api/v1/feature`).
3. **Dependency Management with `uv`**:
   - To add a dependency: `cd backend && uv add <package>`
   - To sync: `just setup` (or `cd backend && uv sync`)
   - To export for Vercel: `just export-reqs` (updates `backend/requirements.txt`)
4. **Code Quality**:
   - PEP 8 compliance checked with `ruff`. Line length: 100.
   - Run `just lint` and `just format`.

---

## 5. Database & Authentication Architecture (Supabase)

### Local Dev vs. Cloud
- **Local Dev**: Supabase runs locally in Docker.
  - Database: PostgreSQL on port `54322`.
  - Supabase Studio UI: `http://localhost:54323`.
  - Local API Gateway: `http://localhost:54321`.
  - Local Auth: Handled by local GoTrue. Emails (verification, password resets, magic links) are captured by **Inbucket** at `http://localhost:54324` (and inside Studio). No real emails are sent!
- **Supabase Cloud (Production)**: Hosted project at `supabase.com`.
  - Linked locally via `npx supabase link --project-ref <id>`.
  - Migrations deployed via `npx supabase db push`.

### Database Migrations Workflow
- All database schema changes must be written as migrations in `supabase/migrations/<timestamp>_<name>.sql`.
- To create a new migration: `npx supabase migration new <name>`
- To reset the local database from scratch (runs all migrations in timestamp order + loads `supabase/seed.sql`):
  ```bash
  just reset-db    # or: just db-reset
  ```

---

## 6. Installed Agent Skills
Skills are installed from GitHub and configured for Codex, Claude Code, Antigravity, and Copilot:
- `.agents/skills/flask-python`: Flask application factory, blueprints, RESTful conventions.
- `.agents/skills/typescript`: Strict type safety, clean TypeScript patterns.
- `.agents/skills/vercel-react-best-practices`: Performance optimization, re-render avoidance, bundle sizing.
- `.agents/skills/vercel-composition-patterns`: Scalable React 19 component patterns.

---

## 7. Command Cheat Sheet (`just`)

| Command | Action |
| :--- | :--- |
| `just dev` | Starts full local stack (Supabase Docker + Flask Backend + Vite Frontend) |
| `just setup` | Copies `.env.example` -> `.env`, installs npm packages, runs `uv sync`, exports requirements |
| `just start-db` | Starts local Supabase database only |
| `just reset-db` | Resets local database, runs all migrations from scratch, applies `seed.sql` |
| `just lint` | Runs Ruff on Python + ESLint & Prettier check on React/TS |
| `just format` | Automatically formats Python (Ruff) and React/TS (Prettier) |
| `just export-reqs`| Exports pinned `requirements.txt` from `uv` |
