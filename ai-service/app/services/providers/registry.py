from app.services.providers.anthropic_adapter import AnthropicAdapter
from app.services.providers.base import ProviderAdapter
from app.services.providers.gemini_adapter import GeminiAdapter
from app.services.providers.groq_adapter import GroqAdapter
from app.services.providers.openai_adapter import OpenAIAdapter

_ADAPTER_CLASSES = {
    "anthropic": AnthropicAdapter,
    "openai": OpenAIAdapter,
    "gemini": GeminiAdapter,
    "groq": GroqAdapter,
}


def build_adapter(provider: str, api_key: str) -> ProviderAdapter:
    """Builds a fresh client from the request's plaintext BYOK key.

    Deliberately not cached/singleton, unlike the platform-owned Gemini
    embedder: a user's key arrives fresh per-request and must live in memory
    for that request only (see backend-plan.md), never persisted or reused
    across requests.
    """
    try:
        adapter_cls = _ADAPTER_CLASSES[provider]
    except KeyError:
        raise ValueError(f"unsupported provider: {provider}") from None
    return adapter_cls(api_key)
