from __future__ import annotations

from fastapi import HTTPException, status

from app.utils.supabase_client import get_admin_supabase


def signup(email: str, password: str, name: str | None) -> dict:
    sb = get_admin_supabase()
    payload: dict = {"email": email, "password": password}
    if name:
        payload["options"] = {"data": {"name": name}}
    try:
        res = sb.auth.sign_up(payload)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return res.model_dump() if hasattr(res, "model_dump") else (res if isinstance(res, dict) else {"result": res})


def login(email: str, password: str) -> dict:
    sb = get_admin_supabase()
    try:
        res = sb.auth.sign_in_with_password({"email": email, "password": password})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials") from e
    return res.model_dump() if hasattr(res, "model_dump") else (res if isinstance(res, dict) else {"result": res})

