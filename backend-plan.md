# Backend build prompt for Claude Code

## Context
Building the backend for a writing-first AI content repurposing tool: users write a raw thought once, select target platforms (LinkedIn, X, Reddit, Medium, Substack), and the system generates a platform-specific post for each. Includes a free tier (product-paid model) and BYOK (user's own API keys), a pre-generation substance check ("Slop Guard") that blocks low-effort input before any generation runs, and a hand-rolled multi-agent Writer → Critic → Reviser pipeline per platform.

This prompt is for the **backend only**. Frontend/UI is being designed separately.

## Tech stack (already decided — don't re-litigate these)
- **Next.js 16** (App Router, TypeScript) — BFF layer: auth, CRUD, the synchronous substance-check gate, job triggering
- **Trigger.dev v4** — durable orchestration for the multi-platform generation fan-out
- **Python 3.12+ / FastAPI** — AI service: BYOK adapter, Slop Guard, RAG, the Writer/Critic/Reviser pipeline. No LangChain — implement the agent loop directly against provider SDKs.
- **Postgres (Neon or Supabase) + pgvector** — data and embeddings, via **Drizzle ORM**
- **Upstash Redis** — free-tier rate limiting, caching
- **NextAuth v5** — auth
- **AES-256-GCM** — BYOK key encryption at rest
- **Deploy**: Vercel (Next.js), Fly.io or Railway (Python service, EU region)
- **Monorepo layout**: `/web` (Next.js), `/ai-service` (Python FastAPI), Trigger.dev tasks live in `/web/trigger` (same repo as the app that triggers them)

## Core flow to implement (already decided — don't re-litigate)
1. User hits generate → Next.js calls the Python Slop Guard endpoint **directly and synchronously** — not through Trigger.dev.
2. Reject → instant HTTP response, no job created.
3. Pass → Next.js triggers a Trigger.dev v4 run.
4. Trigger.dev fans out one parallel subtask per selected platform, each calling the Python service's generation endpoint.
5. Each subtask runs Writer → Critic → Reviser for that platform, using RAG context + that platform's saved instructions.
6. Trigger.dev collects all subtask results (partial failures allowed — one platform failing doesn't fail the run), logs cost/tokens per span, writes results to Postgres, updates free-tier quota in Redis.
7. Frontend polls/subscribes to the run for completion.

## Working instructions
- Build the phases below **in order**. Don't start a phase until the previous one works, and give me a short summary at the end of each phase: what was built, decisions you made, anything you need from me (accounts, API keys, secrets) before continuing.
- Ask before adding any dependency not listed in the tech stack above.
- Write tests alongside the code, not after — pytest for `/ai-service`, Vitest for `/web`.
- Keep all secrets out of source control — `.env.local` / `.env`, with a committed `.env.example`.
- Prefer explicit, typed code — Pydantic models in Python, TypeScript types/Zod schemas in Next.js — over dynamic or untyped shortcuts.
- If something in this spec conflicts with what actually makes sense once you're in the code, stop and tell me why rather than silently deviating.

## Phases

### Phase 0 — Scaffolding
- Monorepo structure as above, with linting/formatting (ESLint + Prettier for `/web`, ruff + black for `/ai-service`)
- Env config for both apps, README with local setup steps
- Dockerfile for `/ai-service` (local dev + deploy)
- **Deliverable**: both apps run locally, each with a working health-check endpoint

### Phase 1 — Data layer
- Postgres schema (Drizzle): `users`, `folders`, `posts`, `platform_outputs` (versioned, one row per generation attempt per platform), `api_keys` (encrypted), `platform_instructions` (per-platform settings, per-user overrides), `usage_logs` (tokens/cost per generation)
- Enable the pgvector extension; an `embeddings` table for RAG/voice calibration
- Migrations + a seed script (test user, folder, post)
- Redis connection helper + a basic rate-limit function (Upstash)
- **Deliverable**: schema applied to a real Postgres instance, seed script runs cleanly

### Phase 2 — Auth + BYOK key management
- NextAuth v5 setup — **confirm with me** whether to use email magic link or OAuth providers before implementing
- Encrypted key storage: add / list / delete provider keys (Anthropic, OpenAI, Gemini, Groq), AES-256-GCM at rest
- Resolution logic: given a user, determine which model + key to use (their BYOK key if present, otherwise the free-tier model) and their remaining quota
- **Deliverable**: API routes to add/list/delete a key; a function that resolves "model + key" for a given user and generation request

### Phase 3 — Python AI service core
- FastAPI skeleton, typed request/response models throughout
- Slop Guard endpoint: raw text in, returns pass / soft-nudge / hard-reject with a short reason
- RAG retrieval endpoint: embed a query, retrieve relevant past posts from pgvector
- Writer → Critic → Reviser endpoint: raw text + platform + per-platform instructions + RAG context in, returns final draft + revision count + token usage
- **Deliverable**: every endpoint independently callable and testable (curl/Postman) without Trigger.dev in the loop

### Phase 4 — Trigger.dev v4 orchestration
- Task definition for the multi-platform fan-out: one subtask per selected platform, each calling Phase 3's generation endpoint
- Retry policy per subtask; partial-failure handling so one platform's failure doesn't fail the whole run
- Cost/token tracking per subtask using Trigger.dev v4's built-in span support
- Write final results and costs to Postgres on completion
- **Deliverable**: triggering a run end-to-end produces saved, per-platform posts in the database

### Phase 5 — Next.js API routes
- `POST /generate`: calls Slop Guard directly, triggers the Phase 4 job only on a pass, returns a run ID
- Job status endpoint (or Trigger.dev realtime hook) for the frontend to poll/subscribe
- Folders and posts CRUD
- Per-platform instruction settings CRUD
- **Deliverable**: a full generate → poll → fetch-result cycle works via API calls alone, no UI required

### Phase 6 — Hardening
- Rate limiting on `/generate` for free-tier users (Redis)
- Consistent structured logging and error handling across both services
- CI: GitHub Actions running both test suites on push
- Deploy configs: Vercel for `/web`, Dockerfile-based deploy for `/ai-service` on Fly.io or Railway