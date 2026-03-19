from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://ai_contabil:ai_contabil_pass@localhost:5432/ai_contabil_db"
    JWT_SECRET_KEY: str = "dev-secret-key-schimba-in-productie"
    JWT_REFRESH_SECRET_KEY: str = "dev-refresh-key-schimba-in-productie"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 3777
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:8081"
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ENCRYPTION_KEY_DEFAULT: str = ""

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
