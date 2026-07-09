from openai import (
    AsyncOpenAI,
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
        except (AuthenticationError, PermissionDeniedError) as exc:
            raise ProviderAuthError(str(exc)) from exc
        except RateLimitError as exc:
            raise ProviderRateLimitError(str(exc)) from exc
        except (BadRequestError, NotFoundError) as exc:
            raise ProviderBadRequestError(str(exc)) from exc

        return CompletionResult(
            text=response.choices[0].message.content or "",
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
        )
