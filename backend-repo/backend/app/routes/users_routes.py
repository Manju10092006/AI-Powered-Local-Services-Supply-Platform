from __future__ import annotations

from fastapi import APIRouter, Request

from app.services.users_service import get_me
from app.utils.auth import require_user

router = APIRouter(tags=["users"])


@router.get("/me")
async def me_route(request: Request):
    _ = require_user(request)
    jwt = request.state.jwt
    return get_me(jwt)

