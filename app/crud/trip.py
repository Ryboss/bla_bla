from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.shemas.trip import TripCreateSchema, TripUpdateSchema, TripOutSchema, TripFilterSchema
from app.models.trip import Trip

async def crud_create_trip(db: AsyncSession, trip: TripCreateSchema):
    db_trip = Trip(
        departure_city=trip.departure_city,
        arrival_city=trip.arrival_city,
        departure_time=trip.departure_time,
        arrival_time=trip.arrival_time,
        price=trip.price,
        available_seats=trip.available_seats,
    )
    db.add(db_trip)
    await db.commit()
    await db.refresh(db_trip)
    return db_trip


async def crud_get_trip(db: AsyncSession, trip_id: int):
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    return result.scalar_one_or_none()


async def crud_list_trips(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Trip).offset(skip).limit(limit))
    return result.scalars().all()


async def crud_update_trip(db: AsyncSession, trip_id: int, updates: TripUpdateSchema):
    db_trip = await crud_get_trip(db, trip_id)

    if not db_trip:
        return None

    data = updates.dict(exclude_unset=True)

    for field, value in data.items():
        setattr(db_trip, field, value)

    if "seats_total" in data:
        db_trip.seats_available = min(db_trip.seats_available, db_trip.seats_total)

    db.add(db_trip)
    await db.commit()
    await db.refresh(db_trip)

    return db_trip


async def crud_delete_trip(db: AsyncSession, trip_id: int):
    db_trip = await crud_get_trip(db, trip_id)

    if not db_trip:
        return False

    await db.delete(db_trip)
    await db.commit()
    return True


async def crud_filtered_trips(db: AsyncSession, filters: TripFilterSchema, skip: int = 0, limit: int = 100):
    query = filters.filter(select(Trip))

    result = await db.execute(query)
    return result.scalars().all()