from anthropic import (
    AsyncAnthropic,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    RateLimitError,
)

from app.services.providers.base import CompletionResult
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)


class AnthropicAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)

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
        except AuthenticationError as exc:
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
