import logging

from fastapi import APIRouter

from app.schemas.generate import GenerateRequest, GenerateResponse
from app.services.pipeline.orchestrator import run_pipeline
from app.services.providers.registry import build_adapter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate")
async def generate(request: GenerateRequest) -> GenerateResponse:
    # request.provider is a Literal of the 4 supported providers, so
    # build_adapter's KeyError branch is unreachable from this path.
    adapter = build_adapter(request.provider, request.api_key)
    logger.info(
        "generation request received: provider=%s platform=%s",
        request.provider,
        request.platform,
    )

    try:
        result = await run_pipeline(
            adapter=adapter,
            model=request.model,
            raw_text=request.raw_text,
            platform=request.platform,
            platform_instructions=request.platform_instructions,
            rag_context=request.rag_context,
        )
    finally:
        # Each adapter builds a fresh, uncached client for this request only
        # (see registry.py — required so a BYOK key is never reused across
        # requests); that client's connections must be released explicitly
        # or they leak under sustained traffic.
        await adapter.aclose()

    logger.info("generation request completed: revision_count=%d", result.revision_count)
    return GenerateResponse(
        content=result.content, revision_count=result.revision_count, usage=result.usage
    )
