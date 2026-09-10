import os
import uuid
from io import BytesIO

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from PIL import Image
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.domain.database import get_db
from app.domain.models.catalog import GarmentAsset
from app.domain.repositories import avatar_repo
from app.domain.models.user import User
from app.domain.schemas.experience import AvatarCreate, AvatarResponse
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/tryon", tags=["tryon"])


@router.post("/avatar", response_model=AvatarResponse)
async def create_avatar(
    data: AvatarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create or update the 3D avatar for the current user."""
    payload = {
        "avatar_3d_url": data.avatar_3d_url,
        "height_cm": data.height_cm,
        "weight_kg": data.weight_kg,
        "body_type": dict(data.body_type) if data.body_type is not None else None,
        "muscle_definition": data.muscle_definition,
        "skin_color": data.skin_color,
        "hair_color": data.hair_color,
        "hair_style": data.hair_style,
        "beard_style": data.beard_style,
        "beard_color": data.beard_color,
        "eyebrow_style": data.eyebrow_style,
        "glasses": 1 if data.glasses else 0 if data.glasses is not None else None,
        "hat_style": data.hat_style,
        "shirt_color": data.shirt_color,
        "shirt_style": data.shirt_style,
        "shoes_color": data.shoes_color,
        "tattoo_left_arm": data.tattoo_left_arm,
        "gender": data.gender,
    }
    # Remove None values so upsert only updates provided fields
    payload = {k: v for k, v in payload.items() if v is not None}

    avatar = avatar_repo.upsert(db, current_user.id, payload)
    return avatar


@router.get("/avatar", response_model=AvatarResponse)
def get_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve the avatar of the current user."""
    avatar = avatar_repo.get_by_user(db, current_user.id)
    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No avatar found. Please create one first.",
        )
    return avatar


@router.post("/preview/{garment_id}")
def generate_preview(
    garment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate a virtual try-on composite image by overlaying a garment
    asset on the user's avatar photo using Pillow.
    """
    avatar = avatar_repo.get_by_user(db, current_user.id)
    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must configure an Avatar before trying on garments",
        )

    asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == garment_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garment asset not found. The garment may still be processing.",
        )

    try:
        base_url_prefix = settings.BASE_URL + "/"
        if avatar.base_photo_url and avatar.base_photo_url.startswith(base_url_prefix):
            local_path = avatar.base_photo_url.replace(base_url_prefix, "")
            avatar_img = Image.open(local_path).convert("RGBA")
        elif avatar.base_photo_url:
            response = requests.get(avatar.base_photo_url, timeout=10)
            response.raise_for_status()
            avatar_img = Image.open(BytesIO(response.content)).convert("RGBA")
        else:
            raise ValueError("Avatar has no base photo")

        response = requests.get(asset.ai_generated_image_url, timeout=10)
        response.raise_for_status()
        garment_img = Image.open(BytesIO(response.content)).convert("RGBA")

        target_width = int(avatar_img.width * 0.6)
        ratio = target_width / garment_img.width
        target_height = int(garment_img.height * ratio)
        garment_resized = garment_img.resize(
            (target_width, target_height), Image.Resampling.LANCZOS
        )

        alpha = garment_resized.getchannel("A")
        alpha = alpha.point(lambda p: int(p * 0.85))
        garment_resized.putalpha(alpha)

        x = (avatar_img.width - target_width) // 2
        y = int(avatar_img.height * 0.3)
        avatar_img.paste(garment_resized, (x, y), garment_resized)

        out_filename = f"preview_{uuid.uuid4().hex[:8]}.png"
        out_path = os.path.join("static", "uploads", out_filename)
        avatar_img.save(out_path, format="PNG")

        preview_url = f"{settings.BASE_URL}/static/uploads/{out_filename}"
        success = True

    except Exception as e:
        preview_url = f"{settings.BASE_URL}/static/placeholder.png"
        success = False
#         print(f"[WARN] Pillow compositing failed for garment {garment_id}: {e}")

    return {
        "garment_id": garment_id,
        "preview_url": preview_url,
        "status": "SUCCESS" if success else "FALLBACK",
    }
