# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Genora — writing-first AI content repurposing tool. User writes a raw thought once, picks target platforms (LinkedIn, X, Reddit, Medium, Substack), system generates a platform-specific post for each. `backend-plan.md` is the authoritative build plan: tech stack, architecture decisions, and phased roadmap. **Read it before backend work — its decisions are settled; don't re-litigate them.**

## Monorepo layout

- `/web` — Next.js 16 (App Router, TypeScript). BFF layer: auth, CRUD, synchronous Slop Guard gate, job triggering. Trigger.dev v4 tasks live in `/web/trigger`.
- `/ai-service` — Python 3.12 / FastAPI. BYOK adapter, Slop Guard, RAG, Writer→Critic→Reviser pipeline. No LangChain — agent loop is implemented directly against provider SDKs.

## Commands

### `/web`

```
npm run dev           # dev server, http://localhost:3000
npm run build
npm run lint          # ESLint
npm run format        # Prettier (format:check to verify)
npm test              # Vitest, all tests
npx vitest run <path> # single test file
```

### `/ai-service` (requires uv)

```
uv sync
uv run uvicorn app.main:app --reload   # http://localhost:8000
uv run pytest                          # all tests
uv run pytest app/tests/test_x.py      # single test file
uv run ruff check .                    # lint
uv run black --check .                 # format check
```

Health checks: `GET localhost:3000/api/health` and `GET localhost:8000/health` both return `{"status":"ok"}`.

Env: `web/.env.local` (copy from `web/.env.example`) and `ai-service/.env`. `INTERNAL_SERVICE_SECRET` must match across both services.

## Architecture (from backend-plan.md — settled decisions)

Core generation flow:
1. Generate request → Next.js calls the Python Slop Guard endpoint **directly and synchronously** (not through Trigger.dev). Reject → instant HTTP response, no job created.
2. Pass → Next.js triggers a Trigger.dev v4 run, which fans out one parallel subtask per selected platform, each calling the Python generation endpoint (Writer → Critic → Reviser with RAG context + per-platform instructions).
3. Partial failures allowed — one platform failing doesn't fail the run. Results/costs written to Postgres; free-tier quota tracked in Redis. Frontend polls/subscribes to the run.

Key decisions:
- **Stack**: Drizzle ORM on Neon Postgres (EU/Frankfurt) + pgvector; Upstash Redis (quota + rate limiting); NextAuth v5; Trigger.dev v4. Deploy: Vercel (`/web`), Fly.io/Railway (`/ai-service`).
- **Embeddings**: Google `gemini-embedding-001` truncated to 768-dim, platform-owned key — independent of user's BYOK provider so embedding dimensions stay fixed (`vector(768)`).
- **Service-to-service auth**: shared-secret header (`INTERNAL_SERVICE_SECRET`) checked by FastAPI middleware on every call from Next.js/Trigger.dev.
- **BYOK keys**: AES-256-GCM encrypted at rest in Postgres; decrypted server-side in Next.js at request time, sent over internal HTTPS to the Python service, held in memory for the request only — never persisted or logged there.
- **Quota**: Redis = live counter (real-time allow/deny); Postgres `usage_logs` = append-only audit trail. Separate jobs, no reconciliation.

## Working rules (from backend-plan.md)

- Build phases in order (Phase 0 scaffolding → 1 data layer → 2 auth/BYOK → 3 AI service core → 4 Trigger.dev → 5 API routes → 6 hardening). Don't start a phase until the previous one works; summarize each phase when done. Current state: Phases 0-5 done; Phase 6 (hardening) in progress — see `README.md` Build status table for what's landed vs. open.
- Ask before adding any dependency not in the tech stack list.
- Tests alongside code, not after — pytest for `/ai-service`, Vitest for `/web`.
- Explicit typed code: Pydantic models in Python; TypeScript types/Zod schemas in Next.js.
- If the spec conflicts with what makes sense in the code, stop and say why rather than silently deviating.

## Notes

- `web/CLAUDE.md` (auto-managed block injected by Next.js — don't hand-edit): this Next.js version has breaking changes vs. training data — read the relevant guide in `web/node_modules/next/dist/docs/` before writing Next.js code.
- `web/src/components/` + `web/src/lib/genora/` is the live app UI (originally built as a self-contained prototype) — `useGenoraController.ts` is now fully wired to the backend via TanStack Query hooks (`useFolders`, `usePosts`, `useApiKeys`, `useQuota`, `useGenerate`, etc.). `lib/genora/data.ts` holds only static config (model/platform metadata, themes, default instructions); its `folders`/`posts` arrays are placeholders always overridden by live query data (see `displayState` in `useGenoraController.ts`).
