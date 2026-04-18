from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

