from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)

    bookings = relationship("Booking", back_populates="trip")

    departure_city = Column("Город отправки", String, nullable=False)
    arrival_city = Column("Город прибытия", String, nullable=False)

    departure_time = Column("Время отправки", DateTime(timezone=False), nullable=False)
    arrival_time = Column("Время прибытия", DateTime(timezone=False), nullable=False)

    price = Column("Цена", Float, nullable=False)

    available_seats = Column("Кол-во посадочных мест", Integer, nullable=False)

    created_at = Column("Дата создания", DateTime(timezone=False), nullable=True, default=datetime.utcnow)
