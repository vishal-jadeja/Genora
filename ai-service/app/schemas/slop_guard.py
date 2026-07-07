from enum import StrEnum

from pydantic import BaseModel, Field


class SlopGuardVerdict(StrEnum):
    PASS = "pass"
    SOFT_NUDGE = "soft_nudge"
    HARD_REJECT = "hard_reject"


class SlopGuardRequest(BaseModel):
    raw_text: str = Field(min_length=1, max_length=20_000)


class SlopGuardResult(BaseModel):
    verdict: SlopGuardVerdict
    reason: str
