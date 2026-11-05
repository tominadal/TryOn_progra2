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
    ProcessingJobRepository,
    garment_repo,
    garment_image_repo,
    job_repo,
)
from app.domain.repositories.avatar_repository import AvatarRepository, avatar_repo
from app.domain.repositories.commerce_repository import (
    CartRepository,
    OrderRepository,
    cart_repo,
    order_repo,
)

__all__ = [
    "BaseRepository",
    "CRUDBase",
    "UserRepository",
    "MarketplaceRepository",
    "BrandRepository",
    "GarmentRepository",
    "GarmentImageRepository",
    "ProcessingJobRepository",
    "AvatarRepository",
    "CartRepository",
    "OrderRepository",
    # singletons
    "marketplace_repo",
    "brand_repo",
    "garment_repo",
    "garment_image_repo",
    "job_repo",
    "avatar_repo",
    "cart_repo",
    "order_repo",
]
