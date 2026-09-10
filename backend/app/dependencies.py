"""
Application-wide dependencies and factory functions for Dependency Injection.
"""
from app.config.settings import settings
from app.services.ai_strategy import (
    VirtualTryOnStrategy,
    GeminiTryOnStrategy,
    MockTryOnStrategy,
)
from app.services.strategy_decorators import (
    LoggingStrategyDecorator,
    CachingStrategyDecorator,
)


def get_base_tryon_strategy() -> VirtualTryOnStrategy:
    """
    Factory function returning the base VirtualTryOnStrategy.
    Instantiates MockTryOnStrategy if USE_MOCK_AI is True, otherwise GeminiTryOnStrategy.
    """
    if settings.USE_MOCK_AI:
        return MockTryOnStrategy()
    return GeminiTryOnStrategy()


def get_tryon_strategy(with_cache: bool = False) -> VirtualTryOnStrategy:
    """
    Factory function returning the configured try-on strategy wrapped with decorators.
    - LoggingStrategyDecorator is always applied.
    - CachingStrategyDecorator is applied when with_cache=True (e.g. bulk excel processing).
    """
    base = get_base_tryon_strategy()
    if with_cache:
        return LoggingStrategyDecorator(CachingStrategyDecorator(base))
    return LoggingStrategyDecorator(base)


def get_garment_tryon_strategy() -> VirtualTryOnStrategy:
    """
    FastAPI dependency provider for single garment processing (e.g. catalog dashboard creation).
    Can be overridden in tests via app.dependency_overrides[get_garment_tryon_strategy].
    """
    return get_tryon_strategy(with_cache=False)
