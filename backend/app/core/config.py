from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5433/piscinaqr"
    SECRET_KEY: str = "supersecretkeyquecambiarproduccion"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:3001"
    BACKEND_PORT: int = 8001

    class Config:
        env_file = ".env"


settings = Settings()
