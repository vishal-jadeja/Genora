from typing import Literal

from pydantic import BaseModel, Field

# Mirrors web/src/db/schema/enums.ts exactly — keep in sync by hand, there's
# no shared codegen between the TypeScript and Python services.
Platform = Literal["linkedin", "x", "reddit", "medium", "substack"]
Provider = Literal["anthropic", "openai", "gemini", "groq"]
GenerationStage = Literal["writer", "critic", "reviser"]


class GenerateRequest(BaseModel):
    raw_text: str = Field(min_length=1, max_length=20_000)
    platform: Platform
    platform_instructions: str = ""
    rag_context: list[str] = Field(default_factory=list)
    provider: Provider
    # Plaintext BYOK key, decrypted by Next.js and sent over the internal
    # HTTPS call for this request only — never persisted or logged here.
    api_key: str = Field(min_length=1)
    model: str = Field(min_length=1)


class StageUsage(BaseModel):
    stage: GenerationStage
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class GenerateResponse(BaseModel):
    content: str
    revision_count: int
    usage: list[StageUsage]
