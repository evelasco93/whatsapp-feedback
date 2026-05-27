from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "whatsapp-feedback-backend"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    cors_origins_raw: str = "*"

    mongodb_uri: str = Field(..., alias="MONGODB_URI")
    mongodb_db_name: str = Field("whatsapp_feedback", alias="MONGODB_DB_NAME")
    mongodb_collection_name: str = Field("mensajes", alias="MONGODB_COLLECTION_NAME")

    openai_api_key: str = Field("", alias="OPENAI_API_KEY")
    openai_model: str = Field("gpt-4.1-mini", alias="OPENAI_MODEL")

    validate_twilio_signature: bool = Field(False, alias="VALIDATE_TWILIO_SIGNATURE")
    twilio_auth_token: str = Field("", alias="TWILIO_AUTH_TOKEN")

    log_level: str = Field("INFO", alias="LOG_LEVEL")
    sse_retry_ms: int = Field(3000, alias="SSE_RETRY_MS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def cors_origins(self) -> list[str]:
        values = [origin.strip() for origin in self.cors_origins_raw.split(",")]
        return [origin for origin in values if origin]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
