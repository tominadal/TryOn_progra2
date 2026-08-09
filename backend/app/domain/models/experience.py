from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.domain.models.base import Base

class Avatar(Base):
    __tablename__ = "avatars"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    body_type = Column(String(50), nullable=True)
    base_photo_url = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
