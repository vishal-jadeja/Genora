import pytest

from app.services.pipeline.orchestrator import MAX_REVISIONS, run_pipeline
from app.services.providers.base import CompletionResult
from app.services.providers.errors import ProviderAuthError


class _ScriptedAdapter:
    """Returns one canned CompletionResult per call, in order."""

    def __init__(self, script: list[CompletionResult]) -> None:
        self._script = list(script)
        self.calls: list[dict] = []

    async def complete(self, *, model: str, system: str, user: str, max_tokens: int):
        self.calls.append({"model": model, "system": system, "user": user})
        item = self._script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def _result(text: str, prompt_tokens: int = 10, completion_tokens: int = 20) -> CompletionResult:
    return CompletionResult(
        text=text, prompt_tokens=prompt_tokens, completion_tokens=completion_tokens
    )


async def test_pipeline_approved_on_first_pass_needs_no_revision():
    adapter = _ScriptedAdapter(
        [
            _result("first draft"),
            _result('{"approved": true, "feedback": ""}'),
        ]
    )

    result = await run_pipeline(adapter, "model-x", "raw thought", "linkedin", "", [])

    assert result.content == "first draft"
    assert result.revision_count == 0
    assert [u.stage for u in result.usage] == ["writer", "critic"]
    assert len(adapter.calls) == 2


async def test_pipeline_revises_once_then_stops_on_approval():
    adapter = _ScriptedAdapter(
        [
            _result("first draft"),
            _result('{"approved": false, "feedback": "too generic"}'),
            _result("revised draft"),
            _result('{"approved": true, "feedback": ""}'),
        ]
    )

    result = await run_pipeline(adapter, "model-x", "raw thought", "linkedin", "", [])

    assert result.content == "revised draft"
    assert result.revision_count == 1
    assert [u.stage for u in result.usage] == ["writer", "critic", "reviser", "critic"]
    # the reviser call should have received the critic's actual feedback
    assert "too generic" in adapter.calls[2]["user"]


async def test_pipeline_stops_at_max_revisions_even_if_never_approved():
    adapter = _ScriptedAdapter(
        [
            _result("draft 0"),
            *[
                item
                for round_num in range(MAX_REVISIONS)
                for item in (
                    _result('{"approved": false, "feedback": "still not good enough"}'),
                    _result(f"draft {round_num + 1}"),
                )
            ],
        ]
    )

    result = await run_pipeline(adapter, "model-x", "raw thought", "linkedin", "", [])

    assert result.content == f"draft {MAX_REVISIONS}"
    assert result.revision_count == MAX_REVISIONS
    assert len(result.usage) == 1 + MAX_REVISIONS * 2


async def test_pipeline_aggregates_token_usage_per_stage():
    adapter = _ScriptedAdapter(
        [
            _result("first draft", prompt_tokens=100, completion_tokens=50),
            _result('{"approved": true, "feedback": ""}', prompt_tokens=30, completion_tokens=5),
        ]
    )

    result = await run_pipeline(adapter, "model-x", "raw thought", "linkedin", "", [])

    writer_usage = result.usage[0]
    assert writer_usage.prompt_tokens == 100
    assert writer_usage.completion_tokens == 50
    assert writer_usage.total_tokens == 150


async def test_pipeline_tags_the_failing_stage_on_provider_error():
    adapter = _ScriptedAdapter(
        [
            _result("first draft"),
            ProviderAuthError("bad key"),
        ]
    )

    with pytest.raises(ProviderAuthError, match="critic stage"):
        await run_pipeline(adapter, "model-x", "raw thought", "linkedin", "", [])
