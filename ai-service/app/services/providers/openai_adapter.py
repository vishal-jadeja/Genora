from openai import APIStatusError, AsyncOpenAI

from app.services.providers.base import CompletionResult
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)

# Bounds a single provider call well under the SDK's ~10min default, so a
# stuck request fails fast enough for Trigger.dev's retry budget rather than
# outliving the caller's abandoned attempt (see web/src/lib/aiService/client.ts).
ADAPTER_TIMEOUT_SECONDS = 30.0


class OpenAIAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = AsyncOpenAI(api_key=api_key, timeout=ADAPTER_TIMEOUT_SECONDS)

    async def complete(
        self, *, model: str, system: str, user: str, max_tokens: int
    ) -> CompletionResult:
        try:
            response = await self._client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_completion_tokens=max_tokens,
            )
        except APIStatusError as exc:
            # Branch on status_code (not exception subclass) so every 4xx the
            # SDK can raise — including ones not explicitly named here, like
            # ConflictError/UnprocessableEntityError — is treated as
            # permanent. Anything left (5xx) re-raises bare and falls
            # through to a generic 500, which is what tells the caller
            # (web/trigger/generatePlatformPost.ts) to retry.
            if exc.status_code in (401, 403):
                # Never forward the raw SDK message here: provider auth
                # errors can echo back a masked fragment of the BYOK key
                # (e.g. "sk-...wxyz"), and this message is persisted to
                # Postgres and shown in the UI.
                raise ProviderAuthError(
                    "the provided API key was rejected by the provider"
                ) from exc
            if exc.status_code == 429:
                raise ProviderRateLimitError(str(exc)) from exc
            if exc.status_code < 500:
                raise ProviderBadRequestError(str(exc)) from exc
            raise

        return CompletionResult(
            text=response.choices[0].message.content or "",
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            truncated=getattr(response.choices[0], "finish_reason", None) == "length",
        )

    async def aclose(self) -> None:
        await self._client.close()
