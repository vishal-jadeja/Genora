from types import SimpleNamespace

import anthropic
import groq
import httpx
import openai
import pytest
from google.genai.errors import ClientError

from app.services.providers.anthropic_adapter import AnthropicAdapter
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)
from app.services.providers.gemini_adapter import GeminiAdapter
from app.services.providers.groq_adapter import GroqAdapter
from app.services.providers.openai_adapter import OpenAIAdapter
from app.services.providers.registry import build_adapter


def _http_error_response(status_code: int) -> httpx.Response:
    return httpx.Response(
        status_code=status_code, request=httpx.Request("POST", "https://example.com")
    )


def _openai_shaped_response(content: str, prompt_tokens: int, completion_tokens: int):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))],
        usage=SimpleNamespace(prompt_tokens=prompt_tokens, completion_tokens=completion_tokens),
    )


async def test_anthropic_adapter_concatenates_text_blocks_and_reads_usage():
    adapter = AnthropicAdapter(api_key="unused")
    fake_response = SimpleNamespace(
        content=[
            SimpleNamespace(type="text", text="hello "),
            SimpleNamespace(type="text", text="world"),
        ],
        usage=SimpleNamespace(input_tokens=12, output_tokens=7),
    )

    async def fake_create(**kwargs):
        return fake_response

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    result = await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)

    assert result.text == "hello world"
    assert result.prompt_tokens == 12
    assert result.completion_tokens == 7


async def test_anthropic_adapter_skips_non_text_blocks():
    adapter = AnthropicAdapter(api_key="unused")
    fake_response = SimpleNamespace(
        content=[
            SimpleNamespace(type="tool_use", text="should be ignored"),
            SimpleNamespace(type="text", text="actual text"),
        ],
        usage=SimpleNamespace(input_tokens=1, output_tokens=1),
    )

    async def fake_create(**kwargs):
        return fake_response

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    result = await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)

    assert result.text == "actual text"


async def test_openai_adapter_reads_first_choice_and_usage():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        return _openai_shaped_response("a completion", prompt_tokens=8, completion_tokens=4)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)

    assert result.text == "a completion"
    assert result.prompt_tokens == 8
    assert result.completion_tokens == 4


async def test_openai_adapter_handles_none_content():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        return _openai_shaped_response(None, prompt_tokens=1, completion_tokens=0)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)

    assert result.text == ""


async def test_groq_adapter_reads_first_choice_and_usage():
    adapter = GroqAdapter(api_key="unused")

    async def fake_create(**kwargs):
        return _openai_shaped_response("groq completion", prompt_tokens=3, completion_tokens=2)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    result = await adapter.complete(model="llama-x", system="sys", user="hi", max_tokens=100)

    assert result.text == "groq completion"
    assert result.prompt_tokens == 3
    assert result.completion_tokens == 2


async def test_gemini_adapter_reads_text_property_and_usage_metadata():
    adapter = GeminiAdapter(api_key="unused")
    fake_response = SimpleNamespace(
        text="gemini output",
        usage_metadata=SimpleNamespace(prompt_token_count=6, candidates_token_count=9),
    )

    async def fake_generate_content(**kwargs):
        return fake_response

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    result = await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)

    assert result.text == "gemini output"
    assert result.prompt_tokens == 6
    assert result.completion_tokens == 9


async def test_gemini_adapter_handles_missing_usage_metadata():
    adapter = GeminiAdapter(api_key="unused")
    fake_response = SimpleNamespace(text=None, usage_metadata=None)

    async def fake_generate_content(**kwargs):
        return fake_response

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    result = await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)

    assert result.text == ""
    assert result.prompt_tokens == 0
    assert result.completion_tokens == 0


async def test_anthropic_adapter_maps_auth_error():
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.AuthenticationError(
            "bad key", response=_http_error_response(401), body=None
        )

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_maps_rate_limit_error():
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.RateLimitError(
            "too many requests", response=_http_error_response(429), body=None
        )

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderRateLimitError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_maps_permission_denied_error_to_auth_error():
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.PermissionDeniedError(
            "no access to this model", response=_http_error_response(403), body=None
        )

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_maps_bad_request_error():
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.BadRequestError("bad model", response=_http_error_response(400), body=None)

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderBadRequestError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_maps_request_too_large_error_to_bad_request():
    # 413 has no dedicated exception class caught by name — this is exactly
    # the class of permanent error that used to fall through uncaught (and
    # therefore get retried 3x by Trigger.dev as if it were transient).
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.RequestTooLargeError(
            "request too large", response=_http_error_response(413), body=None
        )

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderBadRequestError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_maps_conflict_error_to_bad_request():
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.ConflictError("conflict", response=_http_error_response(409), body=None)

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderBadRequestError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_does_not_wrap_5xx_errors():
    # 5xx must propagate bare (not become ProviderBadRequestError) so the
    # caller's status >= 500 check still treats it as retryable.
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.InternalServerError(
            "server exploded", response=_http_error_response(500), body=None
        )

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(anthropic.InternalServerError):
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)


async def test_anthropic_adapter_redacts_auth_error_message():
    # The raw SDK message can contain a masked fragment of the BYOK key
    # (e.g. "Incorrect API key provided: sk-ant-...wxyz") and this message
    # flows through to Postgres + the UI, so it must never be forwarded.
    adapter = AnthropicAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise anthropic.AuthenticationError(
            "Incorrect API key provided: sk-ant-abc...wxyz",
            response=_http_error_response(401),
            body=None,
        )

    adapter._client = SimpleNamespace(messages=SimpleNamespace(create=fake_create))

    with pytest.raises(ProviderAuthError) as exc_info:
        await adapter.complete(model="claude-x", system="sys", user="hi", max_tokens=100)
    assert "sk-ant" not in str(exc_info.value)


