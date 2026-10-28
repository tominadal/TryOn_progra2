import os
import uuid
from io import BytesIO
from typing import List, Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from PIL import Image
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.domain.database import get_db
from app.domain.models.catalog import GarmentAsset
from app.domain.repositories import avatar_repo
from app.constants import MAX_AVATARS_PER_USER
from app.domain.models.experience import Avatar
from app.domain.models.user import User
from app.domain.schemas.experience import AvatarCreate, AvatarResponse, AvatarUpdate
from app.services.auth_service import get_current_active_user

router = APIRouter(prefix="/tryon", tags=["tryon"])


def _avatar_payload(data) -> dict:
    """Pydantic model -> dict for the repository (None dropped, glasses stored as 0/1)."""
    payload = data.model_dump(exclude_none=True)
    if "glasses" in payload:
        payload["glasses"] = 1 if payload["glasses"] else 0
    return payload


def _get_owned_avatar(db: Session, user: User, avatar_id: int) -> Avatar:
    avatar = avatar_repo.get_for_user(db, user.id, avatar_id)
    if not avatar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    return avatar


@router.get("/avatars", response_model=List[AvatarResponse])
def list_avatars(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all avatars of the current user (oldest first). Empty list if none."""
    return avatar_repo.list_by_user(db, current_user.id)


@router.post("/avatars", response_model=AvatarResponse, status_code=status.HTTP_201_CREATED)
def create_avatar(
    data: AvatarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new avatar for the current user (up to MAX_AVATARS_PER_USER)."""
    if avatar_repo.count_by_user(db, current_user.id) >= MAX_AVATARS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can have at most {MAX_AVATARS_PER_USER} avatars",
        )
    return avatar_repo.create_for_user(db, current_user.id, _avatar_payload(data))


@router.get("/avatars/{avatar_id}", response_model=AvatarResponse)
def get_avatar(
    avatar_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve one of the current user's avatars."""
    return _get_owned_avatar(db, current_user, avatar_id)


@router.put("/avatars/{avatar_id}", response_model=AvatarResponse)
def update_avatar(
    avatar_id: int,
    data: AvatarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Partially update one of the current user's avatars."""
    avatar = _get_owned_avatar(db, current_user, avatar_id)
    return avatar_repo.update_fields(db, avatar, _avatar_payload(data))


@router.delete("/avatars/{avatar_id}", status_code=status.HTTP_200_OK)
def delete_avatar(
    avatar_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete one of the current user's avatars."""
    if not avatar_repo.delete_for_user(db, current_user.id, avatar_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    return {"message": "Avatar deleted"}


@router.post("/preview/{garment_id}")
def generate_preview(
    garment_id: int,
    avatar_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate a virtual try-on composite image by overlaying a garment
    asset on the user's avatar photo using Pillow.
    """
    if avatar_id is not None:
        avatar = _get_owned_avatar(db, current_user, avatar_id)
    else:
        avatar = avatar_repo.get_first_by_user(db, current_user.id)
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
