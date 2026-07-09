import pytest

from app.core.config import Settings

_VALID_PROD_KWARGS = {
    "database_url": "postgres://user:pass@host/db",
    "gemini_api_key": "test-gemini-key",
}


def test_rejects_default_secret_outside_dev():
    with pytest.raises(ValueError, match="INTERNAL_SERVICE_SECRET"):
        Settings(
            env="production",
            internal_service_secret="dev-secret-change-me",
            **_VALID_PROD_KWARGS,
        )


def test_rejects_empty_secret_outside_dev():
    with pytest.raises(ValueError, match="INTERNAL_SERVICE_SECRET"):
        Settings(env="production", internal_service_secret="", **_VALID_PROD_KWARGS)


def test_accepts_real_secret_outside_dev():
    settings = Settings(
        env="production",
        internal_service_secret="a-real-secret",
        **_VALID_PROD_KWARGS,
    )
    assert settings.internal_service_secret == "a-real-secret"


def test_allows_default_secret_in_dev():
    settings = Settings(env="development", internal_service_secret="dev-secret-change-me")
    assert settings.internal_service_secret == "dev-secret-change-me"


def test_rejects_missing_database_url_outside_dev():
    with pytest.raises(ValueError, match="DATABASE_URL"):
        Settings(
            env="production",
            internal_service_secret="a-real-secret",
            database_url="",
            gemini_api_key="test-gemini-key",
        )


def test_rejects_missing_gemini_api_key_outside_dev():
    with pytest.raises(ValueError, match="GEMINI_API_KEY"):
        Settings(
            env="production",
            internal_service_secret="a-real-secret",
            database_url="postgres://user:pass@host/db",
            gemini_api_key="",
        )


def test_allows_missing_database_url_and_gemini_key_in_dev():
    # Doesn't raise even with both explicitly blanked out, unlike outside dev.
    settings = Settings(
        env="development",
        internal_service_secret="dev-secret-change-me",
        database_url="",
        gemini_api_key="",
    )
    assert settings.database_url == ""
    assert settings.gemini_api_key == ""
