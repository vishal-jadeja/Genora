from groq import AsyncGroq, AuthenticationError, BadRequestError, NotFoundError, RateLimitError

from app.services.providers.base import CompletionResult
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)


class GroqAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = AsyncGroq(api_key=api_key)

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
        except AuthenticationError as exc:
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
