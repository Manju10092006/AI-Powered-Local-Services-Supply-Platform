from __future__ import annotations

from fastapi import APIRouter, Request

from app.models.reviews import CreateReviewRequest
from app.services.reviews_service import add_review
from app.utils.auth import require_user

router = APIRouter(tags=["reviews"])


@router.post("/review")
async def review_route(request: Request, body: CreateReviewRequest):
    _ = require_user(request)
    jwt = request.state.jwt
    return add_review(jwt=jwt, booking_id=str(body.booking_id), rating=body.rating, comment=body.comment)

