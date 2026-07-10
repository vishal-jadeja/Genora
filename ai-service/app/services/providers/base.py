from dataclasses import dataclass
from typing import Protocol


@dataclass
class CompletionResult:
    text: str
    prompt_tokens: int
    completion_tokens: int
    # True when the provider cut the completion off for hitting max_tokens
    # (not for a natural stop) — lets the orchestrator retry with a bigger
    # budget instead of silently shipping content cut off mid-sentence.
    truncated: bool = False


class ProviderAdapter(Protocol):
    """One system+user turn in, one completion out.

    Deliberately single-turn (no message history): every Writer/Critic/
    Reviser stage is a fresh call, so this is all four BYOK providers need —
    and it's what lets Gemini's non-chat `contents` shape sit behind the same
    interface as the other three without awkward role-mapping.
    """

    async def complete(
        self, *, model: str, system: str, user: str, max_tokens: int
    ) -> CompletionResult: ...

    async def aclose(self) -> None:
        """Releases the underlying SDK client's connections.

        Each adapter wraps a fresh, uncached client built per-request (see
        registry.py) — that client's own httpx.AsyncClient must be closed
        explicitly or its connections leak, since nothing else ever calls
        close() on a client that's neither cached nor garbage-collected
        synchronously."""
        ...