async def test_openai_adapter_maps_auth_error():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise openai.AuthenticationError("bad key", response=_http_error_response(401), body=None)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)


async def test_openai_adapter_maps_rate_limit_error():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise openai.RateLimitError(
            "too many requests", response=_http_error_response(429), body=None
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderRateLimitError):
        await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)


async def test_openai_adapter_maps_permission_denied_error_to_auth_error():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise openai.PermissionDeniedError(
            "no access to this model", response=_http_error_response(403), body=None
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)


async def test_openai_adapter_maps_conflict_error_to_bad_request():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise openai.ConflictError("conflict", response=_http_error_response(409), body=None)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderBadRequestError):
        await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)


async def test_openai_adapter_does_not_wrap_5xx_errors():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise openai.InternalServerError(
            "server exploded", response=_http_error_response(500), body=None
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(openai.InternalServerError):
        await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)


async def test_openai_adapter_redacts_auth_error_message():
    adapter = OpenAIAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise openai.AuthenticationError(
            "Incorrect API key provided: sk-abc...wxyz",
            response=_http_error_response(401),
            body=None,
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderAuthError) as exc_info:
        await adapter.complete(model="gpt-x", system="sys", user="hi", max_tokens=100)
    assert "sk-" not in str(exc_info.value)


async def test_groq_adapter_maps_auth_error():
    adapter = GroqAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise groq.AuthenticationError("bad key", response=_http_error_response(401), body=None)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="llama-x", system="sys", user="hi", max_tokens=100)


async def test_groq_adapter_maps_rate_limit_error():
    adapter = GroqAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise groq.RateLimitError(
            "too many requests", response=_http_error_response(429), body=None
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderRateLimitError):
        await adapter.complete(model="llama-x", system="sys", user="hi", max_tokens=100)


async def test_groq_adapter_maps_permission_denied_error_to_auth_error():
    adapter = GroqAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise groq.PermissionDeniedError(
            "no access to this model", response=_http_error_response(403), body=None
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="llama-x", system="sys", user="hi", max_tokens=100)


async def test_groq_adapter_maps_conflict_error_to_bad_request():
    adapter = GroqAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise groq.ConflictError("conflict", response=_http_error_response(409), body=None)

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(ProviderBadRequestError):
        await adapter.complete(model="llama-x", system="sys", user="hi", max_tokens=100)


async def test_groq_adapter_does_not_wrap_5xx_errors():
    adapter = GroqAdapter(api_key="unused")

    async def fake_create(**kwargs):
        raise groq.InternalServerError(
            "server exploded", response=_http_error_response(500), body=None
        )

    adapter._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )

    with pytest.raises(groq.InternalServerError):
        await adapter.complete(model="llama-x", system="sys", user="hi", max_tokens=100)


async def test_gemini_adapter_maps_auth_error():
    adapter = GeminiAdapter(api_key="unused")

    async def fake_generate_content(**kwargs):
        raise ClientError(401, {"error": {"message": "bad key"}})

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)


async def test_gemini_adapter_maps_permission_denied_error_to_auth_error():
    adapter = GeminiAdapter(api_key="unused")

    async def fake_generate_content(**kwargs):
        raise ClientError(403, {"error": {"message": "no access to this model"}})

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    with pytest.raises(ProviderAuthError):
        await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)


async def test_gemini_adapter_maps_rate_limit_error():
    adapter = GeminiAdapter(api_key="unused")

    async def fake_generate_content(**kwargs):
        raise ClientError(429, {"error": {"message": "rate limited"}})

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    with pytest.raises(ProviderRateLimitError):
        await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)


async def test_gemini_adapter_redacts_auth_error_message():
    adapter = GeminiAdapter(api_key="unused")

    async def fake_generate_content(**kwargs):
        raise ClientError(401, {"error": {"message": "API key not valid: AIza...wxyz"}})

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    with pytest.raises(ProviderAuthError) as exc_info:
        await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)
    assert "AIza" not in str(exc_info.value)


async def test_gemini_adapter_maps_other_client_error_to_bad_request():
    adapter = GeminiAdapter(api_key="unused")

    async def fake_generate_content(**kwargs):
        raise ClientError(400, {"error": {"message": "bad model"}})

    adapter._client = SimpleNamespace(
        aio=SimpleNamespace(models=SimpleNamespace(generate_content=fake_generate_content))
    )

    with pytest.raises(ProviderBadRequestError):
        await adapter.complete(model="gemini-x", system="sys", user="hi", max_tokens=100)


def test_registry_builds_the_right_adapter_type():
    assert isinstance(build_adapter("anthropic", "key"), AnthropicAdapter)
    assert isinstance(build_adapter("openai", "key"), OpenAIAdapter)
    assert isinstance(build_adapter("groq", "key"), GroqAdapter)
    assert isinstance(build_adapter("gemini", "key"), GeminiAdapter)


def test_registry_rejects_unknown_provider():
    with pytest.raises(ValueError, match="unsupported provider"):
        build_adapter("some-other-provider", "key")
