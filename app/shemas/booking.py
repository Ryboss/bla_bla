from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BookingBaseSchema(BaseModel):
    passenger_name: str
    passenger_phone: str

    seats_booked: int

    comment: Optional[str] = None


class BookingCreateSchema(BookingBaseSchema):
    pass

class BookingOutSchema(BookingBaseSchema):
    id: int
    trip_id: int
    booked_at: datetime
    class Config:
        orm_mode = True

class BookingUpdateSchema(BaseModel):
    passenger_name: Optional[str] = None
    passenger_surname: Optional[str] = None
    passenger_email: Optional[str] = None
    passenger_phone: Optional[str] = None

    seats_booked: Optional[int] = None
    comment: Optional[str] = None