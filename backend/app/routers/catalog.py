from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.domain.database import get_db, SessionLocal
from app.domain.models.catalog import ProcessingJob, JobStatus, Garment, GarmentAsset
from app.domain.models.user import User
from app.services.auth_service import get_current_active_user
from app.services.ai_strategy import GeminiTryOnStrategy
from app.config.settings import settings
import pandas as pd
import io

router = APIRouter(prefix="/catalog", tags=["catalog"])

# Required columns in the uploaded Excel file
REQUIRED_COLUMNS = {"SKU", "Name", "Fit", "Size", "Color", "Price"}


def _validate_excel_columns(df: pd.DataFrame) -> None:
    """Raises ValueError if required columns are missing from the DataFrame."""
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")


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
            )
            db.add(garment)
            db.commit()
            db.refresh(garment)

            asset_data = strategy.process_garment(garment_data)

            asset = GarmentAsset(
                garment_id=garment.id,
                ai_generated_image_url=asset_data["ai_generated_image_url"],
                metadata_json=asset_data["metadata_json"],
            )
            garment.is_processed = True
            db.add(asset)

            job.processed_items += 1
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
def list_garments(db: Session = Depends(get_db)):
    """List all processed garments available for try-on."""
    garments = db.query(Garment).filter(Garment.is_processed.is_(True)).all()
    result = []
    for g in garments:
        asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == g.id).first()
        result.append(
            {
                "id": g.id,
                "sku": g.sku,
                "name": g.name,
                "fit": g.fit,
                "size": g.size,
                "color": g.color,
                "price": round(g.price, 2),
                "image": asset.thumbnail_url if asset else None,
                "model_3d_url": asset.ai_generated_image_url if asset else None,
            }
        )
    return result


@router.get("/garments/{garment_id}")
def get_garment(garment_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a specific garment."""
    g = db.query(Garment).filter(Garment.id == garment_id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garment not found")

    asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == g.id).first()
    return {
        "id": g.id,
        "sku": g.sku,
        "name": g.name,
        "fit": g.fit,
        "size": g.size,
        "color": g.color,
        "price": round(g.price, 2),
        "image": asset.thumbnail_url if asset else None,
        "model_3d_url": asset.ai_generated_image_url if asset else None,
    }
