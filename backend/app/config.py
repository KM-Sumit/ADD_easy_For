from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "InstaPilot AI"
    SECRET_KEY: str = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_MIN_32_CHARS"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./instapilot.db"

    # Meta / Instagram OAuth
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_REDIRECT_URI: str = "http://localhost:8000/integrations/instagram/callback"
    META_API_VERSION: str = "v20.0"

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:5173"

    # Upload directory
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
