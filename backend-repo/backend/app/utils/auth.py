from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, Request, status

from app.utils.supabase_client import get_admin_supabase


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None
    raw: dict[str, Any]


def extract_bearer_token(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth:
        return None
    parts = auth.split(" ", 1)
    if len(parts) != 2:
        return None
    scheme, token = parts[0].strip(), parts[1].strip()
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def verify_jwt_with_supabase(jwt: str) -> AuthUser:
    """
    Verifies the JWT by asking Supabase Auth to decode/validate it.
    We do NOT generate JWTs; we only verify and trust Supabase.
    """
    admin = get_admin_supabase()
    try:
        res = admin.auth.get_user(jwt)
    except Exception as e:  # supabase-py raises generic exceptions
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e

    user = getattr(res, "user", None) or (res.get("user") if isinstance(res, dict) else None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    # Handle both object-like and dict-like payloads
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    email = getattr(user, "email", None) or (user.get("email") if isinstance(user, dict) else None)
    raw = user if isinstance(user, dict) else getattr(user, "__dict__", {}) or {}

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return AuthUser(id=str(user_id), email=email, raw=raw)


def require_user(request: Request) -> AuthUser:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user

