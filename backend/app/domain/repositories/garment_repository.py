from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.repositories.base import BaseRepository, CRUDBase
from app.domain.models.catalog import Garment, GarmentImage, GarmentAsset, ProcessingJob, JobStatus
from app.domain.models.commerce import CartItem, OrderItem
from pydantic import BaseModel


# ── DTOs (Pydantic schemas for typed operations) ──────────────────────────────

class GarmentCreateSchema(BaseModel):
    sku: str
    name: str
    brand_id: int
    fit: Optional[str] = "Regular"
    material: Optional[str] = "Denim"
    price: float = 0.0
    available_sizes: Optional[list] = ["S", "M", "L", "XL"]
    available_colors: Optional[list] = []
    description: Optional[str] = None


class GarmentUpdateSchema(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    fit: Optional[str] = None
    description: Optional[str] = None
    available_colors: Optional[list] = None
    available_sizes: Optional[list] = None


# ── GarmentRepository ─────────────────────────────────────────────────────────

class GarmentRepository(CRUDBase[Garment, GarmentCreateSchema, GarmentUpdateSchema]):
    """Repository for Garment CRUD operations with domain-specific queries."""

    def count(self, db: Session) -> int:
        return db.query(Garment).count()

    def get_by_sku(self, db: Session, sku: str) -> Optional[Garment]:
        return db.query(Garment).filter(Garment.sku == sku).first()

    def get_processed(self, db: Session, skip: int = 0, limit: int = 100) -> List[Garment]:
        """Return all garments that have been AI-processed and are ready."""
        return (
            db.query(Garment)
            .filter(Garment.is_processed.is_(True))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_brand(self, db: Session, brand_id: int, skip: int = 0, limit: int = 100) -> List[Garment]:
        """Return garments for a brand with pagination to prevent unbounded result sets."""
        return (
            db.query(Garment)
            .filter(Garment.brand_id == brand_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_fit(self, db: Session, fit: str) -> List[Garment]:
        return db.query(Garment).filter(Garment.fit == fit, Garment.is_processed.is_(True)).all()

    def delete_with_relations(self, db: Session, garment: Garment) -> None:
        """
        Elimina la prenda limpiando de forma atómica los CartItems activos y
        desvinculando OrderItems históricos para preservar el historial de compras.
        """
        db.query(CartItem).filter(CartItem.garment_id == garment.id).delete(
            synchronize_session=False
        )
        db.query(OrderItem).filter(OrderItem.garment_id == garment.id).update(
            {OrderItem.garment_id: None}, synchronize_session=False
        )
        db.delete(garment)
        db.commit()


# ── GarmentImageRepository ────────────────────────────────────────────────────

class GarmentImageRepository(BaseRepository[GarmentImage]):
    """Repository for GarmentImage (multi-photo per product)."""

    def get_by_garment(self, db: Session, garment_id: int) -> List[GarmentImage]:
        return (
            db.query(GarmentImage)
            .filter(GarmentImage.garment_id == garment_id)
            .order_by(GarmentImage.sort_order)
            .all()
        )

    def get_front(self, db: Session, garment_id: int) -> Optional[GarmentImage]:
        return (
            db.query(GarmentImage)
            .filter(
                GarmentImage.garment_id == garment_id,
                GarmentImage.image_type == "FRONT",
            )
            .first()
        )

    def create_for_garment(
        self,
        db: Session,
        garment_id: int,
        image_url: str,
        image_type: str = "FRONT",
        sort_order: int = 0,
    ) -> GarmentImage:
        img = GarmentImage(
            garment_id=garment_id,
            image_url=image_url,
            image_type=image_type,
            sort_order=sort_order,
        )
        db.add(img)
        db.commit()
        db.refresh(img)
        return img

    def delete_by_garment(self, db: Session, garment_id: int) -> int:
        """Delete all images for a garment. Returns count deleted."""
        count = db.query(GarmentImage).filter(GarmentImage.garment_id == garment_id).delete()
        db.commit()
        return count


# ── ProcessingJobRepository ──────────────────────────────────────────────────

class ProcessingJobRepository(BaseRepository[ProcessingJob]):
    """Repository for ProcessingJob lifecycle persistence."""

    def create_job(self, db: Session, brand_id: int, total_items: int) -> ProcessingJob:
        job = ProcessingJob(
            brand_id=brand_id,
            status=JobStatus.UPLOADED,
            total_items=total_items,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def get_by_brand(self, db: Session, brand_id: int, limit: int = 20) -> List[ProcessingJob]:
        return (
            db.query(ProcessingJob)
            .filter(ProcessingJob.brand_id == brand_id)
            .order_by(ProcessingJob.id.desc())
            .limit(limit)
            .all()
        )


# ── Singletons (module-level, stateless) ─────────────────────────────────────

garment_repo = GarmentRepository(Garment)
garment_image_repo = GarmentImageRepository(GarmentImage)
job_repo = ProcessingJobRepository(ProcessingJob)
