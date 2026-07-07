from fastapi import APIRouter

from app.schemas.generate import GenerateRequest, GenerateResponse
from app.services.pipeline.orchestrator import run_pipeline
from app.services.providers.registry import build_adapter

router = APIRouter()


@router.post("/generate")
async def generate(request: GenerateRequest) -> GenerateResponse:
    # request.provider is a Literal of the 4 supported providers, so
    # build_adapter's KeyError branch is unreachable from this path.
    adapter = build_adapter(request.provider, request.api_key)

    result = await run_pipeline(
        adapter=adapter,
        model=request.model,
        raw_text=request.raw_text,
        platform=request.platform,
        platform_instructions=request.platform_instructions,
        rag_context=request.rag_context,
    )
    return GenerateResponse(
        content=result.content, revision_count=result.revision_count, usage=result.usage
    )
