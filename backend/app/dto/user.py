from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True
    role_id: int
    brand_id: int | None = None
    marketplace_id: int | None = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
