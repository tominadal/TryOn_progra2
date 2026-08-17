"""
Utility script to reprocess all garments through the AI pipeline.
Run from the backend/ directory:

    python scripts/reprocess_samples.py

Useful when garment metadata or the AI strategy changes and existing
assets need to be regenerated without re-uploading the catalog.
"""
import os
import sys

# Add the backend root to sys.path so app imports resolve correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.domain.database import SessionLocal
from app.domain.models.catalog import Garment, GarmentAsset
from app.services.ai_strategy import GeminiTryOnStrategy


def main():
    db = SessionLocal()
    strategy = GeminiTryOnStrategy()

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
            "Price": g.price,
            "image_url": (g.asset.ai_generated_image_url if g.asset else "") or "",
        }

        asset_data = strategy.process_garment(garment_data)

        if g.asset:
            g.asset.ai_generated_image_url = asset_data["ai_generated_image_url"]
            g.asset.metadata_json = asset_data["metadata_json"]
        else:
            asset = GarmentAsset(
                garment_id=g.id,
                ai_generated_image_url=asset_data["ai_generated_image_url"],
                metadata_json=asset_data["metadata_json"],
            )
            db.add(asset)

        g.is_processed = True
        db.commit()
        print(f"  Updated garment {g.id} successfully.")

    db.close()
    print("\nDone reprocessing all garments.")


if __name__ == "__main__":
    main()
