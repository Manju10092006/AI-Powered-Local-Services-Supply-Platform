from __future__ import annotations

from fastapi import HTTPException, status

from app.utils.supabase_client import get_user_scoped_supabase


def create_booking(jwt: str, customer_id: str, worker_id: str, price: float) -> dict:
    sb = get_user_scoped_supabase(jwt)
    try:
        res = (
            sb.table("bookings")
            .insert(
                {
                    "customer_id": customer_id,
                    "worker_id": worker_id,
                    "price": price,
                    "status": "pending",
                }
            )
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    data = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None)
    if isinstance(data, list) and data:
        return data[0]
    if isinstance(data, dict):
        return data
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create booking")

