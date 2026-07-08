from typing import Literal

from pydantic import BaseModel, Field, field_validator

# Mirrors web/src/db/schema/enums.ts exactly — keep in sync by hand, there's
# no shared codegen between the TypeScript and Python services.
Platform = Literal["linkedin", "x", "reddit", "medium", "substack"]
Provider = Literal["anthropic", "openai", "gemini", "groq"]
GenerationStage = Literal["writer", "critic", "reviser"]

# Each rag_context entry is a past post's raw content, so it's bounded the
# same as raw_text itself.
_RAG_CONTEXT_ENTRY_MAX_LENGTH = 20_000


class GenerateRequest(BaseModel):
    raw_text: str = Field(min_length=1, max_length=20_000)
    platform: Platform
    # Matches the cap already enforced at the source
    # (web/src/lib/platformInstructions/schema.ts caps at 10_000), with
    # headroom here for defense in depth rather than an exact mirror.
    platform_instructions: str = Field(default="", max_length=12_000)
    # Bounded to RagRetrieveRequest.limit's max (app/schemas/rag.py) — the
    # generate request should never be asked to carry more matches than a
    # single RAG retrieve call can return.
    rag_context: list[str] = Field(default_factory=list, max_length=20)
    provider: Provider
    # Plaintext BYOK key, decrypted by Next.js and sent over the internal
    # HTTPS call for this request only — never persisted or logged here.
    api_key: str = Field(min_length=1)
    model: str = Field(min_length=1)

    @field_validator("rag_context")
    @classmethod
    def _bound_rag_context_entry_length(cls, value: list[str]) -> list[str]:
        if any(len(entry) > _RAG_CONTEXT_ENTRY_MAX_LENGTH for entry in value):
            raise ValueError(
                f"each rag_context entry must be at most "
                f"{_RAG_CONTEXT_ENTRY_MAX_LENGTH} characters"
            )
        return value


class StageUsage(BaseModel):
    stage: GenerationStage
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class GenerateResponse(BaseModel):
    content: str
    revision_count: int
    usage: list[StageUsage]
