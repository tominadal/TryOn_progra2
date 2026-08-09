from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.domain.models.base import Base

class Marketplace(Base):
    __tablename__ = "marketplaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    domain = Column(String(255), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    brands = relationship("Brand", back_populates="marketplace")
    users = relationship("User", back_populates="marketplace")

class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    marketplace_id = Column(Integer, ForeignKey("marketplaces.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    marketplace = relationship("Marketplace", back_populates="brands")
    users = relationship("User", back_populates="brand")
