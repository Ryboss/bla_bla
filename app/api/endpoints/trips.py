from fastapi import APIRouter, Depends, HTTPException
from app.crud.trip import (
    crud_create_trip,
    crud_list_trips,
    crud_get_trip,
    crud_update_trip,
    crud_delete_trip,
    crud_filtered_trips
)
from app.shemas.trip import TripCreateSchema, TripOutSchema, TripUpdateSchema, TripFilterSchema
from app.database.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


@router.post("/", response_model=TripOutSchema)
async def create_trip(trip: TripCreateSchema, db: AsyncSession = Depends(get_db)):
    return await crud_create_trip(db, trip)


@router.get("/", response_model=list[TripOutSchema])
async def list_trips(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    trips = await crud_list_trips(db, skip, limit)
    return trips


@router.get("/{trip_id}", response_model=TripOutSchema)
async def get_trip(trip_id: int, db: AsyncSession = Depends(get_db)):
    db_trip = await crud_get_trip(db, trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return db_trip


@router.put("/{trip_id}", response_model=TripOutSchema)
async def update_trip(trip_id: int, updates: TripUpdateSchema, db: AsyncSession = Depends(get_db)):
    db_trip = await crud_update_trip(db, trip_id, updates)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return db_trip


@router.delete("/{trip_id}", status_code=204)
async def delete_trip(trip_id: int, db: AsyncSession = Depends(get_db)):
    ok = await crud_delete_trip(db, trip_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Trip not found")
    return None


@router.post("/filter", status_code=200)
async def filtered_trips(filters: TripFilterSchema, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await crud_filtered_trips(db, filters, skip, limit)
    # ok = await crud_delete_trip(db, trip_id)
    # if not ok:
    #     raise HTTPException(status_code=404, detail="Trip not found")
    # return None