from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)

    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")

    departure_city = Column(String, comment="Город отправки", nullable=False)
    arrival_city = Column(String, comment="Город прибытия", nullable=False)

    departure_time = Column(DateTime(timezone=True), comment="Время отправки", nullable=False)
    arrival_time = Column(DateTime(timezone=True), comment="Время прибытия", nullable=False)

    price = Column(Float, comment="Цена", nullable=False)

    available_seats = Column(Integer, comment="Кол-во посадочных мест", nullable=False)

    created_at = Column(DateTime(timezone=True), comment="Дата создания", nullable=True, default=datetime.utcnow)

    class Config:
        orm_mode = True
