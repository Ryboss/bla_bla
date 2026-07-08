from pydantic import BaseModel, Field
from datetime import datetime, timezone
from pydantic import field_validator
from fastapi_filter.contrib.sqlalchemy import Filter

from app.models.trip import Trip


class TripBaseSchema(BaseModel):
    departure_city: str
    arrival_city: str

    departure_time: datetime
    arrival_time: datetime

    price: float = Field(default=None, gt=0)

    available_seats: int


class TripCreateSchema(TripBaseSchema):
    @field_validator("departure_time", "arrival_time")
    @classmethod
    def remove_timezone(cls, value: datetime):
        now = datetime.now(timezone.utc)

        if value < now:
            raise ValueError(
                "Departure and arrival times cannot be earlier than the current time"
            )
        return value


class TripUpdateSchema(TripCreateSchema):
    departure_city: str | None = None
    arrival_city: str | None = None

    departure_time: datetime | None = None
    arrival_time: datetime | None = None

    price: float | None = None

    available_seats: int | None

    created_at: datetime | None = None


class TripOutSchema(TripBaseSchema):
    id: int

    class Config:
        orm_mode = True


class TripFilterSchema(Filter):
    departure_city: str | None = None
    arrival_city: str | None = None

    price__gte: float | None = None
    price__lte: float | None = None

    available_seats__gte: int | None = None
    available_seats__lte: int | None = None

    departure_time__gte: datetime | None = None
    departure_time__lte: datetime | None = None

    arrival_time__gte: datetime | None = None
    arrival_time__lte: datetime | None = None

    class Constants(Filter.Constants):
        model = Trip