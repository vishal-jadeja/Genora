from fastapi import APIRouter

from app.schemas.slop_guard import SlopGuardRequest, SlopGuardResult
from app.services.slop_guard import evaluate_slop_guard

router = APIRouter()


@router.post("/slop-guard")
async def check_slop_guard(request: SlopGuardRequest) -> SlopGuardResult:
    return evaluate_slop_guard(request.raw_text)
