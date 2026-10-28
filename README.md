# Proiect Colectiv

Full-stack application built with:
- **Backend**: Python 3.12, Flask, Supabase Client (managed via `uv`)
- **Frontend**: React 19, TypeScript, Vite, Prettier, ESLint
- **Database & Auth**: Supabase (PostgreSQL via Docker)
- **Task Runner**: `just`
- **Deployment**: Vercel ready

---

## Getting Started

### Option A: VS Code Users (Recommended for Team)
The repository is pre-configured with a Visual Studio Code Dev Container containing all necessary runtimes (Python 3.12, Node.js 20, uv, just, Supabase CLI).

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and ensure Docker is running.
2. Install [Visual Studio Code](https://code.visualstudio.com/) and the [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
3. Open this folder in VS Code.
4. When prompted, click **Reopen in Container** (or press `Ctrl+Shift+P` / `Cmd+Shift+P` -> `Dev Containers: Reopen in Container`).
5. In the VS Code terminal, run:
   ```bash
   just setup
   just dev
   ```

---

### Option B: Neovim / CLI Users (Native Host)
If you prefer running natively on your host machine without containers:

1. **Prerequisites**: Ensure you have installed:
   - `docker` (for local Supabase database)
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

## Ports & URLs

| Service | Local URL | Port |
| :--- | :--- | :--- |
| **Frontend (Vite + React)** | http://localhost:5173 | `5173` |
| **Backend API (Flask)** | http://localhost:5000 | `5000` |
| **Supabase Studio (DB UI)** | http://localhost:54323 | `54323` |
| **Supabase API Gateway** | http://localhost:54321 | `54321` |
| **PostgreSQL Database** | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | `54322` |

---

## Available Commands (`just`)

- `just setup` — Installs frontend and backend dependencies, syncs lockfiles, and initializes Supabase.
- `just dev` — Starts local Supabase, Flask backend, and Vite frontend concurrently.
- `just start-db` — Starts local Supabase containers.
- `just lint` — Runs Ruff on Python files and ESLint + Prettier check on React files.
- `just format` — Automatically formats Python and TypeScript/React code.
- `just export-reqs` — Exports pinned `requirements.txt` from `uv` for Vercel deployment.
