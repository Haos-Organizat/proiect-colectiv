# Proiect Colectiv

Full-stack application built with:
- **Backend**: Python 3.12, Flask, Supabase Client (managed via `uv`)
- **Frontend**: React 19, TypeScript, Vite, Prettier, ESLint
- **Database & Auth**: Supabase (PostgreSQL via Docker)
- **Task Runner**: `just`
- **Deployment**: Vercel ready (Serverless Python + Vite frontend)
- **AI Agent Skills**: Pre-configured guidelines for Codex, Claude Code, Copilot, and Antigravity

---

## Getting Started

### Option A: VS Code Dev Containers (Recommended for Team)
The repository includes a ready-to-use Dev Container with all runtimes pre-installed (Python 3.12, Node.js 20, `uv`, `just`, Supabase CLI, Docker-in-Docker).

1. **Docker**: Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux) is installed and running.
   > **Windows users**: Install Docker Desktop on Windows (with WSL 2 engine and WSL integration enabled for your distro) and clone the repo inside WSL (`~/proiect-colectiv`) for maximum filesystem performance.
2. **VS Code**: Install [VS Code](https://code.visualstudio.com/) and the [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
3. Open this folder in VS Code.
4. When prompted, click **Reopen in Container** (or press `Ctrl+Shift+P` / `Cmd+Shift+P` -> `Dev Containers: Reopen in Container`).
5. The container will build and automatically run `just setup` via `postCreateCommand`.
6. In the integrated terminal, simply run:
   ```bash
   just dev
   ```

---

### Option B: Native Host (Neovim / CLI Users)
If running directly on your host machine without containers:

1. **Prerequisites**:
   - `docker` (running, for local Supabase database)
   - `just` (`sudo apt install just` or `cargo install just`)
   - `node` & `npm` (Node 20+)
   - `uv` (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
2. **Setup**:
   ```bash
   just setup
   ```
3. **Start Development**:
   ```bash
   just dev
   ```

---

### Option C: Windows without containers

1. **Install** (once), from PowerShell:
   ```bash
   winget install Docker.DockerDesktop
   winget install astral-sh.uv
   winget install Casey.Just
   ```
   Start Docker Desktop, accept its terms and wait for "Engine running". Node 20+ and Git for Windows must already be installed.
2. **Open Git Bash** (the `just` recipes use `sh`) in the project folder and run:
   ```bash
   just setup
   just start-db
   ```
   The first `start-db` downloads the Supabase images (2 to 3 GB) and applies every migration.
3. **Fill in `.env`** with the values from `npx supabase status`:
   - `SUPABASE_KEY` and `SUPABASE_SERVICE_ROLE_KEY`: the **Secret** (service_role) key. It bypasses row-level security, so it stays in `.env` only.
   - `SUPABASE_ANON_KEY`: the **Publishable** (anon) key.
   - `SECRET_KEY`: any long random string (signs the login cookie).
4. **Pick the frontend mode** in `frontend/.env.local`: `VITE_USE_MOCKS=false` to use the real backend, `true` for mock data (see `frontend/README.md`).
5. **Start everything**:
   ```bash
   just dev
   ```
   App at http://localhost:5173, Supabase Studio at http://localhost:54323.

---

## Project Structure & Architecture

```text
├── .agents/skills/      # AI agent skills for Codex, Copilot, Antigravity
├── .claude/skills/      # AI agent skills for Claude Code
├── .devcontainer/       # VS Code Dev Container setup (Dockerfile & settings)
├── backend/
│   ├── api/
│   │   └── index.py     # Flask entrypoint (handles /api/* locally & on Vercel)
│   ├── pyproject.toml   # Python package definitions managed by uv
│   ├── requirements.txt # Pinned export for Vercel deployments
│   └── uv.lock          # Reproducible lockfile
├── frontend/
│   ├── src/
│   │   ├── api/         # Frontend API calls & service integrations
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page views / screens
│   │   ├── types/       # TypeScript types & interfaces
│   │   ├── assets/      # Static assets (images, logos)
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # React DOM entrypoint
│   ├── package.json
│   └── vite.config.ts   # Configured with /api proxy to Flask backend
├── supabase/            # Supabase local config & database migrations
├── Justfile             # Project task runner recipes
└── vercel.json          # Production deployment routing & serverless build config
```

---

## API Communication (Zero CORS)

- **Local Development**: Vite proxies any frontend request starting with `/api` directly to `http://localhost:5000` (Flask).
- **Production (Vercel)**: `vercel.json` rewrites `/api/(.*)` directly to `backend/api/index.py` as a serverless function.
- **Frontend Code**: Always fetch from relative URLs without hardcoding host or port:
  ```ts
  const res = await fetch('/api/health');
  const data = await res.json();
  ```

---

## Database Management & Migrations

Local database migrations live in `supabase/migrations/` and test seed data lives in `supabase/seed.sql`.

- **Reset / Apply Migrations locally**: Run `just reset-db` (or `just db-reset`). This resets your local database, executes all SQL migration files in timestamp order, and populates `seed.sql`.
- **Create a new migration**:
  ```bash
  npx supabase migration new <migration_name>
  ```
- **Sync to Supabase Cloud**: Link your project (`npx supabase link --project-ref <id>`) and push with `npx supabase db push`.

---

## Ports & Local URLs

| Service | Local URL | Port |
| :--- | :--- | :--- |
| **Frontend (Vite + React)** | http://localhost:5173 | `5173` |
| **Backend API (Flask)** | http://localhost:5000 | `5000` |
| **Supabase Studio (DB UI)** | http://localhost:54323 | `54323` |
| **Supabase API Gateway** | http://localhost:54321 | `54321` |
| **PostgreSQL Database** | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | `54322` |

---

## Available Commands (`just`)

| Command | Description | When to use |
| :--- | :--- | :--- |
| `just dev` | Starts local Supabase, Flask backend, and Vite frontend concurrently. | Every day when developing. |
| `just setup` | Copies `.env.example` $\rightarrow$ `.env`, runs `npm install`, runs `uv sync`, exports `requirements.txt`, and initializes Supabase. | Runs automatically in Dev Container; run manually after `git pull` if dependencies change. |
| `just start-db` | Starts local Supabase Docker containers only. | When you only need the database running. |
| `just reset-db` | Resets local database, runs all migration files from scratch, and loads `seed.sql`. (Alias: `just db-reset`) | When database migrations change, or to reset state to a clean slate. |
| `just lint` | Runs Ruff on Python and ESLint + Prettier check on React/TypeScript. | Before committing code. |
| `just format` | Auto-formats code with Ruff (Python) and Prettier (TypeScript/React). | To fix formatting automatically. |
| `just export-reqs` | Exports pinned `requirements.txt` from `uv` for Vercel deployment. | After adding backend packages via `uv add`. |
