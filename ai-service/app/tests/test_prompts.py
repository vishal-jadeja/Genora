from app.services.pipeline.prompts import (
    build_critic_prompt,
    build_reviser_prompt,
    build_writer_prompt,
    parse_critic_response,
)


def test_build_writer_prompt_includes_platform_brief_and_raw_text_as_user_turn():
    system, user = build_writer_prompt("shipped a small feature today", "linkedin", "", [])

    assert "LinkedIn" in system
    assert user == "shipped a small feature today"


def test_build_writer_prompt_includes_custom_instructions_and_rag_context():
    system, _ = build_writer_prompt(
        "a thought", "x", "always end with a question", ["old post one", "old post two"]
    )

    assert "always end with a question" in system
    assert "old post one" in system
    assert "old post two" in system
    assert "do not copy content" in system


def test_build_writer_prompt_omits_rag_section_when_empty():
    system, _ = build_writer_prompt("a thought", "x", "", [])

    assert "Reference only for voice" not in system


def test_build_critic_prompt_demands_json_and_carries_the_draft():
    system, user = build_critic_prompt("a finished draft", "reddit", "")

    assert "JSON" in system
    assert user == "a finished draft"


def test_build_reviser_prompt_carries_draft_and_feedback():
    _, user = build_reviser_prompt("old draft", "too salesy", "medium", "")

    assert "old draft" in user
    assert "too salesy" in user


def test_parse_critic_response_reads_plain_json():
    verdict = parse_critic_response('{"approved": true, "feedback": ""}')

    assert verdict.approved is True
    assert verdict.feedback == ""


def test_parse_critic_response_strips_markdown_fences():
    verdict = parse_critic_response('```json\n{"approved": false, "feedback": "too generic"}\n```')

    assert verdict.approved is False
    assert verdict.feedback == "too generic"


def test_parse_critic_response_falls_back_to_not_approved_on_malformed_json():
    verdict = parse_critic_response("the model just rambled instead of returning JSON")

    assert verdict.approved is False
    assert verdict.feedback == "the model just rambled instead of returning JSON"


def test_parse_critic_response_defaults_missing_fields():
    verdict = parse_critic_response("{}")

    assert verdict.approved is False
    assert verdict.feedback == ""
