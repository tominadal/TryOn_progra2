from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from fastapi.concurrency import run_in_threadpool
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Optional
from app.domain import database
from app.domain.database import get_db
from app.domain.models.catalog import JobStatus, Garment, GarmentAsset, GarmentImage
from app.domain.models.user import User
from app.domain.repositories import garment_repo, job_repo
from app.domain.schemas.catalog import (
    GarmentCreate,
    GarmentUpdate,
    build_parametric_metadata,
)
from app.services.auth_service import get_current_active_user
from app.services.ai_strategy import VirtualTryOnStrategy
from app.dependencies import get_tryon_strategy, get_garment_tryon_strategy
from app.services.job_observers import (
    global_logging_observer,
    global_stats_observer,
    global_notification_observer,
)
from app.routers.validators import is_valid_image, validate_excel_columns, parse_price
from app.config.settings import settings
from app.constants import RoleID
import pandas as pd
import uuid
import io

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _garment_to_dict(g: Garment) -> dict:
    """Serialize a Garment + its asset and images to a response dict."""
    asset = g.asset
    images = g.images if g.images else []

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


def _require_brand_manager(current_user: User) -> int:
    """Valida que el usuario autenticado sea Brand Manager con marca asociada y retorna brand_id."""
    if current_user.role_id != RoleID.BRAND_MANAGER or not current_user.brand_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as brand",
        )
    return current_user.brand_id


def process_catalog_background(job_id: int, file_content: bytes):
    """Background task: parses Excel, calls AI strategy (with Decorator chain), and stores garments.

    Patrones aplicados:
    - Observer: el job registra global_logging_observer, global_stats_observer y
      global_notification_observer antes de procesar. Cada cambio de JobStatus dispara
      notify_observers() en modelo Push.
    - Decorator: la estrategia de IA está envuelta con LoggingStrategyDecorator(CachingStrategyDecorator(...))
      para logging y caché sin modificar GeminiTryOnStrategy (Open/Closed Principle).
    """
    db = database.SessionLocal()
    job = job_repo.get(db, job_id)
    if not job:
        db.close()
        return

    job.register_observer(global_logging_observer)
    job.register_observer(global_stats_observer)
    job.register_observer(global_notification_observer)

    old_status = job.status
    job.status = JobStatus.PROCESSING
    db.commit()
    job.notify_observers(
        old_status=old_status,
        new_status=job.status,
        context={"brand_id": job.brand_id},
    )

    try:
        df = pd.read_excel(io.BytesIO(file_content))
        validate_excel_columns(df)

        strategy = get_tryon_strategy(with_cache=True)

        for index, row in df.iterrows():
            garment_data = row.to_dict()
            raw_price = garment_data.get("Price", 0)
            price = parse_price(raw_price)

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
            db.flush()

            garment_data["image_url"] = garment_data.get("ImageURL") or garment_data.get("Image") or ""
            asset_data = strategy.process_garment(garment_data)

            meta = asset_data.get("metadata_json") or {}
            if garment.color:
                garment.available_colors = [
                    {
                        "name": garment.color,
                        "hex": meta.get("color_hex", "#1e3a8a"),
                    }
                ]

            asset = GarmentAsset(
                garment_id=garment.id,
                ai_generated_image_url=asset_data["ai_generated_image_url"],
                status="COMPLETED",
                metadata_json=meta,
            )
            garment.is_processed = True
            db.add(asset)

            if garment_data["image_url"]:
                db.add(
                    GarmentImage(
                        garment_id=garment.id,
                        image_url=garment_data["image_url"],
                        image_type="FRONT",
                        sort_order=0,
                    )
                )

            job.processed_items += 1
            db.commit()

        old_status = job.status
        job.status = JobStatus.READY
        db.commit()
        job.notify_observers(
            old_status=old_status,
            new_status=job.status,
            context={"processed_items": job.processed_items, "brand_id": job.brand_id},
        )

    except Exception as e:
        old_status = job.status
        job.status = JobStatus.FAILED
        job.error_log = {"error": str(e)}
        db.commit()
        job.notify_observers(
            old_status=old_status,
            new_status=job.status,
            context={"error": str(e), "brand_id": job.brand_id},
        )
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
    if not file.filename or not file.filename.lower().endswith((".xls", ".xlsx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xls, .xlsx) are allowed",
        )

    brand_id = current_user.brand_id
    if not brand_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not associated with any brand",
        )

    content = file.file.read()

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    try:
        df = pd.read_excel(io.BytesIO(content))
        validate_excel_columns(df)
        total_items = len(df)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading Excel file: {str(e)}",
        )

    job = job_repo.create_job(db, brand_id=brand_id, total_items=total_items)
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
    job = job_repo.get(db, job_id)
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


