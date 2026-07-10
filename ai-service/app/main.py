import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.correlation import CorrelationIdMiddleware
from app.core.db import close_pool, init_pool
from app.core.logging import configure_logging, correlation_id_var
from app.core.security import require_internal_secret
from app.routers.generate import router as generate_router
from app.routers.rag import router as rag_router
from app.routers.slop_guard import router as slop_guard_router
from app.schemas.errors import ErrorResponse
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)

configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="Genora AI Service", lifespan=lifespan)
app.add_middleware(CorrelationIdMiddleware)

# Every route added from Phase 3 onward (Slop Guard, RAG, generation) must be
# registered on this router so it's gated by the shared internal secret.
internal_router = APIRouter(dependencies=[Depends(require_internal_secret)])
internal_router.include_router(slop_guard_router)
internal_router.include_router(rag_router)
internal_router.include_router(generate_router)
app.include_router(internal_router)


def _error_response(status_code: int, detail: str) -> JSONResponse:
    body = ErrorResponse(detail=detail, correlationId=correlation_id_var.get())
    return JSONResponse(status_code=status_code, content=body.model_dump())


# These map provider SDK failures (raised from any pipeline stage in
# services/pipeline/orchestrator.py) to the 4xx statuses the Trigger.dev
# caller's `status < 500` fast-fail check (web/trigger/generatePlatformPost.ts)
# relies on to distinguish permanent BYOK-key failures from transient ones.
@app.exception_handler(ProviderAuthError)
async def _provider_auth_error(request: Request, exc: ProviderAuthError) -> JSONResponse:
    logger.warning("provider auth error: %s", exc)
    return _error_response(401, str(exc))


@app.exception_handler(ProviderRateLimitError)
async def _provider_rate_limit_error(request: Request, exc: ProviderRateLimitError) -> JSONResponse:
    logger.warning("provider rate limit error: %s", exc)
    return _error_response(429, str(exc))


@app.exception_handler(ProviderBadRequestError)
async def _provider_bad_request_error(
    request: Request, exc: ProviderBadRequestError
) -> JSONResponse:
    logger.warning("provider bad request error: %s", exc)
    return _error_response(400, str(exc))


# Catches require_internal_secret's 401 and any other explicit HTTPException
# raised in a route — previously fell through to FastAPI's stock handling
# with no log line and no correlation id.
@app.exception_handler(StarletteHTTPException)
async def _http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    logger.warning("http exception %s: %s", exc.status_code, exc.detail)
    return _error_response(exc.status_code, str(exc.detail))


@app.exception_handler(RequestValidationError)
async def _validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.info("request validation error: %s", exc.errors())
    return _error_response(422, "invalid request body")


# True catch-all — an unexpected exception (e.g. a driver error) must never
# leak internals to the caller, but must be logged with a stack trace and a
# correlation id so it's traceable.
@app.exception_handler(Exception)
async def _unhandled_exception(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled exception")
    return _error_response(500, "internal server error")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
