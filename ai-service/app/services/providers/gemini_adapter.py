from google import genai
from google.genai import types
from google.genai.errors import ClientError

from app.services.providers.base import CompletionResult
from app.services.providers.errors import (
    ProviderAuthError,
    ProviderBadRequestError,
    ProviderRateLimitError,
)


class GeminiAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(api_key=api_key)

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
                raise ProviderAuthError(str(exc)) from exc
            if exc.code == 429:
                raise ProviderRateLimitError(str(exc)) from exc
            raise ProviderBadRequestError(str(exc)) from exc

        usage = response.usage_metadata
        return CompletionResult(
            text=response.text or "",
            prompt_tokens=(usage.prompt_token_count or 0) if usage else 0,
            completion_tokens=(usage.candidates_token_count or 0) if usage else 0,
        )
