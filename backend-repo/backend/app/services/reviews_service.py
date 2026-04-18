from __future__ import annotations

from fastapi import HTTPException, status

from app.utils.supabase_client import get_user_scoped_supabase


def add_review(jwt: str, booking_id: str, rating: int, comment: str | None) -> dict:
    sb = get_user_scoped_supabase(jwt)
    payload: dict = {"booking_id": booking_id, "rating": rating}
    if comment is not None:
        payload["comment"] = comment

    try:
        res = sb.table("reviews").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    data = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None)
    if isinstance(data, list) and data:
        return data[0]
    if isinstance(data, dict):
        return data
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to add review")

