import os
import sys

# Setup environment to run FastAPI scripts
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))
from dotenv import load_dotenv
load_dotenv("backend/.env")
# Ensure the mock strategy is NOT used if GEMINI_API_KEY is missing, wait we need to let it fail or work.
# If Gemini isn't configured, it falls back to Mock. But Mock doesn't have the new fields!
# Let's hope Gemini works, or Mock is updated. We'll update the mock strategy just in case!

from sqlalchemy.orm import Session
from app.domain.database import SessionLocal
from app.domain.models.catalog import Garment, GarmentAsset
from app.services.ai_strategy import GeminiTryOnStrategy
import json

def run():
    db: Session = SessionLocal()
    strategy = GeminiTryOnStrategy()
    
    garments = db.query(Garment).all()
    print(f"Found {len(garments)} garments to reprocess.")
    
    for garment in garments:
        print(f"Processing {garment.name} (SKU: {garment.sku})...")
        
        try:
            image_url = garment.image_url
            if garment.asset and garment.asset.ai_generated_image_url:
                image_url = garment.asset.ai_generated_image_url
                
            asset_data = strategy.process_garment({
                "SKU": garment.sku,
                "Name": garment.name,
                "Fit": garment.fit,
                "Size": garment.size,
                "Color": garment.color,
                "Price": garment.price,
                "image_url": image_url or "",
            })
            
            if garment.asset:
                garment.asset.metadata_json = asset_data["metadata_json"]
            else:
                asset = GarmentAsset(
                    garment_id=garment.id,
                    ai_generated_image_url=image_url,
                    metadata_json=asset_data["metadata_json"],
                )
                db.add(asset)
            
            garment.is_processed = True
            db.commit()
            print(f"Success: {garment.name}")
        except Exception as e:
            print(f"Failed: {garment.name} - {str(e)}")
            db.rollback()

if __name__ == "__main__":
    run()
