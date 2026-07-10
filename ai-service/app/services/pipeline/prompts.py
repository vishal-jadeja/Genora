import json
from dataclasses import dataclass

# Baseline tone/format framing per platform. Always applied underneath the
# author's own per-platform instructions (platform_instructions table) —
# not a replacement for them, just a sane default when they're empty.
_PLATFORM_BRIEFS = {
    "linkedin": (
        "LinkedIn post: professional but personable, short paragraphs, a real hook in the "
        "first line, no hashtag spam."
    ),
    "x": "X (Twitter) post: concise and punchy, under 280 characters, no corporate voice.",
    "reddit": ("Reddit post: conversational, no marketing tone, gets straight to substance."),
    "medium": (
        "Medium article: longer-form and narrative, subheadings are fine, more reflective tone."
    ),
    "substack": (
        "Substack newsletter: personal, direct-to-reader voice — like writing to a friend "
        "who subscribed."
    ),
}


def _platform_context(platform: str, platform_instructions: str) -> str:
    parts = [_PLATFORM_BRIEFS[platform]]
    if platform_instructions.strip():
        parts.append(
            f"Author's specific instructions for this platform: {platform_instructions.strip()}"
        )
    return "\n\n".join(parts)


def build_writer_prompt(
    raw_text: str, platform: str, platform_instructions: str, rag_context: list[str]
) -> tuple[str, str]:
    context = _platform_context(platform, platform_instructions)
    if rag_context:
        joined = "\n---\n".join(rag_context)
        context += (
            "\n\nReference only for voice and style — do not copy content from these past "
            f"posts:\n{joined}"
        )
    system = (
        "You are a ghostwriter turning a single raw thought into one platform-native post. "
        "Preserve the author's actual voice and point of view — do not flatten it into generic "
        "marketing copy. Output only the finished post text, nothing else.\n\n" + context
    )
    return system, raw_text


_CRITIC_INSTRUCTIONS = (
    "You are a tough editor reviewing a draft post before it ships. Judge it against: does it "
    "sound like a real person and not AI-generated slop; does it fit the platform and "
    "instructions; is it free of filler and hedging. Respond with ONLY a JSON object, no other "
    'text, in exactly this shape: {"approved": true or false, "feedback": "specific actionable '
    'feedback, or empty string if approved"}.'
)


def build_critic_prompt(draft: str, platform: str, platform_instructions: str) -> tuple[str, str]:
    system = _CRITIC_INSTRUCTIONS + "\n\n" + _platform_context(platform, platform_instructions)
    return system, draft


def build_reviser_prompt(
    draft: str, feedback: str, platform: str, platform_instructions: str
) -> tuple[str, str]:
    system = (
        "You are revising a draft post based on editor feedback. Apply the feedback precisely "
        "while keeping everything else that already works. Output only the finished revised "
        "post text, nothing else.\n\n" + _platform_context(platform, platform_instructions)
    )
    user = f"Draft:\n{draft}\n\nEditor feedback to address:\n{feedback}"
    return system, user


@dataclass
class CriticVerdict:
    approved: bool
    feedback: str


def parse_critic_response(text: str) -> CriticVerdict:
    """Parses the critic's JSON verdict, tolerating markdown fences and any
    chatter the model adds before/after the JSON object.

    Tries `json.loads` from every `{` in the text (via `raw_decode`, which
    parses just the one JSON value starting there and ignores whatever
    follows) and accepts the first one that parses as an object. This is
    deliberately not a greedy regex spanning the whole response: a naive
    `\\{.*\\}` match anchored on the *last* `}` in the text would swallow
    trailing chatter that happens to contain a brace (e.g. "...Sounds good!
    Let me know if you want tweaks like {this}.") and fail to parse, silently
    downgrading a real approval into a rejection.

    Falls back to "not approved, raw text as feedback" if no candidate
    parses — a malformed critic response should push the draft through
    another revision round, not crash the pipeline. The revision cap in the
    orchestrator bounds how many times that fallback can loop.
    """
    decoder = json.JSONDecoder()
    idx = text.find("{")
    while idx != -1:
        try:
            data, _ = decoder.raw_decode(text, idx)
        except json.JSONDecodeError:
            idx = text.find("{", idx + 1)
            continue
        if isinstance(data, dict):
            return CriticVerdict(
                approved=bool(data.get("approved", False)), feedback=str(data.get("feedback", ""))
            )
        idx = text.find("{", idx + 1)
    return CriticVerdict(approved=False, feedback=text.strip())
