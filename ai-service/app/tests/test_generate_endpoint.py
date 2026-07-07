import pytest
from fastapi.testclient import TestClient

import app.routers.generate as generate_module
from app.core.config import settings
from app.main import app
from app.services.providers.base import CompletionResult

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

    async def complete(self, *, model, system, user, max_tokens):
        return self._script.pop(0)


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
