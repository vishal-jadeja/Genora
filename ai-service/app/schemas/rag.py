from uuid import UUID

from pydantic import BaseModel, Field


class RagRetrieveRequest(BaseModel):
    user_id: UUID
    query_text: str = Field(min_length=1, max_length=20_000)
    limit: int = Field(default=5, ge=1, le=20)


class RagMatch(BaseModel):
    post_id: UUID | None
    content: str
    # Raw pgvector cosine distance (`<=>`): lower means more similar. Left
    # untransformed rather than reported as "similarity" since that would
    # imply the embeddings are unit-normalized, which Gemini doesn't guarantee.
    distance: float


class RagRetrieveResponse(BaseModel):
    matches: list[RagMatch]
