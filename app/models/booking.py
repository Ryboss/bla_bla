from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database.database import Base
import datetime

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    seats_booked = Column(Integer, nullable=False)
    booked_at = Column(DateTime(timezone=False), default=datetime.datetime.utcnow)
    trip = relationship("Trip", back_populates="bookings")

    passenger_name = Column("Имя пассажира", String, nullable=False)
    passenger_phone = Column("Телефон пассажира", String, nullable=False)

    seats_booked = Column("Кол-во забронированных мест", Integer, nullable=False)

    created_at = Column(DateTime(timezone=False), default=datetime.datetime.utcnow)
