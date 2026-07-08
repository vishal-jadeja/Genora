from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.db import close_pool, init_pool
from app.core.security import require_internal_secret
from app.routers.generate import router as generate_router
from app.routers.rag import router as rag_router
from app.routers.slop_guard import router as slop_guard_router
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="Genora AI Service", lifespan=lifespan)

# Every route added from Phase 3 onward (Slop Guard, RAG, generation) must be
# registered on this router so it's gated by the shared internal secret.
internal_router = APIRouter(dependencies=[Depends(require_internal_secret)])
internal_router.include_router(slop_guard_router)
internal_router.include_router(rag_router)
internal_router.include_router(generate_router)
app.include_router(internal_router)


# These map provider SDK failures (raised from any pipeline stage in
# services/pipeline/orchestrator.py) to the 4xx statuses the Trigger.dev
# caller's `status < 500` fast-fail check (web/trigger/generatePlatformPost.ts)
# relies on to distinguish permanent BYOK-key failures from transient ones.
@app.exception_handler(ProviderAuthError)
async def _provider_auth_error(request: Request, exc: ProviderAuthError) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(ProviderRateLimitError)
async def _provider_rate_limit_error(
    request: Request, exc: ProviderRateLimitError
) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": str(exc)})


@app.exception_handler(ProviderBadRequestError)
async def _provider_bad_request_error(
    request: Request, exc: ProviderBadRequestError
) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
