from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.domain.database import get_db, SessionLocal
from app.domain.models.catalog import ProcessingJob, JobStatus, Garment, GarmentAsset
from app.domain.models.user import User
from app.services.auth_service import get_current_active_user
from app.services.ai_strategy import GeminiTryOnStrategy
import pandas as pd
import io

router = APIRouter(prefix="/catalog", tags=["catalog"])

def process_catalog_background(job_id: int, file_content: bytes):
    db = SessionLocal()
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        db.close()
        return

    job.status = JobStatus.PROCESSING
    db.commit()

    try:
        df = pd.read_excel(io.BytesIO(file_content))
        strategy = GeminiTryOnStrategy()
        
        for index, row in df.iterrows():
            garment_data = row.to_dict()
            
            garment = Garment(
                sku=str(garment_data.get("SKU", f"UNK-{index}")),
                name=str(garment_data.get("Name", "Unnamed")),
                brand_id=job.brand_id,
                fit=str(garment_data.get("Fit", "")),
                size=str(garment_data.get("Size", "")),
                color=str(garment_data.get("Color", ""))
            )
            db.add(garment)
            db.commit()
            db.refresh(garment)
            
            asset_data = strategy.process_garment(garment_data)
            
            asset = GarmentAsset(
                garment_id=garment.id,
                ai_generated_image_url=asset_data["ai_generated_image_url"],
                metadata_json=asset_data["metadata_json"]
            )
            garment.is_processed = True
            db.add(asset)
            
            job.processed_items += 1
            db.commit()
            
        job.status = JobStatus.READY
        db.commit()
        
    except Exception as e:
        job.status = JobStatus.FAILED
        job.error_log = {"error": str(e)}
        db.commit()
    finally:
        db.close()

@router.post("/upload")
def upload_catalog(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed")
    
    brand_id = current_user.brand_id
    if not brand_id:
        raise HTTPException(status_code=403, detail="User is not associated with any brand")
    
    content = file.file.read()
    try:
        df = pd.read_excel(io.BytesIO(content))
        total_items = len(df)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading Excel file: {str(e)}")
        
    job = ProcessingJob(brand_id=brand_id, status=JobStatus.UPLOADED, total_items=total_items)
    db.add(job)
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(process_catalog_background, job.id, content)
    
    return {"message": "Catalog uploaded and processing started", "job_id": job.id}
