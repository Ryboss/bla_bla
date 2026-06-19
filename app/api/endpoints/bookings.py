from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException
from app.shemas.booking import BookingBaseSchema, BookingCreateSchema, BookingOutSchema
from app.crud.booking import crud_get_booking, crud_create_booking, crud_list_bookings_for_trip, crud_delete_booking
from app.crud.trip import crud_get_trip, crud_create_trip
from app.database.database import get_db


router = APIRouter()

@router.post("/trips/{trip_id}/bookings", response_model=BookingOutSchema)
async def create_booking(trip_id: int, booking: BookingCreateSchema, db: AsyncSession = Depends(get_db)):
    return await crud_create_booking(db, trip_id, booking)


@router.get("/bookings/{booking_id}", response_model=BookingOutSchema)
async def get_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    db_booking = await crud_get_booking(db, booking_id)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return db_booking


@router.get("/trips/{trip_id}/bookings", response_model=list[BookingOutSchema])
async def list_bookings(trip_id: int, db: AsyncSession = Depends(get_db)):
    if not await crud_get_trip(db, trip_id):
        raise HTTPException(status_code=404, detail="Trip not found")
    return await crud_list_bookings_for_trip(db, trip_id)


@router.delete("/trips/bookings/{booking_id}", response_model=BookingOutSchema | bool)
async def delete_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    if not await crud_get_booking(db, booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return await crud_delete_booking(db, booking_id)