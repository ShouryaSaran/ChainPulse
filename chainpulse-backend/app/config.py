import os
from dotenv import load_dotenv
from pydantic import BaseModel
 
load_dotenv()
 
 
def _to_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}
 
 
class Settings(BaseModel):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/chainpulse"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    OPENROUTE_API_KEY: str = os.getenv("OPENROUTE_API_KEY", "")
    DEBUG: bool = _to_bool(os.getenv("DEBUG", "false"))
 
 
settings = Settings()