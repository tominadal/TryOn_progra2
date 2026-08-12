"""
Seed script for TryOnHub database.
Populates initial roles, users, marketplace, brand, and 6 unique sample jeans
each with 3 product images, 2 color variants, and multiple sizes.

Usage:
    cd backend
    python seed.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.domain.models.base import Base
from app.domain.models.user import Role, User
from app.domain.models.organization import Marketplace, Brand
from app.domain.models.catalog import Garment, GarmentAsset, GarmentImage
from app.domain.models.experience import Avatar
from app.domain.models.commerce import Cart, CartItem, Order, OrderItem

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    from app.config.settings import settings
    DATABASE_URL = settings.DATABASE_URL
except Exception:
    DATABASE_URL = "sqlite:///./tryon_db.sqlite"


# ── Catalog data: 6 unique jeans ─────────────────────────────────────────────
#
# Each jean has:
#   - Unique name, SKU, fit, material, description
#   - available_colors: list of 2 distinct {name, hex} dicts
#   - available_sizes:  list of 4 sizes
#   - images: 3 unique {url, type} records (FRONT / SIDE / BACK)
#   - 3D fit property used by the frontend ParametricMannequin
#
SAMPLE_JEANS = [
    {
        "sku": "ACME-501-ORG",
        "name": "501® Original Straight",
        "fit": "Straight",
        "material": "Denim 100% Algodón",
        "description": (
            "El jean icónico que definió una era. Corte recto clásico, "
            "lavado medio y tiro regular. Confeccionado en denim de 12 oz "
            "100% algodón con un acabado duradero y cómodo para todo el día."
        ),
        "price": 109.99,
        "available_sizes": ["28", "30", "32", "34", "36"],
        "available_colors": [
            {"name": "Azul Clásico", "hex": "#1e3a8a"},
            {"name": "Gris Acero", "hex": "#4b5563"},
        ],
        "images": [
            {"url": "/products/jean_classic.png",      "type": "FRONT", "order": 0},
            {"url": "/products/jean_side.png",         "type": "SIDE",  "order": 1},
            {"url": "/products/jean_back.png",         "type": "BACK",  "order": 2},
        ],
    },
    {
        "sku": "ACME-711-SKN",
        "name": "711 Skinny Fit Premium",
        "fit": "Skinny",
        "material": "Denim Stretch 2% Elastano",
        "description": (
            "Corte ultra ajustado de la cadera al tobillo. Tela stretch de alta "
            "elasticidad que ofrece libertad de movimiento sin perder definición. "
            "Cierre oculto, tiro bajo y acabado satinado premium."
        ),
        "price": 95.50,
        "available_sizes": ["26", "28", "30", "32", "34"],
        "available_colors": [
            {"name": "Negro Profundo", "hex": "#111827"},
            {"name": "Azul Marino", "hex": "#1e40af"},
        ],
        "images": [
            {"url": "/products/jean_black.png",       "type": "FRONT", "order": 0},
            {"url": "/products/jean_black_side.png",  "type": "SIDE",  "order": 1},
            {"url": "/products/jean_black_back.png",  "type": "BACK",  "order": 2},
        ],
    },
    {
        "sku": "ACME-90S-VNT",
        "name": "90s Vintage Mom Relaxed",
        "fit": "Mom Fit",
        "material": "Denim Reciclado con Efectos Rasgados",
        "description": (
            "Inspirado en la estética de los 90, con tiro alto y corte holgado "
            "en el muslo que se estrecha en el tobillo. Lavado desgastado con "
            "efecto vintage, rasgados manuales y acabado eco-friendly."
        ),
        "price": 129.00,
        "available_sizes": ["28", "30", "32", "34", "36"],
        "available_colors": [
            {"name": "Celeste Desgastado", "hex": "#93c5fd"},
            {"name": "Beige Vintage", "hex": "#d4b896"},
        ],
        "images": [
            {"url": "/products/jean_vintage.png",         "type": "FRONT", "order": 0},
            {"url": "/products/jean_vintage_side.png",    "type": "SIDE",  "order": 1},
            {"url": "/products/jean_vintage_back.png",    "type": "BACK",  "order": 2},
        ],
    },
    {
        "sku": "ACME-BRM-SHT",
        "name": "Classic Denim Bermuda",
        "fit": "Bermuda",
        "material": "Denim 12oz Lavado Medio",
        "description": (
            "Bermuda clásica de jean ideal para el verano. Tiro medio, "
            "corte recto por encima de la rodilla y bajos deshilachados "
            "para un look casual."
        ),
        "price": 75.00,
        "available_sizes": ["28", "30", "32", "34", "36", "38"],
        "available_colors": [
            {"name": "Azul Medio", "hex": "#3b82f6"},
            {"name": "Celeste Claro", "hex": "#93c5fd"},
        ],
        "images": [
            {"url": "/products/bermuda_front.png",      "type": "FRONT", "order": 0},
        ],
    },
    {
        "sku": "ACME-SKT-DNM",
        "name": "Pollera Mini Denim",
        "fit": "Skirt",
        "material": "Denim 100% Algodón",
        "description": (
            "Pollera mini de jean con diseño atemporal. Estilo 5 bolsillos "
            "y cierre frontal con botones. El tejido rígido asegura una estructura "
            "que estiliza la figura."
        ),
        "price": 85.00,
        "available_sizes": ["26", "28", "30", "32", "34"],
        "available_colors": [
            {"name": "Azul Clásico", "hex": "#1e3a8a"},
            {"name": "Negro", "hex": "#111827"},
        ],
        "images": [
            {"url": "/products/skirt_front.png",        "type": "FRONT", "order": 0},
        ],
    },
    {
        "sku": "ACME-FLR-RET",
        "name": "Flared Retro High-Rise",
        "fit": "Flared",
        "material": "Denim Stretch Premium 4% Elastano",
        "description": (
            "Revive los años 70 con este jean acampanado. Tiro muy alto, "
            "ajustado hasta la rodilla y luego se abre en una espectacular "
            "campana. Stretch para una silueta perfecta."
        ),
        "price": 125.00,
        "available_sizes": ["26", "28", "30", "32", "34"],
        "available_colors": [
            {"name": "Azul Lavado", "hex": "#60a5fa"},
            {"name": "Blanco Crudo", "hex": "#f9fafb"},
        ],
        "images": [
            {"url": "/products/flared_front.png",      "type": "FRONT", "order": 0},
        ],
    },
]


def seed():
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)
    print("Tables created/verified.")

    db = SessionLocal()

    try:
        # ── 1. Roles ──────────────────────────────────────────────────────────
        existing_roles = db.query(Role).count()
        if existing_roles == 0:
            roles_data = [
                Role(name="Platform Admin", description="Platform administrator with full access"),
                Role(name="Brand Manager", description="Brand user who uploads catalogs"),
                Role(name="Customer", description="End customer who tries on garments"),
            ]
            db.add_all(roles_data)
            db.commit()
            for r in roles_data:
                db.refresh(r)
            print(f"{len(roles_data)} roles created.")
        else:
            print("Roles already exist — skipping.")

        roles = db.query(Role).all()
        role_map = {r.name: r.id for r in roles}

        # ── 2. Marketplace ────────────────────────────────────────────────────
        marketplace = db.query(Marketplace).filter(Marketplace.domain == "demo.tryon.com").first()
        if not marketplace:
            marketplace = Marketplace(
                name="TryOn Demo Mall",
                domain="demo.tryon.com",
                is_active=True,
            )
            db.add(marketplace)
            db.commit()
            db.refresh(marketplace)
            print("Marketplace created.")
        else:
            print("Marketplace already exists — skipping.")

        # ── 3. Brand ──────────────────────────────────────────────────────────
        brand = db.query(Brand).filter(Brand.name == "Acme Denim").first()
        if not brand:
            brand = Brand(
                name="Acme Denim",
                description="Premium denim brand for the demo",
                marketplace_id=marketplace.id,
                is_active=True,
            )
            db.add(brand)
            db.commit()
            db.refresh(brand)
            print("Brand 'Acme Denim' created.")
        else:
            print("Brand already exists — skipping.")

        # ── 4. Users ──────────────────────────────────────────────────────────
        hashed_pw = pwd_context.hash("123456")

        users_to_create = [
            {
                "email": "admin@tryon.com",
                "full_name": "Admin de Prueba",
                "role_id": role_map["Platform Admin"],
                "brand_id": None,
            },
            {
                "email": "brand@tryon.com",
                "full_name": "Brand Manager",
                "role_id": role_map["Brand Manager"],
                "brand_id": brand.id,
            },
            {
                "email": "cliente@tryon.com",
                "full_name": "Cliente de Prueba",
                "role_id": role_map["Customer"],
                "brand_id": None,
            },
        ]

        for u_data in users_to_create:
            exists = db.query(User).filter(User.email == u_data["email"]).first()
            if not exists:
                user = User(hashed_password=hashed_pw, **u_data)
                db.add(user)
                print(f"User '{u_data['email']}' created.")
            else:
                print(f"User '{u_data['email']}' already exists — skipping.")
        db.commit()

        # ── 5. Sample Garments — 6 unique jeans ───────────────────────────────
        for jean_data in SAMPLE_JEANS:
            garment = db.query(Garment).filter(Garment.sku == jean_data["sku"]).first()

            if not garment:
                garment = Garment(
                    brand_id=brand.id,
                    sku=jean_data["sku"],
                    name=jean_data["name"],
                    fit=jean_data["fit"],
                    material=jean_data["material"],
                    description=jean_data["description"],
                    price=jean_data["price"],
                    is_processed=True,
                    available_sizes=jean_data["available_sizes"],
                    available_colors=jean_data["available_colors"],
                    # Legacy fields (first color)
                    color=jean_data["available_colors"][0]["name"],
                    size=jean_data["available_sizes"][1],  # default to second size (e.g. 30 or 28)
                )
                db.add(garment)
                db.commit()
                db.refresh(garment)

                # GarmentAsset (AI-processed, points to FRONT image)
                asset = GarmentAsset(
                    garment_id=garment.id,
                    ai_generated_image_url=jean_data["images"][0]["url"],
                    thumbnail_url=jean_data["images"][0]["url"],
                    status="COMPLETED",
                    metadata_json={
                        "source": "seed",
                        "fit": jean_data["fit"],
                        "colors": jean_data["available_colors"],
                    },
                )
                db.add(asset)

                # GarmentImages — FRONT / SIDE / BACK
                for img in jean_data["images"]:
                    gi = GarmentImage(
                        garment_id=garment.id,
                        image_url=img["url"],
                        image_type=img["type"],
                        sort_order=img["order"],
                    )
                    db.add(gi)

                db.commit()
                print(f"[OK] Jean '{jean_data['name']}' creado con {len(jean_data['images'])} fotos.")

            else:
                # Update existing fields
                garment.name = jean_data["name"]
                garment.price = jean_data["price"]
                garment.fit = jean_data["fit"]
                garment.material = jean_data["material"]
                garment.description = jean_data["description"]
                garment.available_sizes = jean_data["available_sizes"]
                garment.available_colors = jean_data["available_colors"]
                garment.is_processed = True
                db.commit()

                # Refresh images
                db.query(GarmentImage).filter(GarmentImage.garment_id == garment.id).delete()
                for img in jean_data["images"]:
                    gi = GarmentImage(
                        garment_id=garment.id,
                        image_url=img["url"],
                        image_type=img["type"],
                        sort_order=img["order"],
                    )
                    db.add(gi)

                # Refresh asset
                asset = db.query(GarmentAsset).filter(GarmentAsset.garment_id == garment.id).first()
                if asset:
                    asset.ai_generated_image_url = jean_data["images"][0]["url"]
                    asset.thumbnail_url = jean_data["images"][0]["url"]
                    asset.status = "COMPLETED"
                    asset.metadata_json = {
                        "source": "seed_update",
                        "fit": jean_data["fit"],
                        "colors": jean_data["available_colors"],
                    }

                db.commit()
                print(f"[UPDATE] Jean '{jean_data['name']}' actualizado.")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()

    print("\n[DONE] Database seeded successfully with 6 unique jeans!")


if __name__ == "__main__":
    seed()
