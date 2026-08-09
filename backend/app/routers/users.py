from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.domain.database import get_db
from app.domain.repositories.user_repository import user_repo
from app.dto.user import UserCreate, UserResponse
from app.services.auth_service import get_password_hash, get_current_active_user
from app.domain.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    user_dict = user_in.model_dump(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    
    return user_repo.create(db, obj_in=user_dict)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
