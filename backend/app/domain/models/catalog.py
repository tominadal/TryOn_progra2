from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.domain.models.base import Base


class JobStatus(enum.Enum):
    UPLOADED = "UPLOADED"
    VALIDATING = "VALIDATING"
    PROCESSING = "PROCESSING"
    GENERATING_ASSET = "GENERATING_ASSET"
    READY = "READY"
    FAILED = "FAILED"


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.UPLOADED)
    total_items = Column(Integer, default=0)
    processed_items = Column(Integer, default=0)
    error_log = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Garment(Base):
    __tablename__ = "garments"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(1000), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)

    # Standardized attributes for Jeans
    fit = Column(String(50))
    material = Column(String(100))
    price = Column(Float, default=0.0)

    # Available variants — stored as JSON arrays
    # e.g. available_sizes: ["S", "M", "L", "XL"]
    available_sizes = Column(JSON, nullable=True, default=lambda: ["S", "M", "L", "XL"])
    # e.g. available_colors: [{"name": "Azul Clásico", "hex": "#1e3a8a"}, ...]
    available_colors = Column(JSON, nullable=True, default=lambda: [])

    # Legacy single-value fields (kept for backwards compat with catalog upload)
    size = Column(String(20), nullable=True)
    color = Column(String(50), nullable=True)

    image_url = Column(String(255))
    is_processed = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    asset = relationship("GarmentAsset", back_populates="garment", uselist=False, cascade="all, delete-orphan")
    images = relationship("GarmentImage", back_populates="garment", order_by="GarmentImage.sort_order", cascade="all, delete-orphan")


class GarmentImage(Base):
    """Stores multiple product images (front, side, back) per garment."""
    __tablename__ = "garment_images"

    id = Column(Integer, primary_key=True, index=True)
    garment_id = Column(Integer, ForeignKey("garments.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    # FRONT, SIDE, BACK
    image_type = Column(String(20), nullable=False, default="FRONT")
    sort_order = Column(Integer, default=0)

    garment = relationship("Garment", back_populates="images")


class GarmentAsset(Base):
    __tablename__ = "garment_assets"

    id = Column(Integer, primary_key=True, index=True)
    garment_id = Column(Integer, ForeignKey("garments.id"), nullable=False, unique=True)
    status = Column(String(50), nullable=True)  # COMPLETED, FAILED, PROCESSING
    ai_generated_image_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    metadata_json = Column(JSON, nullable=True)  # E.g., confidence score from Gemini

    garment = relationship("Garment", back_populates="asset")
