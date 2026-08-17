from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Virtual Try-On API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tryon_db"

    # Security
    # WARNING: Override SECRET_KEY in .env for production.
    # Generate a strong key with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "supersecretkey-change-me-in-production-env-file"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI
    GEMINI_API_KEY: str = ""

    # File uploads
    MAX_UPLOAD_SIZE_MB: int = 10  # Maximum Excel upload size in MB

    # Base URL for serving static files (overridable in production)
    BASE_URL: str = "http://127.0.0.1:8000"

    # CORS — override in .env with a comma-separated list of allowed origins.
    # Example: ALLOWED_ORIGINS=["https://app.tryon.com","https://www.tryon.com"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters long. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
