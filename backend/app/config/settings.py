from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Virtual Try-On API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tryon_db"
    
    # Security
    SECRET_KEY: str = "supersecretkey" # In production, use env variable
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
