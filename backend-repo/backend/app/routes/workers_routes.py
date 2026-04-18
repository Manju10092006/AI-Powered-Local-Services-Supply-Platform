from __future__ import annotations

from fastapi import APIRouter, Request

from app.services.workers_service import list_workers
from app.utils.auth import extract_bearer_token

router = APIRouter(tags=["workers"])


@router.get("/workers")
async def workers_route(request: Request):
    jwt = extract_bearer_token(request)
    return list_workers(jwt)

