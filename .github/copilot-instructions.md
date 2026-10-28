# Copilot Instructions for Proiect Colectiv

## Project Architecture
- **Backend**: Python 3.12, Flask, Supabase Python Client. Managed with `uv`.
- **Frontend**: Vite SPA. Formatting with Prettier.
- **Database / Auth**: Supabase (PostgreSQL).
- **Task Runner**: `just`.

## Code Style & Standards

### Python (Backend)
- Adhere to PEP 8 and Ruff guidelines (line length 100).
- Strict type checking with Pyright. Always include explicit type annotations on functions, methods, and parameters.
- Use Flask application factory pattern and blueprints for routing.

### Frontend
- Keep components modular and reusable.
- Follow Prettier formatting rules (2-space indent, single quotes, trailing commas).
