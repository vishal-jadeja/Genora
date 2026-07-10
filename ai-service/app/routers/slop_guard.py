import logging

from fastapi import APIRouter

from app.schemas.slop_guard import SlopGuardRequest, SlopGuardResult
from app.services.slop_guard import evaluate_slop_guard

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/slop-guard")
async def check_slop_guard(request: SlopGuardRequest) -> SlopGuardResult:
    result = evaluate_slop_guard(request.raw_text)
    logger.info("slop guard verdict: %s", result.verdict)
    return result
