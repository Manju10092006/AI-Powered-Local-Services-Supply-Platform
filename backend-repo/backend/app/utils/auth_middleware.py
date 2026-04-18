from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from app.utils.auth import extract_bearer_token, verify_jwt_with_supabase


class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    """
    Attaches request.state.user when a valid Bearer JWT is present.
    Protected endpoints should still enforce auth (don't assume middleware always runs).
    """

    def __init__(self, app: ASGIApp, public_paths: set[str] | None = None) -> None:
        super().__init__(app)
        self.public_paths = public_paths or set()

    async def dispatch(self, request: Request, call_next):
        if request.url.path not in self.public_paths:
            token = extract_bearer_token(request)
            if token:
                request.state.jwt = token
                request.state.user = verify_jwt_with_supabase(token)
        return await call_next(request)

