from anthropic import AsyncAnthropic

from app.services.providers.base import CompletionResult


class AnthropicAdapter:
    def __init__(self, api_key: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)

    async def complete(
        self, *, model: str, system: str, user: str, max_tokens: int
    ) -> CompletionResult:
        response = await self._client.messages.create(
            model=model,
            system=system,
            messages=[{"role": "user", "content": user}],
            max_tokens=max_tokens,
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        return CompletionResult(
            text=text,
            prompt_tokens=response.usage.input_tokens,
            completion_tokens=response.usage.output_tokens,
        )
