from __future__ import annotations

from pydantic import BaseModel, Field
from uuid import UUID


class CreateBookingRequest(BaseModel):
    worker_id: UUID
    price: float = Field(ge=0)

