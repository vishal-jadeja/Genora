import pytest
from fastapi.testclient import TestClient

import app.routers.generate as generate_module
from app.core.config import settings
from app.main import app
from app.services.providers.base import CompletionResult
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)

client = TestClient(app)
AUTH_HEADERS = {"x-internal-secret": settings.internal_service_secret}

VALID_BODY = {
    "raw_text": "shipped a feature nobody asked for and it became our most-used one",
    "platform": "linkedin",
    "provider": "anthropic",
    "api_key": "sk-test-key",
    "model": "claude-x",
}


class _FakeAdapter:
    def __init__(self, script: list[CompletionResult]) -> None:
        self._script = list(script)
        self.closed = False

    async def complete(self, *, model, system, user, max_tokens):
        return self._script.pop(0)

    async def aclose(self) -> None:
        self.closed = True


@pytest.fixture(autouse=True)
def _restore_build_adapter():
    original = generate_module.build_adapter
    yield
    generate_module.build_adapter = original


def test_generate_endpoint_requires_internal_secret():
    response = client.post("/generate", json=VALID_BODY)
    assert response.status_code == 401


def test_generate_endpoint_returns_final_draft_and_usage(monkeypatch):
    fake_adapter = _FakeAdapter(
        [
            CompletionResult(text="first draft", prompt_tokens=10, completion_tokens=20),
            CompletionResult(
                text='{"approved": true, "feedback": ""}', prompt_tokens=5, completion_tokens=3
            ),
        ]
    )
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post("/generate", json=VALID_BODY, headers=AUTH_HEADERS)

    assert response.status_code == 200
    body = response.json()
    assert body["content"] == "first draft"
    assert body["revision_count"] == 0
    assert [u["stage"] for u in body["usage"]] == ["writer", "critic"]


def test_generate_endpoint_rejects_unsupported_platform():
    response = client.post(
        "/generate", json={**VALID_BODY, "platform": "myspace"}, headers=AUTH_HEADERS
    )
    assert response.status_code == 422


def test_generate_endpoint_rejects_unsupported_provider():
    response = client.post(
        "/generate", json={**VALID_BODY, "provider": "cohere"}, headers=AUTH_HEADERS
    )
    assert response.status_code == 422


def test_generate_endpoint_rejects_empty_raw_text():
    response = client.post("/generate", json={**VALID_BODY, "raw_text": ""}, headers=AUTH_HEADERS)
    assert response.status_code == 422


class _FailingAdapter:
    def __init__(self, exc: Exception) -> None:
        self._exc = exc
        self.closed = False

    async def complete(self, *, model, system, user, max_tokens):
        raise self._exc

    async def aclose(self) -> None:
        self.closed = True


def test_generate_endpoint_maps_provider_auth_error_to_401(monkeypatch):
    fake_adapter = _FailingAdapter(ProviderAuthError("bad key"))
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post("/generate", json=VALID_BODY, headers=AUTH_HEADERS)

    assert response.status_code == 401
    # The adapter's client must be released even on failure, or a leaked
    # connection accumulates on every failed generation.
    assert fake_adapter.closed is True


def test_generate_endpoint_closes_the_adapter_on_success(monkeypatch):
    fake_adapter = _FakeAdapter(
        [
            CompletionResult(text="first draft", prompt_tokens=10, completion_tokens=20),
            CompletionResult(
                text='{"approved": true, "feedback": ""}', prompt_tokens=5, completion_tokens=3
            ),
        ]
    )
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post("/generate", json=VALID_BODY, headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert fake_adapter.closed is True


def test_generate_endpoint_maps_provider_rate_limit_error_to_429(monkeypatch):
    fake_adapter = _FailingAdapter(ProviderRateLimitError("too many requests"))
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post("/generate", json=VALID_BODY, headers=AUTH_HEADERS)

    assert response.status_code == 429


def test_generate_endpoint_maps_provider_bad_request_error_to_400(monkeypatch):
    fake_adapter = _FailingAdapter(ProviderBadRequestError("bad model"))
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post("/generate", json=VALID_BODY, headers=AUTH_HEADERS)

    assert response.status_code == 400


def test_generate_endpoint_rejects_platform_instructions_over_cap():
    response = client.post(
        "/generate",
        json={**VALID_BODY, "platform_instructions": "x" * 12_001},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 422


def test_generate_endpoint_accepts_platform_instructions_at_cap(monkeypatch):
    fake_adapter = _FakeAdapter(
        [
            CompletionResult(text="draft", prompt_tokens=1, completion_tokens=1),
            CompletionResult(
                text='{"approved": true, "feedback": ""}', prompt_tokens=1, completion_tokens=1
            ),
        ]
    )
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post(
        "/generate",
        json={**VALID_BODY, "platform_instructions": "x" * 12_000},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 200


def test_generate_endpoint_rejects_too_many_rag_context_entries():
    response = client.post(
        "/generate",
        json={**VALID_BODY, "rag_context": ["a"] * 21},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 422


def test_generate_endpoint_accepts_rag_context_at_max_entries(monkeypatch):
    fake_adapter = _FakeAdapter(
        [
            CompletionResult(text="draft", prompt_tokens=1, completion_tokens=1),
            CompletionResult(
                text='{"approved": true, "feedback": ""}', prompt_tokens=1, completion_tokens=1
            ),
        ]
    )
    monkeypatch.setattr(generate_module, "build_adapter", lambda provider, api_key: fake_adapter)

    response = client.post(
        "/generate",
        json={**VALID_BODY, "rag_context": ["a"] * 20},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 200


def test_generate_endpoint_rejects_an_oversized_rag_context_entry():
    response = client.post(
        "/generate",
        json={**VALID_BODY, "rag_context": ["x" * 20_001]},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 422
