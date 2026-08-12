from app.domain.repositories.base import BaseRepository, CRUDBase
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.organization_repository import (
    CRUDMarketplace as MarketplaceRepository,
    CRUDBrand as BrandRepository,
    marketplace_repo,
    brand_repo,
)
from app.domain.repositories.garment_repository import (
    GarmentRepository,
    GarmentImageRepository,
    garment_repo,
    garment_image_repo,
)
from app.domain.repositories.avatar_repository import AvatarRepository, avatar_repo

__all__ = [
    "BaseRepository",
    "CRUDBase",
    "UserRepository",
    "MarketplaceRepository",
    "BrandRepository",
    "GarmentRepository",
    "GarmentImageRepository",
    "AvatarRepository",
    # singletons
    "marketplace_repo",
    "brand_repo",
    "garment_repo",
    "garment_image_repo",
    "avatar_repo",
]
