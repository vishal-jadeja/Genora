from openai import AsyncOpenAI

from app.services.providers.base import CompletionResult


class OpenAIAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = AsyncOpenAI(api_key=api_key)

    async def complete(
        self, *, model: str, system: str, user: str, max_tokens: int
    ) -> CompletionResult:
        response = await self._client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_completion_tokens=max_tokens,
        )
        return CompletionResult(
            text=response.choices[0].message.content or "",
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
        )
