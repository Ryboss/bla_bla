from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database.database import Base
import datetime

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    seats_booked = Column(Integer, comment="Число бронируемых мест", nullable=False)
    booked_at = Column(DateTime(timezone=False), default=datetime.datetime.utcnow)
    trip = relationship("Trip", back_populates="bookings")

    passenger_name = Column(String, comment="Имя пассажира", nullable=False)
    passenger_phone = Column(String, comment="Телефон пассажира", nullable=False)

    seats_booked = Column(Integer, comment="Кол-во забронированных мест", nullable=False)

    created_at = Column(DateTime(timezone=False), comment="Время создания", default=datetime.datetime.utcnow)

    class Config:
        orm_mode = True
