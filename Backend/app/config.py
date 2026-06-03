from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "BudgetCollab"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    DB_HOST: str = "127.0.0.1"
    DB_NAME: str = "budgetcollab"
    DB_USER: str = "root"
    DB_PASS: str = ""
    DB_URL: Optional[str] = None
    DB_DRIVER: str = "mysql"

    JWT_SECRET: str = "change_this_secret_key_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@budgetcollab.com"
    SMTP_FROM_NAME: str = "BudgetCollab"

    VOTE_THRESHOLD: float = 500.0
    VOTE_APPROVAL_PERCENT: float = 50.0

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost"

    @property
    def database_url(self) -> str:
        if self.DB_URL:
            return self.DB_URL
        if self.DB_DRIVER == "sqlite":
            return "sqlite:///./budgetcollab.db"
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}/{self.DB_NAME}?charset=utf8mb4"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
