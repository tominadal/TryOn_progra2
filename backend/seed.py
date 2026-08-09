"""
Seed script for TryOnHub database.
Populates initial roles, users, marketplace, brand, and sample garments.

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
from app.domain.models.catalog import Garment, GarmentAsset
from app.domain.models.experience import Avatar
from app.domain.models.commerce import Cart, CartItem, Order, OrderItem

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use the same DB as the app (reads from .env via settings or uses SQLite default)
try:
    from app.config.settings import settings
    DATABASE_URL = settings.DATABASE_URL
except Exception:
    DATABASE_URL = "sqlite:///./tryon_db.sqlite"


def seed():
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created.")

    db = SessionLocal()

    try:
        # ── 1. Roles ───────────────────────────────────────────────────────────
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
            print(f"✅ {len(roles_data)} roles created.")
        else:
            print("⚠️  Roles already exist — skipping.")

        roles = db.query(Role).all()
        role_map = {r.name: r.id for r in roles}

        # ── 2. Marketplace ─────────────────────────────────────────────────────
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
            print("✅ Marketplace created.")
        else:
            print("⚠️  Marketplace already exists — skipping.")

        # ── 3. Brand ───────────────────────────────────────────────────────────
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
            print("✅ Brand 'Acme Denim' created.")
        else:
            print("⚠️  Brand already exists — skipping.")

        # ── 4. Users ───────────────────────────────────────────────────────────
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
                print(f"✅ User '{u_data['email']}' created.")
            else:
                print(f"⚠️  User '{u_data['email']}' already exists — skipping.")
        db.commit()

        # ── 5. Sample Garments ─────────────────────────────────────────────────
        sample_garments = [
            {
                "sku": "ACME-001",
                "name": "Classic Blue Jeans",
                "fit": "Regular",
                "size": "M",
                "color": "Blue",
                "price": 89.99,
                "is_processed": True,
                "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800",
            },
            {
                "sku": "ACME-002",
                "name": "Slim Fit Black",
                "fit": "Slim",
                "size": "S",
                "color": "Black",
                "price": 95.50,
                "is_processed": True,
                "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800",
            },
            {
                "sku": "ACME-003",
                "name": "Skinny Ripped",
                "fit": "Skinny",
                "size": "L",
                "color": "Light Blue",
                "price": 79.00,
                "is_processed": True,
                "image_url": "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?auto=format&fit=crop&q=80&w=800",
            },
        ]

        for g_data in sample_garments:
            exists = db.query(Garment).filter(Garment.sku == g_data["sku"]).first()
            if not exists:
                garment = Garment(brand_id=brand.id, **g_data)
                db.add(garment)
                db.commit()
                db.refresh(garment)

                # Create associated GarmentAsset
                asset = GarmentAsset(
                    garment_id=garment.id,
                    ai_generated_image_url=g_data["image_url"],
                    metadata_json={"source": "seed", "fit": g_data["fit"]},
                )
                db.add(asset)
                db.commit()
                print(f"✅ Garment '{g_data['name']}' created.")
            else:
                print(f"⚠️  Garment SKU '{g_data['sku']}' already exists — skipping.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()

    print("\n🎉 Database seeded successfully!")
    print("   Credentials: admin@tryon.com / 123456")
    print("               brand@tryon.com / 123456")
    print("               cliente@tryon.com / 123456")


if __name__ == "__main__":
    seed()
