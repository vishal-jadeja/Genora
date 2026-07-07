from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI

from app.core.db import close_pool, init_pool
from app.core.security import require_internal_secret
from app.routers.rag import router as rag_router
from app.routers.slop_guard import router as slop_guard_router


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
app.include_router(internal_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
