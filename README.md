# Genora

Writing-first AI content repurposing tool. See `backend-plan.md` for the full build plan and phase-by-phase decisions.

## Layout

- `/web` — Next.js 16 (App Router, TypeScript). BFF: auth, CRUD, sync Slop Guard gate, job triggering. Trigger.dev v4 tasks live in `/web/trigger` (added in Phase 4).
- `/ai-service` — Python 3.12 / FastAPI. BYOK adapter, Slop Guard, RAG, Writer→Critic→Reviser pipeline.

## Local setup

### `/web`

```
cd web
cp .env.example .env.local   # fill in DATABASE_URL, AI_SERVICE_URL, INTERNAL_SERVICE_SECRET
npm install
npm run dev                  # http://localhost:3000
```

- `npm run lint` — ESLint
- `npm run format` / `format:check` — Prettier
- `npm test` — Vitest

### `/ai-service`

Requires [uv](https://docs.astral.sh/uv/).

```
cd ai-service
cp .env.example .env         # fill in INTERNAL_SERVICE_SECRET (must match /web's value)
uv sync
uv run uvicorn app.main:app --reload   # http://localhost:8000
```

- `uv run ruff check .` — lint
- `uv run black --check .` — format check
- `uv run pytest` — tests

### Health checks

- `GET http://localhost:3000/api/health` → `{"status":"ok"}`
- `GET http://localhost:8000/health` → `{"status":"ok"}`

## Accounts/secrets needed to go past Phase 0

- Neon Postgres connection string (EU region)
- Google AI Studio API key (Gemini embeddings, Phase 3)
- BYOK provider keys are supplied by end users at runtime, not configured here
