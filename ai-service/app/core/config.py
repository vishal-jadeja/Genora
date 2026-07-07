from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "development"
    internal_service_secret: str = "dev-secret-change-me"
    database_url: str = ""
    # Platform-owned key, independent of a user's BYOK provider choice — keeps
    # embedding dimensions fixed at 768 regardless of which model a user
    # picks for generation (see backend-plan.md).
    gemini_api_key: str = ""


settings = Settings()
