import os
import uuid
from io import BytesIO

import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from PIL import Image
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.domain.database import get_db
from app.domain.models.catalog import GarmentAsset
from app.domain.models.experience import Avatar
from app.domain.models.user import User
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/tryon", tags=["tryon"])

# Allowed MIME extensions for avatar photos
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_AVATAR_SIZE_MB = 5


def _safe_filename(original_filename: str) -> str:
    """
    Sanitize an uploaded filename:
    - Strip directory components (prevent path traversal)
    - Keep only the basename
    - Prefix with a UUID to avoid collisions
    """
    basename = os.path.basename(original_filename)
    # Replace spaces and special chars to keep filenames safe
    safe_base = "".join(c for c in basename if c.isalnum() or c in "._-")
    return f"{uuid.uuid4().hex}_{safe_base}"


from pydantic import BaseModel

class AvatarCreate(BaseModel):
    avatar_3d_url: str
    skin_color: str | None = None
    hair_color: str | None = None
    hair_style: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    body_type: str | None = None
    shirt_color: str | None = None
    shoes_color: str | None = None
    gender: str | None = None
    glasses: bool | None = None

@router.post("/avatar")
async def create_avatar(
    data: AvatarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create or update the 3D avatar for the current user."""
    
    avatar = db.query(Avatar).filter(Avatar.user_id == current_user.id).first()
    if avatar:
        avatar.avatar_3d_url = data.avatar_3d_url
        avatar.skin_color = data.skin_color
        avatar.hair_color = data.hair_color
        avatar.hair_style = data.hair_style
        avatar.height_cm = data.height_cm
        avatar.weight_kg = data.weight_kg
        avatar.body_type = data.body_type
        avatar.shirt_color = data.shirt_color
        avatar.shoes_color = data.shoes_color
        if data.gender is not None:
            avatar.gender = data.gender
        if data.glasses is not None:
            avatar.glasses = 1 if data.glasses else 0
    else:
        avatar = Avatar(
            user_id=current_user.id,
            avatar_3d_url=data.avatar_3d_url,
            skin_color=data.skin_color,
            hair_color=data.hair_color,
            hair_style=data.hair_style,
            height_cm=data.height_cm,
            weight_kg=data.weight_kg,
            body_type=data.body_type,
            shirt_color=data.shirt_color,
            shoes_color=data.shoes_color,
            gender=data.gender if data.gender is not None else "Hombre",
            glasses=1 if data.glasses else 0,
        )
        db.add(avatar)

    db.commit()
    db.refresh(avatar)
    return {
        "id": avatar.id,
        "avatar_3d_url": avatar.avatar_3d_url,
        "skin_color": avatar.skin_color,
        "gender": avatar.gender,
        "glasses": bool(avatar.glasses),
    }


@router.get("/avatar")
def get_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve the avatar of the current user."""
    avatar = db.query(Avatar).filter(Avatar.user_id == current_user.id).first()
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
    # --- Verify user has an avatar ---
    avatar = db.query(Avatar).filter(Avatar.user_id == current_user.id).first()
    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must configure an Avatar before trying on garments",
        )

    # --- Verify garment asset exists ---
    asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == garment_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garment asset not found. The garment may still be processing.",
        )

    try:
        # --- Load avatar image ---
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

        # --- Load garment image ---
        response = requests.get(asset.ai_generated_image_url, timeout=10)
        response.raise_for_status()
        garment_img = Image.open(BytesIO(response.content)).convert("RGBA")

        # --- Resize garment to fit avatar (60% of avatar width) ---
        target_width = int(avatar_img.width * 0.6)
        ratio = target_width / garment_img.width
        target_height = int(garment_img.height * ratio)
        garment_resized = garment_img.resize(
            (target_width, target_height), Image.Resampling.LANCZOS
        )

        # --- Blend at 85% opacity ---
        alpha = garment_resized.getchannel("A")
        alpha = alpha.point(lambda p: int(p * 0.85))
        garment_resized.putalpha(alpha)

        # --- Composite: paste at horizontal center, 30% from top ---
        x = (avatar_img.width - target_width) // 2
        y = int(avatar_img.height * 0.3)
        avatar_img.paste(garment_resized, (x, y), garment_resized)

        # --- Save with sanitized filename ---
        out_filename = f"preview_{uuid.uuid4().hex[:8]}.png"
        out_path = os.path.join("static", "uploads", out_filename)
        avatar_img.save(out_path, format="PNG")

        preview_url = f"{settings.BASE_URL}/static/uploads/{out_filename}"
        success = True

    except Exception as e:
        # Fallback: return a deterministic mock URL so the frontend doesn't break
        preview_url = f"{settings.BASE_URL}/static/placeholder.png"
        success = False
        print(f"[WARN] Pillow compositing failed for garment {garment_id}: {e}")

    return {
        "garment_id": garment_id,
        "preview_url": preview_url,
        "status": "SUCCESS" if success else "FALLBACK",
    }
