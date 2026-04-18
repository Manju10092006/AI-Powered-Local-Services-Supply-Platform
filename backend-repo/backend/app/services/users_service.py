from __future__ import annotations

from fastapi import HTTPException, status

from app.utils.supabase_client import get_user_scoped_supabase


def get_me(jwt: str) -> dict:
    sb = get_user_scoped_supabase(jwt)
    try:
        res = sb.table("users").select("*").single().execute()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    data = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return data

