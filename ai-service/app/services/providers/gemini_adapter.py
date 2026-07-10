from google import genai
from google.genai import types
from google.genai.errors import ClientError

from app.services.providers.base import CompletionResult
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)

# Bounds a single provider call well under the SDK's default timeout, so a
# stuck request fails fast enough for Trigger.dev's retry budget rather than
# outliving the caller's abandoned attempt (see web/src/lib/aiService/client.ts).
ADAPTER_TIMEOUT_MS = 30_000


class GeminiAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=ADAPTER_TIMEOUT_MS),
        )

    async def complete(
        self, *, model: str, system: str, user: str, max_tokens: int
    ) -> CompletionResult:
        try:
            response = await self._client.aio.models.generate_content(
                model=model,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system, max_output_tokens=max_tokens
                ),
            )
        except ClientError as exc:
            if exc.code in (401, 403):
                # Never forward the raw SDK message here: provider auth
                # errors can echo back a masked fragment of the BYOK key,
                # and this message is persisted to Postgres and shown in
                # the UI.
                raise ProviderAuthError(
                    "the provided API key was rejected by the provider"
                ) from exc
            if exc.code == 429:
                raise ProviderRateLimitError(str(exc)) from exc
            raise ProviderBadRequestError(str(exc)) from exc

        usage = response.usage_metadata
        candidates = getattr(response, "candidates", None) or []
        truncated = bool(candidates) and (
            getattr(candidates[0], "finish_reason", None) == types.FinishReason.MAX_TOKENS
        )
        return CompletionResult(
            text=response.text or "",
            prompt_tokens=(usage.prompt_token_count or 0) if usage else 0,
            completion_tokens=(usage.candidates_token_count or 0) if usage else 0,
            truncated=truncated,
        )

    async def aclose(self) -> None:
        # genai.Client.close() is sync (unlike the other three SDKs) but
        # closes the shared _api_client that backs both the sync and .aio
        # (async) surfaces — the only one we actually use.
        self._client.close()
