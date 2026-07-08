import pytest

from app.core.config import Settings


def test_rejects_default_secret_outside_dev():
    with pytest.raises(ValueError, match="INTERNAL_SERVICE_SECRET"):
        Settings(env="production", internal_service_secret="dev-secret-change-me")


def test_rejects_empty_secret_outside_dev():
    with pytest.raises(ValueError, match="INTERNAL_SERVICE_SECRET"):
        Settings(env="production", internal_service_secret="")


def test_accepts_real_secret_outside_dev():
    settings = Settings(env="production", internal_service_secret="a-real-secret")
    assert settings.internal_service_secret == "a-real-secret"


def test_allows_default_secret_in_dev():
    settings = Settings(env="development", internal_service_secret="dev-secret-change-me")
    assert settings.internal_service_secret == "dev-secret-change-me"
