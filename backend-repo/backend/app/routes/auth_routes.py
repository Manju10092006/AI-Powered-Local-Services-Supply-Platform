from __future__ import annotations

from fastapi import APIRouter

from app.models.auth import LoginRequest, SignupRequest
from app.services.auth_service import login, signup

router = APIRouter(tags=["auth"])


@router.post("/signup")
async def signup_route(body: SignupRequest):
    return signup(email=body.email, password=body.password, name=body.name)


@router.post("/login")
async def login_route(body: LoginRequest):
    return login(email=body.email, password=body.password)

