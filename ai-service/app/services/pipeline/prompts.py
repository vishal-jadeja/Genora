import json
import re
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

_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


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
    """Parses the critic's JSON verdict, tolerating markdown fences around it.

    Falls back to "not approved, raw text as feedback" on any parse failure
    rather than raising — a malformed critic response should push the draft
    through another revision round, not crash the pipeline. The revision cap
    in the orchestrator bounds how many times that fallback can loop.
    """
    match = _JSON_OBJECT_RE.search(text)
    if match is None:
        return CriticVerdict(approved=False, feedback=text.strip())
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return CriticVerdict(approved=False, feedback=text.strip())
    return CriticVerdict(
        approved=bool(data.get("approved", False)), feedback=str(data.get("feedback", ""))
    )
