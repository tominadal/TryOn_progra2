import json
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class AvatarBase(BaseModel):
    # Display name (a user can have several avatars)
    name: Optional[str] = Field(None, max_length=50)

    # Physical dimensions
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None

    # Advanced body morph parameters (e.g. chestWidth, bellyWidth, etc.)
    body_type: Optional[Dict[str, float]] = None

    # Muscle definition 0.0 to 1.0
    muscle_definition: Optional[float] = None

    # Skin & hair
    skin_color: Optional[str] = None
    hair_color: Optional[str] = None
    hair_style: Optional[str] = None

    # Facial features
    beard_style: Optional[str] = None
    beard_color: Optional[str] = None
    eyebrow_style: Optional[str] = None

    # Accessories
    glasses: Optional[bool] = None
    hat_style: Optional[str] = None

    # Clothes
    shirt_color: Optional[str] = None
    shirt_style: Optional[str] = None
    shoes_color: Optional[str] = None

    # Extras
    tattoo_left_arm: Optional[bool] = None
    gender: Optional[str] = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise ValueError("name must be a string")
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v

    @field_validator("body_type", mode="before")
    @classmethod
    def validate_body_type(cls, v: Any) -> Optional[Dict[str, float]]:
        if v is None:
            return None
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except Exception:
                raise ValueError("body_type must be a valid dictionary or JSON string")
        if not isinstance(v, dict):
            raise ValueError("body_type must be a dictionary")
        return v


class AvatarCreate(AvatarBase):
    name: str = Field("Mi avatar", max_length=50)
    avatar_3d_url: str


class AvatarUpdate(AvatarBase):
    avatar_3d_url: Optional[str] = None


class AvatarResponse(AvatarBase):
    id: int
    avatar_3d_url: Optional[str] = None
    user_id: Optional[int] = None
    base_photo_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("glasses", mode="before")
    @classmethod
    def parse_glasses(cls, v: Any) -> bool:
        return bool(v)

    model_config = ConfigDict(from_attributes=True)
