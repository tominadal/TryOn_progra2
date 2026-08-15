import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.domain.database import SessionLocal
from app.domain.models.catalog import Garment, GarmentAsset
from app.services.ai_strategy import GeminiTryOnStrategy

def main():
    db = SessionLocal()
    garments = db.query(Garment).all()
    strategy = GeminiTryOnStrategy()
    
    for g in garments:
        print(f"Processing {g.sku}...")
        res = strategy.process_garment({
            "SKU": g.sku,
            "Name": g.name,
            "Fit": g.fit,
            "Color": g.color,
            "Size": g.size
        })
        asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == g.id).first()
        if not asset:
            asset = GarmentAsset(garment_id=g.id, status="COMPLETED")
            db.add(asset)
        asset.ai_generated_image_url = res["ai_generated_image_url"]
        asset.thumbnail_url = res["thumbnail_url"]
        asset.metadata_json = res["metadata_json"]
        db.commit()
        print(f"Saved {g.sku} -> {res['ai_generated_image_url']}")

if __name__ == "__main__":
    main()
