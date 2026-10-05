"""
Script de mantenimiento: reprocesa todas las prendas a traves del pipeline de IA.

Ejecutar desde el directorio backend/:
    python scripts/reprocess_samples.py

Util cuando:
- Cambia el modelo de IA (ej: Gemini 2.5 Flash -> siguiente version)
- Se actualiza el VISION_PROMPT y se quieren regenerar los metadata_json existentes
- Un lote de prendas fallo durante la carga masiva y necesita reintento

Arquitectura:
    Usa StrategyFactory (Factory Pattern) en lugar de instanciar GeminiTryOnStrategy
    directamente. Esto garantiza que los decoradores de Logging y Cache esten activos
    durante el reprocesamiento, manteniendo consistencia con el pipeline de produccion.
"""
import os
import sys

# Permite importar modulos de la app desde scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.domain.database import SessionLocal
from app.domain.models.catalog import Garment, GarmentAsset
from app.config.settings import settings
from app.services.strategy_factory import StrategyFactory


def main() -> None:
    db = SessionLocal()

    # Usamos StrategyFactory con cache activo:
    # - Logging: traza cada prenda procesada con tiempos
    # - Cache: si dos prendas tienen la misma imagen, la segunda es instantanea
    factory = StrategyFactory(settings)
    strategy = factory.create_bulk_catalog()

    garments = db.query(Garment).all()
    print(f"Encontradas {len(garments)} prendas para reprocesar.")
    print(f"Estrategia activa: {type(strategy).__name__} (USE_MOCK_AI={settings.USE_MOCK_AI})\n")

    success_count = 0
    error_count = 0

    for g in garments:
        print(f"Procesando prenda {g.id}: {g.name}...")

        garment_data = {
            "SKU":      g.sku,
            "Name":     g.name,
            "Fit":      g.fit,
            "Size":     g.size,
            "Color":    g.color,
            "Price":    g.price,
            "image_url": (g.asset.ai_generated_image_url if g.asset else "") or "",
        }

        try:
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
            print(f"  OK — prenda {g.id} actualizada.")
            success_count += 1

        except Exception as e:
            db.rollback()
            print(f"  ERROR — prenda {g.id}: {e}")
            error_count += 1

    db.close()
    print(f"\nReprocesamiento completo: {success_count} exitosas, {error_count} fallidas.")


if __name__ == "__main__":
    main()
