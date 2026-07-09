from anthropic import (
    AsyncAnthropic,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
)

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


class AnthropicAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key, timeout=ADAPTER_TIMEOUT_SECONDS)

    async def complete(
        self, *, model: str, system: str, user: str, max_tokens: int
    ) -> CompletionResult:
        try:
            response = await self._client.messages.create(
                model=model,
                system=system,
                messages=[{"role": "user", "content": user}],
                max_tokens=max_tokens,
            )
        except (AuthenticationError, PermissionDeniedError) as exc:
            raise ProviderAuthError(str(exc)) from exc
        except RateLimitError as exc:
            raise ProviderRateLimitError(str(exc)) from exc
        except (BadRequestError, NotFoundError) as exc:
            raise ProviderBadRequestError(str(exc)) from exc

        text = "".join(block.text for block in response.content if block.type == "text")
        return CompletionResult(
            text=text,
            prompt_tokens=response.usage.input_tokens,
            completion_tokens=response.usage.output_tokens,
        )
