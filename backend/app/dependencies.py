"""
Application-wide dependencies and factory functions for Dependency Injection.

Este modulo es el punto de entrada para obtener la estrategia de IA configurada.
Usando StrategyFactory, los routers solo ven la interfaz VirtualTryOnStrategy
(Dependency Inversion Principle) y no saben si estan hablando con Gemini o Mock.

Relacion con Factory Pattern (GoF):
    StrategyFactory es el Creator. Sus metodos son Factory Methods que
    producen distintas configuraciones del Product (VirtualTryOnStrategy).
    Los consumers (catalog.py) piden un producto sin saber como se construye.
"""
from app.config.settings import settings
from app.services.ai_strategy import VirtualTryOnStrategy
from app.services.strategy_factory import StrategyFactory

# Instancia unica de la fabrica — stateless, segura para reutilizar
_strategy_factory = StrategyFactory(settings)


def get_base_tryon_strategy() -> VirtualTryOnStrategy:
    """
    Retorna la estrategia base sin decoradores.
    Util para tests que necesitan aislar el comportamiento del ConcreteProduct.

    Returns:
        MockTryOnStrategy o GeminiTryOnStrategy segun USE_MOCK_AI.
    """
    return _strategy_factory._create_base()


def get_tryon_strategy(with_cache: bool = False) -> VirtualTryOnStrategy:
    """
    Retorna la estrategia configurada segun el modo de uso.

    Args:
        with_cache: si True, incluye CachingStrategyDecorator en la cadena.
                    Usar con_cache=True para procesamiento masivo de Excel.
                    Usar with_cache=False para procesamiento individual.

    Returns:
        VirtualTryOnStrategy correctamente decorada:
        - with_cache=True:  Logging(Cache(Gemini|Mock))
        - with_cache=False: Logging(Gemini|Mock)
    """
    if with_cache:
        return _strategy_factory.create_bulk_catalog()
    return _strategy_factory.create_single_garment()


def get_garment_tryon_strategy() -> VirtualTryOnStrategy:
    """
    FastAPI dependency provider para procesamiento individual de prendas.
    Puede ser sobreescrita en tests via app.dependency_overrides.

    Returns:
        Estrategia sin cache, con logging: Logging(Gemini|Mock).
    """
    return _strategy_factory.create_single_garment()
