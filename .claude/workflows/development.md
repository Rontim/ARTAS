# ARTAS — Development Workflow

## Prerequisites

- Docker Desktop running
- Node.js + pnpm (frontend)
- Python 3.11+ (for local backend without Docker)

---

## Running the Full Stack (Docker)

```bash
# Start everything (backend + postgres + pgAdmin)
docker-compose -f docker-compose.dev.yml up

# Or with the Makefile shortcut
make dev
```

| Service | URL |
|---|---|
| Backend API | http://localhost:8001/api/v1/ |
| Frontend (Vite) | http://localhost:5173 |
| pgAdmin | http://localhost:5051 |
| API Docs | http://localhost:8001/api/docs/ |

---

## Common Backend Commands

```bash
# Open a shell in the backend container
docker exec -it artas_backend_dev bash
# or with Makefile:
make dev-shell

# Run migrations
docker exec -it artas_backend_dev python manage.py migrate

# Create a superuser
docker exec -it artas_backend_dev python manage.py createsuperuser

# Django system check (run after any model/serializer change)
docker exec -it artas_backend_dev python manage.py check

# Collect static files
docker exec -it artas_backend_dev python manage.py collectstatic --noinput
```

---

## Frontend

```bash
cd frontend
pnpm install          # install deps
pnpm dev              # start Vite dev server on :5173
pnpm build            # TypeScript compile + Vite build
pnpm lint             # ESLint
```

The frontend proxies `/api` → `http://localhost:8001` (configured in `vite.config.ts`).

---

## Environment Variables

Backend config lives in `backend/.env` (copy from `backend/.env.example`):

```
SECRET_KEY=...
DEBUG=True
DB_NAME=artas_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db           # Docker service name
DB_PORT=5432
INSTITUTION_NAME=My University
VERIFICATION_BASE_URL=http://localhost:8001/api/v1/verify
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Database Port Note

`docker-compose.dev.yml` maps Postgres to host port **5433** (not 5432). The settings default `DB_PORT=5433`. If connecting from a local tool like DBeaver or pgAdmin outside Docker, use port 5433.

---

## Running Tests

```bash
docker exec -it artas_backend_dev python manage.py test
```

Currently no frontend test suite configured.

---

## Making a Migration

```bash
# After modifying a model:
docker exec -it artas_backend_dev python manage.py makemigrations <app_name>
docker exec -it artas_backend_dev python manage.py migrate

# Data migrations (custom logic) must be hand-written.
# See workflows/migrations.md for safe migration patterns.
```
