import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.trip import (
    crud_create_trip,
    crud_list_trips,
    crud_get_trip,
    crud_update_trip,
    crud_delete_trip,
    crud_filtered_trips
)
from app.shemas.trip import TripCreateSchema, TripOutSchema, TripUpdateSchema, TripFilterSchema
from app.crud.booking import crud_list_bookings_for_trip
from app.database.database import get_db


router = APIRouter()


@router.post("/get_user", response_model=TripOutSchema)
async def get_user(db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://blabla2-jybi.onrender.com/auth/register",
            json={
                "email": "amir@example.com",
                "password": "StrongPassword123",
                "fullName": "Amir Ivanov",
                "phone": "+79991234567"
            }
        )
        return response.json()
