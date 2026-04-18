from __future__ import annotations

from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_env: str = "dev"
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str | None = None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    load_dotenv()
    return Settings(
        app_env=os.getenv("APP_ENV", "dev"),
        supabase_url=os.environ["SUPABASE_URL"],
        supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY") or None,
    )

