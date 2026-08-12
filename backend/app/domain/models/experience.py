from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
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

    # Body type: "Delgado", "Normal", "Atlético", "Robusto"
    body_type = Column(String(50), nullable=True, default="Normal")

    # Muscle definition 0.0 (none) to 1.0 (very defined)
    muscle_definition = Column(Float, nullable=True, default=0.3)

    # Skin & hair
    skin_color = Column(String(50), nullable=True)
    hair_color = Column(String(50), nullable=True)
    hair_style = Column(String(50), nullable=True)

    # Facial features
    beard_style = Column(String(50), nullable=True, default="Ninguna")   # Ninguna/Esbozo/Corta/Larga
    beard_color = Column(String(50), nullable=True, default="#2d1a0e")
    eyebrow_style = Column(String(50), nullable=True, default="Normal")  # Fino/Normal/Grueso

    # Accessories
    glasses = Column(Integer, nullable=True, default=0)  # 0 false, 1 true
    hat_style = Column(String(50), nullable=True, default="Ninguno")    # Ninguno/Gorra/Sombrero/Headband

    # Clothes
    shirt_color = Column(String(50), nullable=True)
    shirt_style = Column(String(50), nullable=True, default="Basic")    # Basic/V-Neck/Polo
    shoes_color = Column(String(50), nullable=True)

    # Extras
    tattoo_left_arm = Column(Boolean, nullable=True, default=False)

    gender = Column(String(50), nullable=True, default="Hombre")

    # Stored assets
    base_photo_url = Column(String(500), nullable=True)
    avatar_3d_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
