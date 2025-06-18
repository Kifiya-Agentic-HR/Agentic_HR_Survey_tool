# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')
    
    MONGO_URI: str
    MONGO_DB: str
    REDIS_URI: str
    OPENAI_API_KEY: str
    MODEL: str
    MAX_CONVERSATION_HISTORY: int = 6
    NOTIFICATION_SERVICE_URL: str
    FRONTEND_BASE_URL: str

def get_settings():
    try:
        return Settings()
    except ValidationError as e:
        logger.error("Configuration error: %s", e.json())
        raise