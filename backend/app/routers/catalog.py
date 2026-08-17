from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.domain.database import get_db, SessionLocal
from app.domain.models.catalog import ProcessingJob, JobStatus, Garment, GarmentAsset, GarmentImage
from app.domain.models.user import User
from app.domain.repositories import garment_repo, garment_image_repo
from app.services.auth_service import get_current_active_user
from app.services.ai_strategy import GeminiTryOnStrategy
from app.config.settings import settings
from app.constants import RoleID
import pandas as pd
import io

router = APIRouter(prefix="/catalog", tags=["catalog"])

# Required columns in the uploaded Excel file
REQUIRED_COLUMNS = {"SKU", "Name", "Fit", "Size", "Color", "Price"}

# Known image magic bytes for server-side validation (defeats falsified Content-Type headers)
_IMAGE_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
    (b"RIFF", "webp"),   # full check: header[8:12] == b"WEBP"
]


def _is_valid_image(content: bytes) -> bool:
    """Return True if the file content starts with a known image magic-byte signature."""
    for sig, _ in _IMAGE_SIGNATURES:
        if content[:len(sig)] == sig:
            # Extra check for WEBP: RIFF????WEBP
            if sig == b"RIFF":
                return len(content) >= 12 and content[8:12] == b"WEBP"
            return True
    return False


def _validate_excel_columns(df: pd.DataFrame) -> None:
    """Raises ValueError if required columns are missing from the DataFrame."""
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")


def _garment_to_dict(g: Garment) -> dict:
    """Serialize a Garment + its asset and images to a response dict."""
    asset = g.asset
    images = g.images if g.images else []

    # Build gallery from GarmentImage records if available, else fall back to asset url
    gallery = [
        {"url": img.image_url, "type": img.image_type, "sort_order": img.sort_order}
        for img in images
    ]

    primary_image = (
        gallery[0]["url"]
        if gallery
        else (asset.ai_generated_image_url if asset else None)
    )

    return {
        "id": g.id,
        "sku": g.sku,
        "name": g.name,
        "description": g.description,
        "fit": g.fit,
        "material": g.material,
        "size": g.size,
        "color": g.color,
        "price": round(g.price, 2),
        "brand_id": g.brand_id,
        "is_processed": g.is_processed,
        "available_sizes": g.available_sizes or ["S", "M", "L", "XL"],
        "available_colors": g.available_colors or [],
        "image": primary_image,
        "images": gallery,
        "model_3d_url": asset.ai_generated_image_url if asset else None,
        "metadata_json": asset.metadata_json if asset else {},
    }


def process_catalog_background(job_id: int, file_content: bytes):
    """Background task: parses Excel, calls AI strategy, and stores garments."""
    db = SessionLocal()
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        db.close()
        return

    job.status = JobStatus.PROCESSING
    db.commit()

    try:
        df = pd.read_excel(io.BytesIO(file_content))
        # Re-validate columns inside the background task as well
        _validate_excel_columns(df)

        strategy = GeminiTryOnStrategy()

        for index, row in df.iterrows():
            garment_data = row.to_dict()

            # Validate price
            raw_price = garment_data.get("Price", 0)
            try:
                price = float(raw_price)
                if price < 0:
                    raise ValueError("Price cannot be negative")
            except (TypeError, ValueError):
                price = 0.0

            garment = Garment(
                sku=str(garment_data.get("SKU", f"UNK-{index}"))[:50],
                name=str(garment_data.get("Name", "Unnamed"))[:100],
                brand_id=job.brand_id,
                fit=str(garment_data.get("Fit", ""))[:50],
                size=str(garment_data.get("Size", ""))[:20],
                color=str(garment_data.get("Color", ""))[:50],
                price=price,
                available_sizes=["S", "M", "L", "XL"],
                available_colors=[],
            )
            db.add(garment)
            # Flush to get the PK without committing — keeps garment + asset in one atomic commit
            db.flush()

            # Pass image_url so the Vision strategy can analyse the real photograph
            garment_data["image_url"] = garment_data.get("ImageURL") or garment_data.get("Image") or ""
            asset_data = strategy.process_garment(garment_data)

            asset = GarmentAsset(
                garment_id=garment.id,
                ai_generated_image_url=asset_data["ai_generated_image_url"],
                metadata_json=asset_data["metadata_json"],
            )
            garment.is_processed = True
            db.add(asset)

            job.processed_items += 1
            # Single commit per garment (garment + asset atomic) — was previously 2 commits
            db.commit()

        job.status = JobStatus.READY
        db.commit()

    except Exception as e:
        job.status = JobStatus.FAILED
        job.error_log = {"error": str(e)}
        db.commit()
    finally:
        db.close()


