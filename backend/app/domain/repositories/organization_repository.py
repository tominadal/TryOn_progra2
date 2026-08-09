from typing import List
from sqlalchemy.orm import Session
from app.domain.repositories.base import CRUDBase
from app.domain.models.organization import Marketplace, Brand
from pydantic import BaseModel

class MarketplaceCreate(BaseModel):
    name: str
    domain: str | None = None
    is_active: bool = True

class MarketplaceUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    is_active: bool | None = None

class CRUDMarketplace(CRUDBase[Marketplace, MarketplaceCreate, MarketplaceUpdate]):
    def get_by_domain(self, db: Session, *, domain: str) -> Marketplace | None:
        return db.query(Marketplace).filter(Marketplace.domain == domain).first()

class BrandCreate(BaseModel):
    name: str
    description: str | None = None
    marketplace_id: int
    is_active: bool = True

class BrandUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None

class CRUDBrand(CRUDBase[Brand, BrandCreate, BrandUpdate]):
    def get_multi_by_marketplace(
        self, db: Session, *, marketplace_id: int, skip: int = 0, limit: int = 100
    ) -> List[Brand]:
        return (
            db.query(Brand)
            .filter(Brand.marketplace_id == marketplace_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

marketplace_repo = CRUDMarketplace(Marketplace)
brand_repo = CRUDBrand(Brand)
