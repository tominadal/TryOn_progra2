"""
Factory Pattern implementation for VirtualTryOnStrategy creation.

Factory Pattern (GoF) — aplicado a la creación de estrategias de IA:

    El problema que resuelve:
        Sin Factory, el código cliente (catalog.py, dependencies.py) necesita
        saber CÓMO construir la estrategia: qué clase concreta instanciar,
        con qué decoradores, y en qué orden. Eso acopla la lógica de creación
        a la lógica de uso, violando el Single Responsibility Principle.

    La solución (Factory Method + Simple Factory parametrizada):
        IStrategyFactory define la interfaz abstracta Creator (Factory Method),
        y StrategyFactory centraliza la lógica de creación concreta en un único lugar.
        El cliente sólo pide "dame una estrategia para lote" o "para prenda única",
        sin saber nada de GeminiTryOnStrategy, MockTryOnStrategy ni decoradores.

    Diagrama conceptual:

        IStrategyFactory (ABC)             <- Abstract Creator (Factory Method)
        +-- StrategyFactory                <- Concrete Creator
            +-- create_single_garment()    <- Factory Method
            +-- create_bulk_catalog()      <- Factory Method

        VirtualTryOnStrategy               <- Product (abstracto)
        +-- GeminiTryOnStrategy            <- ConcreteProduct
        +-- MockTryOnStrategy              <- ConcreteProduct
        +-- StrategyDecorator (wrapping)   <- ConcreteProduct decorado

    Principios SOLID aplicados:
        - SRP: la responsabilidad de "construir la cadena de decoradores" vive
          exclusivamente aquí.
        - OCP: agregar una nueva estrategia (OpenAIStrategy) o fábrica nueva
          solo requiere extender este módulo, no los routers.
        - DIP: los routers dependen de VirtualTryOnStrategy e IStrategyFactory
          (abstracciones), no de Gemini/Mock (implementaciones concretas).
"""
from abc import ABC, abstractmethod
from app.config.settings import Settings
from app.services.ai_strategy import VirtualTryOnStrategy, GeminiTryOnStrategy, MockTryOnStrategy
from app.services.strategy_decorators import LoggingStrategyDecorator, CachingStrategyDecorator


class IStrategyFactory(ABC):
    """
    Interfaz abstracta Creator para el patrón Factory Method.
    Define el contrato de creación de estrategias de procesamiento 3D.
    """

    @abstractmethod
    def create_single_garment(self) -> VirtualTryOnStrategy:
        """Crea la estrategia configurada para el alta o edición individual."""
        pass

    @abstractmethod
    def create_bulk_catalog(self) -> VirtualTryOnStrategy:
        """Crea la estrategia configurada para el procesamiento masivo por lotes."""
        pass


class StrategyFactory(IStrategyFactory):
    """
    Fábrica concreta centralizada de estrategias de procesamiento de prendas.

    Encapsula toda la lógica de instanciación y composición de decoradores.
    Los routers y servicios solo conocen la interfaz VirtualTryOnStrategy,
    no las clases concretas ni el orden de los decoradores.

    Atributos:
        _settings: instancia de Settings inyectada para decidir Gemini vs Mock.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _create_base(self) -> VirtualTryOnStrategy:
        """
        Instancia el ConcreteProduct base según configuración de entorno.

        Returns:
            MockTryOnStrategy si USE_MOCK_AI es True (útil en tests/dev).
            GeminiTryOnStrategy si USE_MOCK_AI es False (producción).
        """
        if self._settings.USE_MOCK_AI:
            return MockTryOnStrategy()
        return GeminiTryOnStrategy()

    def create_single_garment(self) -> VirtualTryOnStrategy:
        """
        Crea la estrategia para procesamiento individual de prendas
        (ej: dashboard de marca, POST /catalog/garment o PUT /catalog/garments/{id}).

        Aplica únicamente LoggingStrategyDecorator — sin caché, porque
        en el flujo individual la probabilidad de imagen duplicada es baja
        y queremos el descriptor fresco para cada prenda.

        Returns:
            LoggingStrategyDecorator(GeminiTryOnStrategy | MockTryOnStrategy)
        """
        base = self._create_base()
        return LoggingStrategyDecorator(base)

    def create_bulk_catalog(self) -> VirtualTryOnStrategy:
        """
        Crea la estrategia para procesamiento masivo de catálogos Excel
        (ej: POST /catalog/upload, process_catalog_background).

        Aplica la cadena completa: Logging -> Cache -> Gemini/Mock.
        El CachingStrategyDecorator evita llamadas duplicadas a Gemini
        cuando el Excel contiene la misma imagen en múltiples filas
        (escenario común en catálogos B2B con variantes de talle/color).

        Returns:
            LoggingStrategyDecorator(CachingStrategyDecorator(GeminiTryOnStrategy | MockTryOnStrategy))
        """
        base = self._create_base()
        cached = CachingStrategyDecorator(base)
        return LoggingStrategyDecorator(cached)
