import os
import sys

# Add the parent directory to sys.path to allow imports from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.domain.database import SessionLocal
from app.domain.models.catalog import Garment, GarmentAsset
from app.services.ai_strategy import GeminiTryOnStrategy

def main():
    db = SessionLocal()
    strategy = GeminiTryOnStrategy()
    
    # We want to reprocess all garments that currently exist.
    garments = db.query(Garment).all()
    
    print(f"Found {len(garments)} garments to reprocess.")
    
    for g in garments:
        print(f"Processing garment {g.id}: {g.name}...")
        
        garment_data = {
            "SKU": g.sku,
            "Name": g.name,
            "Fit": g.fit,
            "Size": g.size,
            "Color": g.color,
            "Price": g.price
        }
        
        asset_data = strategy.process_garment(garment_data)
        
        asset = g.asset
        if asset:
            # We don't overwrite the ai_generated_image_url because we might be using images right now, 
            # wait, ai_generated_image_url was pointing to the GLB file. Let's just set it to empty
            # as defined in the updated process_garment.
            asset.ai_generated_image_url = asset_data["ai_generated_image_url"]
            asset.metadata_json = asset_data["metadata_json"]
        else:
            asset = GarmentAsset(
                garment_id=g.id,
                ai_generated_image_url=asset_data["ai_generated_image_url"],
                metadata_json=asset_data["metadata_json"]
            )
            db.add(asset)
            
        db.commit()
        print(f"Updated garment {g.id} successfully.")
        
    db.close()
    print("Done reprocessing all garments.")

if __name__ == "__main__":
    main()
