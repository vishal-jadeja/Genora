from pydantic import model_validator
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

    @model_validator(mode="after")
    def _require_real_secret_outside_dev(self) -> "Settings":
        if self.env != "development" and (
            not self.internal_service_secret
            or self.internal_service_secret == "dev-secret-change-me"
        ):
            raise ValueError(
                "INTERNAL_SERVICE_SECRET must be set to a real value when ENV is "
                "not 'development' — refusing to start with the public default "
                "secret."
            )
        return self

    @model_validator(mode="after")
    def _require_database_url_and_gemini_key_outside_dev(self) -> "Settings":
        # A missing value here would otherwise only surface as an opaque
        # asyncpg/Gemini error the first time something tries to use it —
        # fail fast at startup instead, same as the secret check above.
        if self.env != "development":
            if not self.database_url:
                raise ValueError("DATABASE_URL must be set when ENV is not 'development'.")
            if not self.gemini_api_key:
                raise ValueError("GEMINI_API_KEY must be set when ENV is not 'development'.")
        return self


settings = Settings()
