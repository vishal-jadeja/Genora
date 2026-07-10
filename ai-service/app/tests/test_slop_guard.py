from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.schemas.slop_guard import SlopGuardVerdict
from app.services.slop_guard import evaluate_slop_guard

client = TestClient(app)
AUTH_HEADERS = {"x-internal-secret": settings.internal_service_secret}

GENUINE_THOUGHT = (
    "shipped a feature nobody asked for and it somehow became our most-used one. "
    "building for yourself is underrated."
)


def test_rejects_empty_input():
    result = evaluate_slop_guard("   ")
    assert result.verdict == SlopGuardVerdict.HARD_REJECT


def test_rejects_too_short():
    result = evaluate_slop_guard("not enough")
    assert result.verdict == SlopGuardVerdict.HARD_REJECT


def test_rejects_digits_only():
    result = evaluate_slop_guard("1234567890 1234567890 1234567890")
    assert result.verdict == SlopGuardVerdict.HARD_REJECT
    assert "no readable words" in result.reason


def test_rejects_keyboard_mash():
    result = evaluate_slop_guard("asdkjasdkjasdkjasdkjasdkjasdkj")
    assert result.verdict == SlopGuardVerdict.HARD_REJECT
    assert "keyboard mashing" in result.reason


def test_rejects_single_word_repetition():
    result = evaluate_slop_guard("test test test test test test test test")
    assert result.verdict == SlopGuardVerdict.HARD_REJECT
    assert "repeated throughout" in result.reason


def test_soft_nudges_heavy_repetition_short_of_reject_threshold():
    # "great" is 4/11 words (~0.36): above the 0.35 soft-nudge line, below the 0.6 reject line.
    result = evaluate_slop_guard("great news everyone great day great work great team keep going")
    assert result.verdict == SlopGuardVerdict.SOFT_NUDGE
    assert "great" in result.reason


def test_rejects_few_long_repeated_words_past_the_char_floor():
    # Regression test: 4 words is long enough in total characters (67) to
    # clear the soft-nudge char floor, but previously fell under the old
    # word-count-based gate (>= 5 words) for even running the repetition
    # check at all, so this used to slip through as PASS.
    result = evaluate_slop_guard(
        "circumnavigation circumnavigation circumnavigation circumnavigation"
    )
    assert result.verdict == SlopGuardVerdict.HARD_REJECT
    assert "repeated throughout" in result.reason


def test_does_not_flag_ordinary_short_text_as_repetitive():
    # A short, ordinary phrase with no real repetition shouldn't get flagged
    # just because a small word count makes one word's share of the total
    # look statistically high (e.g. "great" at 1/2 = 0.5).
    result = evaluate_slop_guard(
        "great job everyone, that was a genuinely solid piece of effort today"
    )
    assert result.verdict == SlopGuardVerdict.PASS


def test_soft_nudges_thin_input():
    result = evaluate_slop_guard("had a decent idea about onboarding today, might explore it")
    assert result.verdict == SlopGuardVerdict.SOFT_NUDGE


def test_passes_genuine_substance():
    result = evaluate_slop_guard(GENUINE_THOUGHT)
    assert result.verdict == SlopGuardVerdict.PASS


def test_accepts_cyrillic_input():
    result = evaluate_slop_guard(
        "Сегодня я запустил новую функцию, которую никто не просил, "
        "и она внезапно стала самой популярной частью продукта."
    )
    assert result.verdict == SlopGuardVerdict.PASS


def test_accepts_accented_latin_input():
    result = evaluate_slop_guard(
        "J'ai créé une fonctionnalité très útil, ñoño mais über cool, "
        "et personne ne l'avait demandée au départ."
    )
    assert result.verdict == SlopGuardVerdict.PASS
    assert "no readable words" not in result.reason


def test_accepts_arabic_input():
    result = evaluate_slop_guard(
        "أطلقت ميزة جديدة لم يطلبها أحد وأصبحت الأكثر استخدامًا في "
        "التطبيق بأكمله خلال أسابيع قليلة فقط"
    )
    assert result.verdict == SlopGuardVerdict.PASS


def test_still_hard_rejects_short_non_ascii_input():
    result = evaluate_slop_guard("Привет всем")
    assert result.verdict == SlopGuardVerdict.HARD_REJECT
    assert "too short" in result.reason


def test_endpoint_requires_internal_secret():
    response = client.post("/slop-guard", json={"raw_text": GENUINE_THOUGHT})
    assert response.status_code == 401


def test_endpoint_returns_verdict():
    response = client.post("/slop-guard", json={"raw_text": GENUINE_THOUGHT}, headers=AUTH_HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "pass"


def test_endpoint_rejects_empty_body_field():
    response = client.post("/slop-guard", json={"raw_text": ""}, headers=AUTH_HEADERS)
    assert response.status_code == 422
