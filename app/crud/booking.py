from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from fastapi import HTTPException, APIRouter

from app.shemas.booking import BookingOutSchema, BookingCreateSchema
from app.crud.trip import crud_get_trip
from app.models.booking import Booking

router = APIRouter()


async def crud_create_booking(db: AsyncSession, trip_id: int, booking: BookingCreateSchema):
    db_trip = await crud_get_trip(db, trip_id)

    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if booking.seats_booked <= 0:
        raise HTTPException(status_code=400, detail="Invalid seats_booked")
    if db_trip.available_seats < booking.seats_booked:
        raise HTTPException(status_code=400, detail="Not enough seats available")

    db_booking = Booking(
        trip_id=trip_id,
        passenger_name=booking.passenger_name,
        passenger_phone=booking.passenger_phone,
        seats_booked=booking.seats_booked
    )

    try:
        db.add(db_booking)
        db_trip.available_seats -= booking.seats_booked
        db.add(db_trip)

    except IntegrityError:
        raise HTTPException(status_code=500, detail="Booking failed")

    await db.commit()
    await db.refresh(db_booking)

    return db_booking


async def crud_get_booking(db: AsyncSession, booking_id: int):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))

    return result.scalar_one_or_none()


async def crud_list_bookings_for_trip(db: AsyncSession, trip_id: int):
    result = await db.execute(select(Booking).where(Booking.trip_id == trip_id))
    return result.scalars().all()


async def crud_delete_booking(db: AsyncSession, booking_id: int):
    booking = await crud_get_booking(db, booking_id)

    if not booking:
        return False

    trip = await crud_get_trip(db, booking.trip_id)

    if not trip:
        return False

    trip.available_seats += booking.seats_booked

    await db.delete(booking)

    await db.commit()

    return booking
