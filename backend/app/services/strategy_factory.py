"""
Factory Pattern implementation for VirtualTryOnStrategy creation.

Factory Pattern (GoF) — aplicado a la creación de estrategias de IA:

    El problema que resuelve:
        Sin Factory, el código cliente (catalog.py, dependencies.py) necesita
        saber CÓMO construir la estrategia: qué clase concreta instanciar,
        con qué decoradores, y en qué orden. Eso acopla la lógica de creación
        a la lógica de uso, violando el Single Responsibility Principle.

    La solución:
        StrategyFactory centraliza la lógica de creación en un único lugar.
        El cliente sólo pide "dame una estrategia para lote" o "para prenda única",
        sin saber nada de GeminiTryOnStrategy, MockTryOnStrategy ni decoradores.

    Diagrama conceptual:

        StrategyFactory                    <- Creator
        +-- create_single_garment()        <- Factory Method
        +-- create_bulk_catalog()          <- Factory Method

        VirtualTryOnStrategy               <- Product (abstracto)
        +-- GeminiTryOnStrategy            <- ConcreteProduct
        +-- MockTryOnStrategy              <- ConcreteProduct
        +-- StrategyDecorator (wrapping)   <- ConcreteProduct decorado

    Principios SOLID aplicados:
        - SRP: la responsabilidad de "construir la cadena de decoradores" vive
          exclusivamente aquí.
        - OCP: agregar una nueva estrategia (OpenAIStrategy) solo requiere
          editar este archivo, no los routers.
        - DIP: los routers dependen de VirtualTryOnStrategy (abstraccion),
          no de Gemini/Mock (implementaciones concretas).

    Uso:
        factory = StrategyFactory(settings)
        strategy = factory.create_bulk_catalog()   # Logging + Cache + Gemini/Mock
        result = strategy.process_garment(data)
"""
from app.config.settings import Settings
from app.services.ai_strategy import VirtualTryOnStrategy, GeminiTryOnStrategy, MockTryOnStrategy
from app.services.strategy_decorators import LoggingStrategyDecorator, CachingStrategyDecorator


class StrategyFactory:
    """
    Fabrica centralizada de estrategias de procesamiento de prendas.

    Encapsula toda la logica de instanciacion y composicion de decoradores.
    Los routers y servicios solo conocen la interfaz VirtualTryOnStrategy,
    no las clases concretas ni el orden de los decoradores.

    Atributos:
        _settings: instancia de Settings inyectada para decidir Gemini vs Mock.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _create_base(self) -> VirtualTryOnStrategy:
        """
        Instancia el ConcreteProduct base segun configuracion de entorno.

        Returns:
            MockTryOnStrategy si USE_MOCK_AI es True (util en tests/dev).
            GeminiTryOnStrategy si USE_MOCK_AI es False (produccion).
        """
        if self._settings.USE_MOCK_AI:
            return MockTryOnStrategy()
        return GeminiTryOnStrategy()

    def create_single_garment(self) -> VirtualTryOnStrategy:
        """
        Crea la estrategia para procesamiento individual de prendas
        (ej: dashboard de marca, un unico POST /catalog/garment).

        Aplica unicamente LoggingStrategyDecorator — sin cache, porque
        en el flujo individual la probabilidad de imagen duplicada es baja
        y queremos el descriptor fresco para cada nueva prenda.

        Returns:
            LoggingStrategyDecorator(GeminiTryOnStrategy | MockTryOnStrategy)
        """
        base = self._create_base()
        return LoggingStrategyDecorator(base)

    def create_bulk_catalog(self) -> VirtualTryOnStrategy:
        """
        Crea la estrategia para procesamiento masivo de catalogos Excel
        (ej: POST /catalog/upload, process_catalog_background).

        Aplica la cadena completa: Logging -> Cache -> Gemini/Mock.
        El CachingStrategyDecorator evita llamadas duplicadas a Gemini
        cuando el Excel contiene la misma imagen en multiples filas
        (escenario comun en catalogos B2B con variantes de talle/color).

        Returns:
            LoggingStrategyDecorator(CachingStrategyDecorator(GeminiTryOnStrategy | MockTryOnStrategy))
        """
        base = self._create_base()
        cached = CachingStrategyDecorator(base)
        return LoggingStrategyDecorator(cached)
