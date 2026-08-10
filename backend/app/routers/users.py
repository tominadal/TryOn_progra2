from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.domain.database import get_db
from app.domain.repositories.user_repository import user_repo
from app.dto.user import UserCreate, UserResponse
from app.services.auth_service import get_password_hash, get_current_active_user
from app.domain.models.user import User
from app.domain.models.organization import Brand, Marketplace

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    user_dict = user_in.model_dump(exclude={"password", "brand_name"})
    user_dict["hashed_password"] = hashed_password
    
    # Manejar creación de cuenta tipo Marca (role_id == 2)
    if user_dict.get("role_id") == 2:
        if not user_in.brand_name:
            raise HTTPException(status_code=400, detail="Brand name is required for brand accounts")
        
        # Obtener el primer marketplace (por defecto demo.tryon.com)
        marketplace = db.query(Marketplace).first()
        if not marketplace:
            marketplace = Marketplace(name="Default Mall", domain="default.com")
            db.add(marketplace)
            db.commit()
            db.refresh(marketplace)

        new_brand = Brand(
            name=user_in.brand_name,
            description="Brand created via registration",
            marketplace_id=marketplace.id
        )
        db.add(new_brand)
        db.commit()
        db.refresh(new_brand)
        
        user_dict["brand_id"] = new_brand.id

    return user_repo.create(db, obj_in=user_dict)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
