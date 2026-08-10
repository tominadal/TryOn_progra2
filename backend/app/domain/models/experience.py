from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.domain.models.base import Base

class Avatar(Base):
    __tablename__ = "avatars"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Physical dimensions
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    body_type = Column(String(50), nullable=True)
    
    # Advanced 3D Configuration
    skin_color = Column(String(50), nullable=True)
    hair_color = Column(String(50), nullable=True)
    hair_style = Column(String(50), nullable=True)
    shirt_color = Column(String(50), nullable=True)
    shoes_color = Column(String(50), nullable=True)
    
    # Stored assets
    base_photo_url = Column(String(500), nullable=True)
    avatar_3d_url = Column(String(500), nullable=True) # URL to the .glb file
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
