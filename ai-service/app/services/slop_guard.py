import re
from collections import Counter

from app.schemas.slop_guard import SlopGuardResult, SlopGuardVerdict

# Below this many stripped characters there isn't enough raw material to write
# a platform post from, regardless of what it says.
_HARD_REJECT_MIN_CHARS = 15

# Below this, generation is possible but the output will be thin/generic.
_SOFT_NUDGE_MIN_CHARS = 60

# A single unbroken word-token this long almost never occurs in real prose
# (the longest common English words top out around 20 chars) — it's a much
# more reliable "not a real word" signal than vowel ratio, which is easily
# fooled by short repeated fake syllables ("asdkjasdkj..."). Known false
# positive: a long camelCase hashtag with no spaces would also trip this.
_MASH_MIN_TOKEN_CHARS = 22

# Share of all word tokens a single repeated word can take up before the
# input is judged to have no real substance ("test test test test test").
_HARD_REJECT_REPETITION_RATIO = 0.6
_SOFT_NUDGE_REPETITION_RATIO = 0.35
_REPETITION_MIN_WORDS = 5

_WORD_RE = re.compile(r"[A-Za-z']+")


def evaluate_slop_guard(raw_text: str) -> SlopGuardResult:
    """Heuristic pre-generation substance check.

    Deliberately dependency-free and synchronous: this gate runs on every
    generate request before any paid model call, so it needs to be instant
    and free. It only catches unambiguous low-effort input (empty, too
    short, gibberish, single-word repetition) — it does not judge writing
    quality, which is what the Writer/Critic/Reviser pipeline is for.
    """
    stripped = raw_text.strip()

    if not stripped:
        return SlopGuardResult(verdict=SlopGuardVerdict.HARD_REJECT, reason="input is empty")

    if len(stripped) < _HARD_REJECT_MIN_CHARS:
        return SlopGuardResult(
            verdict=SlopGuardVerdict.HARD_REJECT,
            reason="too short to generate a meaningful post from",
        )

    words = _WORD_RE.findall(stripped)
    if not words:
        return SlopGuardResult(
            verdict=SlopGuardVerdict.HARD_REJECT, reason="no readable words detected"
        )

    if any(len(word) >= _MASH_MIN_TOKEN_CHARS for word in words):
        return SlopGuardResult(
            verdict=SlopGuardVerdict.HARD_REJECT,
            reason="looks like keyboard mashing rather than real words",
        )

    if len(words) >= _REPETITION_MIN_WORDS:
        top_word, top_count = Counter(w.lower() for w in words).most_common(1)[0]
        repetition_ratio = top_count / len(words)
        if repetition_ratio > _HARD_REJECT_REPETITION_RATIO:
            return SlopGuardResult(
                verdict=SlopGuardVerdict.HARD_REJECT,
                reason=f'"{top_word}" repeated throughout — no real substance to work with',
            )
        if repetition_ratio > _SOFT_NUDGE_REPETITION_RATIO:
            return SlopGuardResult(
                verdict=SlopGuardVerdict.SOFT_NUDGE,
                reason=f'leans heavily on repeating "{top_word}" — some variety would help',
            )

    if len(stripped) < _SOFT_NUDGE_MIN_CHARS:
        return SlopGuardResult(
            verdict=SlopGuardVerdict.SOFT_NUDGE,
            reason="a bit thin — a little more detail will make for a stronger post",
        )

    return SlopGuardResult(verdict=SlopGuardVerdict.PASS, reason="reads like genuine substance")
