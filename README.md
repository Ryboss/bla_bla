# Trip Booking Service (FastAPI)

Simple FastAPI project providing Trip and Booking models, CRUD, and endpoints.

Run locally:

```bash
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

Endpoints:
- `POST /trips` create trip
- `GET /trips` list trips
- `GET /trips/{id}` get trip
- `PUT /trips/{id}` update trip
- `DELETE /trips/{id}` delete trip
- `POST /trips/{trip_id}/bookings` create booking
- `GET /bookings/{id}` get booking
- `GET /trips/{trip_id}/bookings` list bookings for trip
