from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.domain.database import get_db
from app.domain.models.experience import Avatar
from app.domain.models.catalog import GarmentAsset
from app.domain.models.user import User
from app.services.auth_service import get_current_active_user
import uuid

router = APIRouter(prefix="/tryon", tags=["tryon"])

@router.post("/preview/{garment_id}")
def generate_preview(
    garment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify user has an avatar
    avatar = db.query(Avatar).filter(Avatar.user_id == current_user.id).first()
    if not avatar:
        raise HTTPException(status_code=400, detail="You must configure an Avatar before trying on garments")

    # Simulates TryOn generation combining Avatar and Garment Asset
    asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == garment_id).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Garment asset not ready or not found")
        
    preview_url = f"https://mock-storage.com/preview_{uuid.uuid4().hex[:8]}.png"
    
    return {
        "garment_id": garment_id,
        "preview_url": preview_url,
        "status": "SUCCESS"
    }
