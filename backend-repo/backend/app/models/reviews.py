from __future__ import annotations

from pydantic import BaseModel, Field
from uuid import UUID


class CreateReviewRequest(BaseModel):
    booking_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = None

