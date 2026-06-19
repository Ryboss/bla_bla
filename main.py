from fastapi import FastAPI
from app.api.endpoints import bookings, trips, users
from app.database.database import Base, engine
import uvicorn


def create_app() -> FastAPI:
    app = FastAPI(title="Trip Booking Service", docs_url="/docs")

    app.include_router(trips.router, prefix="/trips", tags=["trips"])
    app.include_router(bookings.router, prefix="", tags=["bookings"])
    app.include_router(users.router, prefix="", tags=["users"])

    return app


app = create_app()

# Create DB tables on startup (for simple demo)
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
