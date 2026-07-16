<div align="center">

<img src="web/public/logo-with-text.webp" alt="Genora" width="360" />

### Write once. Repurpose everywhere.

Genora is a writing-first AI content tool: write a raw thought exactly once, pick the platforms
you want it to land on, and Genora turns it into a platform-native post for each — in your own
voice, not a generic paraphrase.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-service-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Trigger.dev](https://img.shields.io/badge/Trigger.dev-v4-2C2C2C?logo=triggerdotdev&logoColor=white)](https://trigger.dev)
[![Postgres](https://img.shields.io/badge/Postgres-Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech)

</div>

<br />

<details open>
<summary><strong>📸 Screenshots</strong> — placeholders below, swap the URLs for real screenshots whenever you have them</summary>
<br />

<table>
<tr>
<td width="50%">

**Dashboard**
<img src="https://github.com/user-attachments/assets/f22241d3-0a8a-4fcc-b387-177fd67a382e" alt="Dashboard screenshot placeholder" width="100%" />

</td>
<td width="50%">

**Compose — write once**
<img src="https://github.com/user-attachments/assets/ca23c6c5-e0a3-45fb-bd9a-333ec8a8bd42" alt="Compose screenshot placeholder" width="100%" />

</td>
</tr>
<tr>
<td width="50%">

**Output — one post per platform**
<img src="https://placehold.co/900x560/0E0D0B/E8853A?text=Output+View&font=raleway" alt="Output view screenshot placeholder" width="100%" />

</td>
<td width="50%">

**Settings — BYOK & Slop Guard**
<img src="https://github.com/user-attachments/assets/1c1764ea-bd09-4af6-a19b-29315c048559" alt="Settings screenshot placeholder" width="100%" />

</td>
</tr>
</table>

</details>

<br />

Full build plan, architecture decisions, and phase roadmap live in
[`backend-plan.md`](./backend-plan.md) — read that before touching backend code, its decisions
are settled.

## How a generation actually runs

```
 you write a raw thought
        │
        ▼
 ┌──────────────────┐   hard reject          ┌──────────────────┐
 │   Slop Guard     │───────────────────────▶│ instant response │
 │  (sync, no cost) │                        │  no job created  │
 └────────┬─────────┘                        └──────────────────┘
          │ pass / soft nudge
          ▼
 ┌─────────────────────────┐
 │   Trigger.dev v4 run    │   one parallel subtask per platform
 └────────┬────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────┐
 │   per platform: Writer → Critic → Reviser   │   + RAG context
 │   (BYOK key or free-tier Groq / Gemini)     │   + saved per-platform instructions
 └────────┬────────────────────────────────────┘
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
| Embeddings     | Google `gemini-embedding-001`, truncated to 768-dim                 |
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

| Phase                                                         | Status      |
| -------------------------------------------------------------- | ----------- |
| 0 — Scaffolding                                                 | ✅ done      |
| 1 — Data layer (Drizzle, pgvector)                              | ✅ done      |
| 2 — Auth + BYOK key management                                  | ✅ done      |
| 3 — AI service core (Slop Guard, RAG, Writer/Critic/Reviser)    | ✅ done      |
| 4 — Trigger.dev orchestration                                   | ✅ done      |
| 5 — Next.js API routes (generate, CRUD, run status)             | ✅ done      |
| 6 — Hardening (quota enforcement, CI, deploy)                   | ✅ done      |

**Phase 6**: request rate limiting on `/generate` and `/regenerate` (Upstash, per-user sliding
window), free-tier quota counter (Upstash, sliding window, consumed once per platform generation
rather than per retry), timeout + graceful handling of `ai-service` outages, provider error
reclassification (4xx vs 500) across all four adapters, redacted provider auth-error messages,
input bounds on the generate schema, race-condition fix in result persistence, folderId
validation, structured JSON logging with an `X-Correlation-Id` traced across web → Trigger.dev →
ai-service, a shared error-response helper (web) and expanded exception handlers (ai-service), a
GitHub Actions CI workflow for both apps, and deploy configs (Render for `ai-service` — no card
required on the free tier, switched from the original Fly.io/Railway plan — Vercel region pin for
`web`).

## Local setup

<details>
<summary><strong>▸ /web</strong></summary>

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
- `PLATFORM_GROQ_API_KEY`, `PLATFORM_GEMINI_API_KEY` — platform-owned keys backing the two
  free-tier models (Groq, Gemini — both have real free API tiers; Anthropic/OpenAI don't, so those
  models are BYOK-only)
- `TRIGGER_PROJECT_REF`, `TRIGGER_SECRET_KEY` — from a real Trigger.dev project
  (`npx trigger.dev@latest init`)

</details>

<details>
<summary><strong>▸ /ai-service</strong></summary>

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

</details>

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

BYOK provider keys (Anthropic, OpenAI, Gemini, Groq) are supplied by end users at runtime — not
configured here.

<div align="center">

<br />

<sub>Built with Next.js, Trigger.dev, and FastAPI — see <a href="./backend-plan.md">backend-plan.md</a> for the full architecture.</sub>

</div>
