set dotenv-load

default:
    @just --list

# Setup monorepo dependencies
setup:
    @if [ -f frontend/package.json ]; then cd frontend && npm install; else echo "Note: frontend/package.json not initialized yet."; fi
    cd backend && uv sync
    cd backend && uv export --format requirements-txt -o requirements.txt --no-hashes
    @if [ ! -d supabase ]; then supabase init; fi

# Start local database
start-db:
    supabase start

# Export backend dependencies for Vercel deployment
export-reqs:
    cd backend && uv export --format requirements-txt -o requirements.txt --no-hashes

# Start the full stack locally
dev: start-db
    @echo "Starting full local environment..."
    cd backend && uv run flask run --host=0.0.0.0 --port=5000 & \
    cd frontend && npm run dev -- --host 0.0.0.0

# Lint backend and frontend
lint:
    cd backend && uv run ruff check .
    @if [ -f frontend/package.json ]; then cd frontend && npm run lint && npm run format:check; fi

# Format backend and frontend
format:
    cd backend && uv run ruff format .
    @if [ -f frontend/package.json ]; then cd frontend && npm run format; fi
