# Genora

**Write once. Repurpose everywhere.**

Genora is a writing-first AI content tool: you write a raw thought exactly once, pick the platforms you want it to land on, and Genora turns it into a platform-native post for each — in your own voice, not a generic paraphrase.

Full build plan, architecture decisions, and phase roadmap live in [`backend-plan.md`](./backend-plan.md) — read that before touching backend code, its decisions are settled.

## How a generation actually runs

```
 you write a raw thought
        │
        ▼
 ┌─────────────────┐   hard reject          ┌──────────────────┐
 │   Slop Guard     │───────────────────────▶│ instant response  │
 │  (sync, no cost) │                        │  no job created   │
 └────────┬─────────┘                        └──────────────────┘
          │ pass / soft nudge
          ▼
 ┌─────────────────────────┐
 │   Trigger.dev v4 run     │   one parallel subtask per platform
 └────────┬────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────┐
 │   per platform: Writer → Critic → Reviser     │   + RAG context
 │   (BYOK key or free-tier Groq / Gemini)       │   + saved per-platform instructions
 └────────┬──────────────────────────────────────┘
          │
          ▼
   Postgres: versioned platform_outputs + usage_logs
   (one platform failing doesn't fail the run)
```

## Stack

| Layer          | Choice                                                             |
| -------------- | ------------------------------------------------------------------ |
| Frontend / BFF | Next.js 16 (App Router, TypeScript)                                 |
| Orchestration  | Trigger.dev v4 — multi-platform fan-out, retries, partial failures  |
| AI service     | Python 3.12 / FastAPI — no LangChain, agent loop hand-rolled on provider SDKs |
| Data           | Postgres (Neon, EU) + pgvector, via Drizzle ORM                     |
| Cache / quota  | Upstash Redis                                                       |
| Auth           | NextAuth v5 (Google OAuth, database sessions)                       |
| Embeddings     | Google `gemini-embedding-001`, truncated to 768-dim                  |
| BYOK providers | Anthropic, OpenAI, Gemini, Groq                                     |

## Repo layout

```
/web           Next.js 16 app — auth, CRUD, Slop Guard gate, job triggering
  /trigger     Trigger.dev v4 task definitions (fan-out + per-platform generation)
/ai-service    FastAPI service — Slop Guard, RAG, Writer/Critic/Reviser pipeline
backend-plan.md   authoritative build plan (read before backend work)
```

## Build status

Phases are built in order — see `backend-plan.md` for the full spec of each.

| Phase                              | Status      |
| ----------------------------------- | ----------- |
| 0 — Scaffolding                     | done        |
| 1 — Data layer (Drizzle, pgvector)  | done        |
| 2 — Auth + BYOK key management      | done        |
| 3 — AI service core (Slop Guard, RAG, Writer/Critic/Reviser) | done        |
| 4 — Trigger.dev orchestration        | done        |
| 5 — Next.js API routes (generate, CRUD, run status) | done        |
| 6 — Hardening (quota enforcement, CI, deploy) | in progress |

**Phase 6 so far**: request rate limiting on `/generate` (Upstash, per-user sliding window), timeout + graceful handling of `ai-service` outages, provider error reclassification (4xx vs 500), input bounds on generate schema, race-condition fix in result persistence, folderId validation. Still open: free-tier quota counter (Redis), structured logging, CI, deploy configs (Fly.io/Railway for `ai-service`).

## Local setup

### `/web`

```
cd web
cp .env.example .env.local
npm install
npm run dev                  # http://localhost:3000
```

| Command                | What it does       |
| ----------------------- | ------------------ |
| `npm run lint`           | ESLint              |
| `npm run format:check`   | Prettier check      |
| `npm test`               | Vitest              |
| `npm run db:generate`    | Generate a Drizzle migration from schema changes |
| `npm run db:migrate`     | Apply migrations to `DATABASE_URL` |
| `npm run db:seed`        | Seed a test user/folder/post |

**Env vars** (`web/.env.example`):

- `DATABASE_URL` — Neon Postgres connection string (EU region)
- `AI_SERVICE_URL`, `INTERNAL_SERVICE_SECRET` — must match `/ai-service`'s value
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` — Upstash Redis
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL` — NextAuth v5 (Google OAuth)
- `ENCRYPTION_KEY` — AES-256-GCM key for BYOK keys at rest, 32 bytes base64
- `PLATFORM_GROQ_API_KEY`, `PLATFORM_GEMINI_API_KEY` — platform-owned keys backing the two free-tier models (Groq, Gemini — both have real free API tiers; Anthropic/OpenAI don't, so those models are BYOK-only)
- `TRIGGER_PROJECT_REF`, `TRIGGER_SECRET_KEY` — from a real Trigger.dev project (`npx trigger.dev@latest init`)

### `/ai-service`

Requires [uv](https://docs.astral.sh/uv/).

```
cd ai-service
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload   # http://localhost:8000
```

| Command                    | What it does |
| --------------------------- | ------------ |
| `uv run ruff check .`        | lint          |
| `uv run black --check .`     | format check  |
| `uv run pytest`              | tests         |

**Env vars** (`ai-service/.env.example`):

- `DATABASE_URL` — same Postgres instance as `/web`
- `INTERNAL_SERVICE_SECRET` — must match `/web`'s value; gates every route
- `GEMINI_API_KEY` — platform-owned key for `gemini-embedding-001` (RAG)

### Health checks

- `GET http://localhost:3000/api/health` → `{"status":"ok"}`
- `GET http://localhost:8000/health` → `{"status":"ok"}`

## Accounts/secrets you'll need

- Neon Postgres (EU region)
- Google Cloud OAuth client (NextAuth sign-in)
- Google AI Studio API key (Gemini — used for both embeddings and the free-tier Gemini model)
- Groq API key (free-tier Groq model)
- Upstash Redis instance
- A Trigger.dev project (`npx trigger.dev@latest init`)

BYOK provider keys (Anthropic, OpenAI, Gemini, Groq) are supplied by end users at runtime — not configured here.
