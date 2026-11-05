from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AddToCartRequest(BaseModel):
    garment_id: int = Field(..., gt=0, description="ID of the garment to add")
    quantity: int = Field(1, ge=1, le=99, description="Number of units (1-99)")
    size: Optional[str] = Field(None, max_length=20, description="Chosen size, e.g. 32")
    color: Optional[str] = Field(None, max_length=50, description="Chosen color name")

    @field_validator("size", "color", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        """Trim; empty strings mean 'no choice' so they merge with missing values."""
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v


class UpdateQuantityRequest(BaseModel):
    quantity: int = Field(..., ge=1, le=99, description="New number of units (1-99)")