@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
def upload_catalog(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload a product catalog Excel file. Requires the user to be associated with a Brand.
    Processing is done asynchronously via BackgroundTasks.
    """
    # --- Security: file type check ---
    if not file.filename or not file.filename.lower().endswith((".xls", ".xlsx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xls, .xlsx) are allowed",
        )

    # --- RBAC: user must belong to a brand ---
    brand_id = current_user.brand_id
    if not brand_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any brand",
        )

    content = file.file.read()

    # --- Security: file size check ---
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    # --- Validate Excel structure before enqueuing ---
    try:
        df = pd.read_excel(io.BytesIO(content))
        _validate_excel_columns(df)
        total_items = len(df)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading Excel file: {str(e)}",
        )

    job = ProcessingJob(
        brand_id=brand_id, status=JobStatus.UPLOADED, total_items=total_items
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(process_catalog_background, job.id, content)

    return {
        "message": "Catalog uploaded and processing started",
        "job_id": job.id,
        "total_items": total_items,
    }


@router.get("/jobs/{job_id}")
def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check the status of a catalog processing job."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if job.brand_id != current_user.brand_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return {
        "job_id": job.id,
        "status": job.status.value,
        "total_items": job.total_items,
        "processed_items": job.processed_items,
        "error_log": job.error_log,
    }


@router.get("/garments")
def list_garments(
    fit: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all processed garments available for try-on. Supports optional ?fit= filter."""
    if fit:
        garments = garment_repo.get_by_fit(db, fit)
    else:
        garments = garment_repo.get_processed(db, limit=50)
    return [_garment_to_dict(g) for g in garments]


@router.get("/garments/{garment_id}")
def get_garment(garment_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a specific garment."""
    g = garment_repo.get(db, garment_id)
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garment not found")
    return _garment_to_dict(g)


# --- BRAND DASHBOARD ENDPOINTS ---

import shutil
from pathlib import Path
import uuid

@router.post("/upload-image")
def upload_garment_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a raw garment image and return its URL."""
    if current_user.role_id != RoleID.BRAND_MANAGER or not current_user.brand_id:
        raise HTTPException(status_code=403, detail="Not authorized as brand")

    # Read content first so we can validate via magic bytes
    content = file.file.read()

    # --- Security: validate real image format via magic bytes (defeats falsified Content-Type) ---
    if not _is_valid_image(content):
        raise HTTPException(status_code=400, detail="File must be a valid image (JPEG, PNG, GIF or WEBP)")

    # Ensure uploads directory exists
    uploads_dir = Path("static/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    ext = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'png'
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = uploads_dir / filename

    try:
        file_path.write_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    # Use settings.BASE_URL so this works in production (not hardcoded to localhost)
    return {"url": f"{settings.BASE_URL}/static/uploads/{filename}"}


class GarmentCreate(BaseModel):
    name: str
    price: float
    fit: str = "Regular"
    color: str = "Blue"
    color_hex: str = "#1e3a8a"
    sizes: List[str] = ["S", "M", "L", "XL"]
    image_url: str = "/products/jean_classic.png"
    generate_3d: bool = True
    material: Optional[str] = None
    waist_rise: Optional[str] = None
    description: Optional[str] = None
    texture: Optional[str] = None
    elasticity: Optional[str] = None
    fabric_weight: Optional[str] = None
    distress_level: Optional[int] = 0
    has_cuffs: Optional[bool] = False
    has_pleats: Optional[bool] = False


@router.get("/brand")
def get_brand_catalog(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all garments for the current authenticated brand."""
    if current_user.role_id != RoleID.BRAND_MANAGER or not current_user.brand_id:
        raise HTTPException(status_code=403, detail="Not authorized as brand")

    garments = garment_repo.get_by_brand(db, current_user.brand_id)
    return [
        {
            "id": g.id,
            "sku": g.sku,
            "name": g.name,
            "price": round(g.price, 2),
            "is_processed": g.is_processed,
            "image": g.asset.ai_generated_image_url if g.asset else None,
        }
        for g in garments
    ]


@router.post("/garment")
def create_garment(
    garment_in: GarmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload a single garment manually via dashboard."""
    if current_user.role_id != RoleID.BRAND_MANAGER or not current_user.brand_id:
        raise HTTPException(status_code=403, detail="Not authorized as brand")

    try:
        count = db.query(Garment).count()
        new_garment = Garment(
            brand_id=current_user.brand_id,
            sku=f"BRAND-{current_user.brand_id}-{count + 1}",
            name=garment_in.name,
            fit=garment_in.fit,
            size=garment_in.sizes[0] if garment_in.sizes else "M",
            color=garment_in.color,
            price=garment_in.price,
            material=garment_in.material,
            description=garment_in.description,
            is_processed=garment_in.generate_3d,
            available_sizes=garment_in.sizes,
            available_colors=[],
        )
        db.add(new_garment)
        db.flush() # Flush instead of commit to get ID but keep in transaction

        metadata_json = {}
        if garment_in.generate_3d:
            # Process with AI
            strategy = GeminiTryOnStrategy()
            asset_data = strategy.process_garment({
                "SKU": new_garment.sku,
                "Name": new_garment.name,
                "Fit": new_garment.fit,
                "Size": new_garment.size,
                "Color": new_garment.color,
                "Price": new_garment.price,
                "Material": garment_in.material,
                "Description": garment_in.description,
                "Waist_Rise": garment_in.waist_rise,
                "color_hex": garment_in.color_hex,
                "texture": garment_in.texture,
                "elasticity": garment_in.elasticity,
                "fabric_weight": garment_in.fabric_weight,
                "distress_level": garment_in.distress_level,
                "has_cuffs": garment_in.has_cuffs,
                "has_pleats": garment_in.has_pleats,
                "image_url": garment_in.image_url or "",
            })
            metadata_json = asset_data["metadata_json"]

        asset = GarmentAsset(
            garment_id=new_garment.id,
            ai_generated_image_url=garment_in.image_url,
            metadata_json=metadata_json,
        )
        db.add(asset)

        # Now commit both successfully
        db.commit()
        db.refresh(new_garment)

        return {"id": new_garment.id, "name": new_garment.name, "price": new_garment.price}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la prenda. El modelo 3D falló o los datos son inválidos: {str(e)}"
        )
