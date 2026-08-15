from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = Field(None, min_length=2, max_length=100)
    is_active: bool = True
    role_id: int = Field(..., gt=0, description="ID of the role assigned to this user")
    brand_id: int | None = Field(None, description="Optional brand affiliation")
    marketplace_id: int | None = Field(None, description="Optional marketplace affiliation")


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Password must be at least 6 characters",
    )
    brand_name: str | None = Field(None, description="Name of the brand if registering as a brand manager")


class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
