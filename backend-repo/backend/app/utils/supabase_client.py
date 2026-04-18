from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.utils.settings import get_settings


@lru_cache(maxsize=1)
def get_admin_supabase() -> Client:
    """
    Server-side Supabase client using the Service Role key.
    WARNING: Service Role bypasses RLS. Use user-scoped clients for protected data paths.
    """
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)


@lru_cache(maxsize=1)
def get_public_supabase() -> Client:
    """
    Public client (no JWT). Prefer using the anon key when available.
    """
    s = get_settings()
    key = s.supabase_anon_key or s.supabase_service_role_key
    return create_client(s.supabase_url, key)


def get_user_scoped_supabase(jwt: str) -> Client:
    """
    Creates a per-request Supabase client that sends the user's JWT to PostgREST,
    so RLS policies apply.
    """
    s = get_settings()
    key = s.supabase_anon_key or s.supabase_service_role_key
    return create_client(
        s.supabase_url,
        key,
        options={
            "headers": {
                "Authorization": f"Bearer {jwt}",
            }
        },
    )

