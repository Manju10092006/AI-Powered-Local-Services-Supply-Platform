from __future__ import annotations

from fastapi import HTTPException, status

from app.utils.supabase_client import get_public_supabase, get_user_scoped_supabase


def list_workers(jwt: str | None) -> list[dict]:
    # Public endpoint by RLS; if JWT is present we still pass it through.
    sb = get_user_scoped_supabase(jwt) if jwt else get_public_supabase()
    try:
        res = sb.table("workers").select("*").execute()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else []) or []

