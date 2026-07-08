from dataclasses import dataclass

from app.schemas.generate import StageUsage
from app.services.pipeline.prompts import (
    build_critic_prompt,
    build_reviser_prompt,
    build_writer_prompt,
    parse_critic_response,
)
from app.services.providers.base import CompletionResult, ProviderAdapter
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)

# Bounds cost/latency on a synchronous-feeling pipeline: if the critic never
# approves within this many revision rounds, the last revision ships anyway
# rather than looping indefinitely.
MAX_REVISIONS = 2

# Generous for a single social/newsletter post; not user-configurable.
MAX_TOKENS_PER_CALL = 1024


@dataclass
class PipelineResult:
    content: str
    revision_count: int
    usage: list[StageUsage]


async def _complete_stage(
    adapter: ProviderAdapter, stage: str, **kwargs: object
) -> CompletionResult:
    """Tags which pipeline stage a provider failure came from before it
    propagates up to the `app.main` exception handlers that turn it into an
    HTTP status — without this, a 401 tells the caller a key is bad but not
    which of the three calls in a single generate request hit it."""
    try:
        return await adapter.complete(**kwargs)
    except (ProviderAuthError, ProviderRateLimitError, ProviderBadRequestError) as exc:
        raise type(exc)(f"{stage} stage: {exc}") from exc


def _record_usage(usage: list[StageUsage], stage: str, result: CompletionResult) -> None:
    usage.append(
        StageUsage(
            stage=stage,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            total_tokens=result.prompt_tokens + result.completion_tokens,
        )
    )


async def run_pipeline(
    adapter: ProviderAdapter,
    model: str,
    raw_text: str,
    platform: str,
    platform_instructions: str,
    rag_context: list[str],
) -> PipelineResult:
    usage: list[StageUsage] = []

    system, user = build_writer_prompt(raw_text, platform, platform_instructions, rag_context)
    writer_result = await _complete_stage(
        adapter, "writer", model=model, system=system, user=user, max_tokens=MAX_TOKENS_PER_CALL
    )
    _record_usage(usage, "writer", writer_result)
    draft = writer_result.text

    revision_count = 0
    for _ in range(MAX_REVISIONS):
        system, user = build_critic_prompt(draft, platform, platform_instructions)
        critic_result = await _complete_stage(
            adapter, "critic", model=model, system=system, user=user, max_tokens=MAX_TOKENS_PER_CALL
        )
        _record_usage(usage, "critic", critic_result)
        verdict = parse_critic_response(critic_result.text)
        if verdict.approved:
            break

        system, user = build_reviser_prompt(
            draft, verdict.feedback, platform, platform_instructions
        )
        reviser_result = await _complete_stage(
            adapter, "reviser", model=model, system=system, user=user, max_tokens=MAX_TOKENS_PER_CALL
        )
        _record_usage(usage, "reviser", reviser_result)
        draft = reviser_result.text
        revision_count += 1

    return PipelineResult(content=draft, revision_count=revision_count, usage=usage)
