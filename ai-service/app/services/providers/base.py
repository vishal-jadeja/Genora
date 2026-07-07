from dataclasses import dataclass
from typing import Protocol


@dataclass
class CompletionResult:
    text: str
    prompt_tokens: int
    completion_tokens: int


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
