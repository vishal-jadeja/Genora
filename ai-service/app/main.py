from fastapi import APIRouter, Depends, FastAPI

from app.core.security import require_internal_secret

app = FastAPI(title="Genora AI Service")

# Every route added from Phase 3 onward (Slop Guard, RAG, generation) must be
# registered on this router so it's gated by the shared internal secret.
internal_router = APIRouter(dependencies=[Depends(require_internal_secret)])
app.include_router(internal_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
