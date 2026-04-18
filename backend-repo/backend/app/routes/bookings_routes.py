from __future__ import annotations

from fastapi import APIRouter, Request

from app.models.bookings import CreateBookingRequest
from app.services.bookings_service import create_booking
from app.utils.auth import require_user

router = APIRouter(tags=["bookings"])


@router.post("/create-booking")
async def create_booking_route(request: Request, body: CreateBookingRequest):
    user = require_user(request)
    jwt = request.state.jwt
    return create_booking(jwt=jwt, customer_id=user.id, worker_id=str(body.worker_id), price=float(body.price))