@router.get("/notifications")
def get_observer_notifications(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retorna el feed de notificaciones y métricas acumuladas por los ConcreteObservers
    (StatsJobObserver y NotificationJobObserver) para la marca autenticada (RQ5).
    """
    brand_id = _require_brand_manager(current_user)
    return {
        "stats": global_stats_observer.summary(),
        "notifications": global_notification_observer.get_notifications(brand_id=brand_id),
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


@router.post("/upload-image")
def upload_garment_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Upload a raw garment image and return its URL."""
    _require_brand_manager(current_user)

    content = file.file.read()
    if not is_valid_image(content):
        raise HTTPException(
            status_code=400,
            detail="File must be a valid image (JPEG, PNG, GIF or WEBP)",
        )

    uploads_dir = Path("static/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = uploads_dir / filename

    try:
        file_path.write_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    return {"url": f"{settings.BASE_URL}/static/uploads/{filename}"}


@router.get("/brand")
def get_brand_catalog(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all garments for the current authenticated brand."""
    brand_id = _require_brand_manager(current_user)
    garments = garment_repo.get_by_brand(db, brand_id)
    return [_garment_to_dict(g) for g in garments]


@router.put("/garments/{garment_id}")
async def update_garment(
    garment_id: int,
    garment_in: GarmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    strategy: Optional[VirtualTryOnStrategy] = Depends(get_garment_tryon_strategy),
):
    """
    Actualiza una prenda existente perteneciente a la marca autenticada (CRUD - PUT).
    Soporta edición comercial/paramétrica instantánea (`regenerate_3d=False`) o
    regeneración del gemelo digital 3D con IA (`regenerate_3d=True`) con atomicidad transaccional.
    """
    brand_id = _require_brand_manager(current_user)

    garment = garment_repo.get(db, garment_id)
    if not garment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garment not found",
        )
    if garment.brand_id != brand_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit a garment from another brand",
        )

    try:
        if garment_in.name is not None:
            garment.name = garment_in.name
        if garment_in.price is not None:
            garment.price = garment_in.price
        if garment_in.fit is not None:
            garment.fit = garment_in.fit
        if garment_in.material is not None:
            garment.material = garment_in.material
        if garment_in.description is not None:
            garment.description = garment_in.description
        if garment_in.sizes is not None:
            garment.available_sizes = garment_in.sizes
            garment.size = garment_in.sizes[0] if garment_in.sizes else garment.size

        existing_asset = garment.asset
        existing_meta = dict(existing_asset.metadata_json) if (existing_asset and existing_asset.metadata_json) else {}

        current_color_name = garment_in.color if garment_in.color is not None else (garment.color or "Blue")
        current_color_hex = (
            garment_in.color_hex
            if garment_in.color_hex is not None
            else (
                existing_meta.get("color_hex")
                or (
                    garment.available_colors[0].get("hex")
                    if garment.available_colors and isinstance(garment.available_colors[0], dict)
                    else "#1e3a8a"
                )
            )
        )
        if garment_in.color is not None or garment_in.color_hex is not None:
            garment.color = current_color_name
            garment.available_colors = [{"name": current_color_name, "hex": current_color_hex}]

        # Actualizar imagen principal si se envía nueva URL
        current_image_url = garment_in.image_url
        if current_image_url:
            front_imgs = [img for img in (garment.images or []) if img.sort_order == 0]
            if front_imgs:
                front_imgs[0].image_url = current_image_url
            else:
                db.add(
                    GarmentImage(
                        garment_id=garment.id,
                        image_url=current_image_url,
                        image_type="FRONT",
                        sort_order=0,
                    )
                )
        else:
            current_image_url = (
                garment.images[0].image_url
                if garment.images
                else (existing_asset.ai_generated_image_url if existing_asset else "/products/jean_classic.png")
            )

        waist_rise_label = (
            garment_in.waist_rise
            if garment_in.waist_rise is not None
            else existing_meta.get("waist_rise_label", "Tiro Medio")
        )
        texture_val = (
            garment_in.texture
            if garment_in.texture is not None
            else existing_meta.get("texture", "Denim Clásico")
        )
        elasticity_val = (
            garment_in.elasticity
            if garment_in.elasticity is not None
            else existing_meta.get("elasticity", "Rígido")
        )
        fabric_weight_val = (
            garment_in.fabric_weight
            if garment_in.fabric_weight is not None
            else existing_meta.get("fabric_weight", "Medio")
        )
        distress_val = (
            garment_in.distress_level
            if garment_in.distress_level is not None
            else existing_meta.get("distress_level", int(round((existing_meta.get("distress") or 0) * 100)))
        )
        has_cuffs_val = (
            garment_in.has_cuffs
            if garment_in.has_cuffs is not None
            else bool(existing_meta.get("has_cuffs") or existing_meta.get("has_cuff"))
        )
        has_pleats_val = (
            garment_in.has_pleats
            if garment_in.has_pleats is not None
            else bool(existing_meta.get("has_pleats"))
        )

        if garment_in.regenerate_3d:
            try:
                active_strategy = strategy or get_garment_tryon_strategy()
                garment_data = {
                    "SKU": garment.sku,
                    "Name": garment.name,
                    "Fit": garment.fit,
                    "Size": garment.size,
                    "Color": garment.color,
                    "Price": garment.price,
                    "Material": garment.material,
                    "Description": garment.description,
                    "Waist_Rise": waist_rise_label,
                    "color_hex": current_color_hex,
                    "texture": texture_val,
                    "elasticity": elasticity_val,
                    "fabric_weight": fabric_weight_val,
                    "distress_level": distress_val,
                    "has_cuffs": has_cuffs_val,
                    "has_pleats": has_pleats_val,
                    "image_url": current_image_url or "",
                }
                asset_data = await run_in_threadpool(active_strategy.process_garment, garment_data)
                new_metadata = asset_data["metadata_json"]
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"No se pudo regenerar el modelo 3D: {str(e)}",
                )
        else:
            new_metadata = build_parametric_metadata(
                fit=garment.fit or "Regular",
                color_hex=current_color_hex,
                waist_rise_label=waist_rise_label,
                texture=texture_val,
                elasticity=elasticity_val,
                fabric_weight=fabric_weight_val,
                distress_level=distress_val,
                has_cuffs=has_cuffs_val,
                has_pleats=has_pleats_val,
                existing_meta=existing_meta,
            )

        if existing_asset:
            existing_asset.ai_generated_image_url = current_image_url
            existing_asset.metadata_json = new_metadata
            existing_asset.status = "COMPLETED"
        else:
            db.add(
                GarmentAsset(
                    garment_id=garment.id,
                    ai_generated_image_url=current_image_url,
                    status="COMPLETED",
                    metadata_json=new_metadata,
                )
            )

        db.commit()
        db.refresh(garment)
        return _garment_to_dict(garment)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la prenda: {str(e)}",
        )


@router.delete("/garments/{garment_id}")
def delete_garment(
    garment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a garment owned by the authenticated brand manager."""
    brand_id = _require_brand_manager(current_user)

    garment = garment_repo.get(db, garment_id)
    if not garment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garment not found",
        )

    if garment.brand_id != brand_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete a garment from another brand",
        )

    try:
        garment_repo.delete_with_relations(db, garment)
        return {"message": "Prenda eliminada correctamente", "id": garment_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la prenda: {str(e)}",
        )


@router.post("/garment")
async def create_garment(
    garment_in: GarmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    strategy: Optional[VirtualTryOnStrategy] = Depends(get_garment_tryon_strategy),
):
    """Upload a single garment manually via dashboard."""
    brand_id = _require_brand_manager(current_user)

    try:
        count = garment_repo.count(db)
        initial_colors = []
        if garment_in.color:
            initial_colors.append({
                "name": garment_in.color,
                "hex": garment_in.color_hex or "#1e3a8a",
            })

        new_garment = Garment(
            brand_id=brand_id,
            sku=f"BRAND-{brand_id}-{count + 1}",
            name=garment_in.name,
            fit=garment_in.fit,
            size=garment_in.sizes[0] if garment_in.sizes else "M",
            color=garment_in.color,
            price=garment_in.price,
            material=garment_in.material,
            description=garment_in.description,
            is_processed=True,
            available_sizes=garment_in.sizes or ["S", "M", "L", "XL"],
            available_colors=initial_colors,
        )
        db.add(new_garment)
        db.flush()

        metadata_json = {}
        if garment_in.generate_3d:
            try:
                active_strategy = strategy or get_garment_tryon_strategy()
                garment_data = {
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
                }
                asset_data = await run_in_threadpool(active_strategy.process_garment, garment_data)
                metadata_json = asset_data["metadata_json"]
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"No se pudo generar modelo 3D: {str(e)}",
                )
        else:
            metadata_json = build_parametric_metadata(
                fit=garment_in.fit,
                color_hex=garment_in.color_hex,
                waist_rise_label=garment_in.waist_rise or "Tiro Medio",
                texture=garment_in.texture or "Denim Clásico",
                elasticity=garment_in.elasticity or "Rígido",
                fabric_weight=garment_in.fabric_weight or "Medio",
                distress_level=garment_in.distress_level or 0,
                has_cuffs=bool(garment_in.has_cuffs),
                has_pleats=bool(garment_in.has_pleats),
            )

        asset = GarmentAsset(
            garment_id=new_garment.id,
            ai_generated_image_url=garment_in.image_url,
            status="COMPLETED",
            metadata_json=metadata_json,
        )
        db.add(asset)

        if garment_in.image_url:
            db.add(GarmentImage(
                garment_id=new_garment.id,
                image_url=garment_in.image_url,
                image_type="FRONT",
                sort_order=0,
            ))

        db.commit()
        db.refresh(new_garment)

        return {"id": new_garment.id, "name": new_garment.name, "price": new_garment.price}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar la prenda: {str(e)}",
        )
