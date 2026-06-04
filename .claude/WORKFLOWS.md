# ARTAS — Claude Workflows Index

This directory contains project-specific documentation for AI agents and developers working on ARTAS.

## Files

| File | What it covers |
|---|---|
| [workflows/architecture.md](workflows/architecture.md) | Domain model, app boundaries, key relationships, data flow |
| [workflows/development.md](workflows/development.md) | Running the stack, common commands, environment setup |
| [workflows/migrations.md](workflows/migrations.md) | Migration history, schema evolution, safety rules |
| [workflows/debugging.md](workflows/debugging.md) | Endpoint-to-file map, known patterns, how to diagnose errors |

## Project in One Paragraph

ARTAS is a Django 5 + React 18 + TypeScript full-stack app. The backend exposes a DRF REST API at `/api/v1/`. The frontend is a Vite SPA that consumes it. Authentication is JWT via simplejwt. The database is PostgreSQL 15. The stack runs in Docker (see `docker-compose.dev.yml`).

The domain covers: academic structure (schools → departments → programmes → units), student enrollment and semester/module registrations, grading and transcript generation.
