from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from pydantic import field_validator


class TripBaseSchema(BaseModel):
    departure_city: str
    arrival_city: str

    departure_time: datetime
    arrival_time: datetime

    price: float

    available_seats: int

    @field_validator("departure_time", "arrival_time")
    @classmethod
    def remove_timezone(cls, value: datetime):
        if value.tzinfo is not None:
            return value.replace(tzinfo=None)
        return value


class TripCreateSchema(TripBaseSchema):
    pass


class TripUpdateSchema(BaseModel):
    departure_city: str | None = None
    arrival_city: str | None = None

    departure_time: datetime | None = None
    arrival_time: datetime | None = None

    price: float | None = None

    available_seats: int | None = None

    created_at: datetime | None = None


class TripFilterSchema(TripUpdateSchema):
    pass


class TripOutSchema(TripBaseSchema):
    id: int
    class Config:
        orm_mode = True