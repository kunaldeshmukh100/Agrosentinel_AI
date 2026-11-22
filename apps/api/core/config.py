from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "AgroSentinel AI"
    debug: bool = False
    database_url: str = "sqlite:///./agrosentinel.db"
    secret_key: str = "agrosentinel-dev-secret-change-in-production"
    image_upload_dir: str = "./uploads"
    max_image_size_mb: int = 5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

@lru_cache()
def get_settings():
    return Settings()
