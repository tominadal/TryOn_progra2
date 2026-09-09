"""
Decorator Pattern implementation over VirtualTryOnStrategy.

Decorator Pattern (GoF) — igual al ejemplo de Starbuzz Coffee de Head First Design Patterns:
    El 'Component' es VirtualTryOnStrategy (ya definido en ai_strategy.py).
    Los 'ConcreteComponents' son GeminiTryOnStrategy y MockTryOnStrategy.
    Este archivo introduce el 'Decorator' abstracto y los 'ConcreteDecorators'.

Jerarquía:
    VirtualTryOnStrategy        ← Component abstracto (ya existe)
    ├── GeminiTryOnStrategy     ← ConcreteComponent (ya existe)
    ├── MockTryOnStrategy       ← ConcreteComponent (ya existe)
    └── StrategyDecorator       ← Decorator abstracto (este archivo)
        ├── LoggingStrategyDecorator   — loguea imagen, tiempo y resultado de cada llamada a la IA
        └── CachingStrategyDecorator   — cachea resultados por hash MD5 de la imagen (evita doble llamada a Gemini)

Justificación de diseño (Oral Defense):
    Aplicamos Decorator igual que Starbuzz Coffee: en lugar de heredar para añadir logging o caché,
    ENVOLVEMOS la estrategia en runtime. Cumple Open/Closed: GeminiTryOnStrategy no se toca.

Uso en catalog.py:
    strategy = LoggingStrategyDecorator(
        CachingStrategyDecorator(
            GeminiTryOnStrategy()
        )
    )
    result = strategy.process_garment(garment_data)
"""
import hashlib
import logging
import time
from abc import abstractmethod

from app.services.ai_strategy import VirtualTryOnStrategy

logger = logging.getLogger(__name__)


class StrategyDecorator(VirtualTryOnStrategy):
    """
    Decorator abstracto: mantiene una referencia al Component envuelto
    y conforma a la misma interfaz VirtualTryOnStrategy (herencia de tipo).
    El comportamiento real se delega al wrapped strategy (composición).
    """

    def __init__(self, wrapped: VirtualTryOnStrategy) -> None:
        self._wrapped = wrapped

    @abstractmethod
    def process_garment(self, garment_data: dict) -> dict:
        pass


class LoggingStrategyDecorator(StrategyDecorator):
    """
    ConcreteDecorator que agrega logging detallado antes y después
    de delegar al proceso de IA envuelto.

    Registra:
    - La URL de imagen analizada.
    - El tiempo de latencia de la llamada a la IA.
    - Si el resultado proviene de caché o del modelo en vivo.
    - El fit_label y source del descriptor devuelto.
    """

    def process_garment(self, garment_data: dict) -> dict:
        image_url = garment_data.get("image_url") or garment_data.get("ImageURL") or "(sin imagen)"
        garment_name = garment_data.get("Name") or garment_data.get("name") or "(desconocida)"

        logger.info(
            "[Decorator:Logging] Iniciando análisis AI | prenda='%s' | imagen='%s'",
            garment_name,
            image_url,
        )
        t0 = time.perf_counter()

        # Delegamos al siguiente en la cadena (otro decorador o el ConcreteComponent)
        result = self._wrapped.process_garment(garment_data)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        source = result.get("metadata_json", {}).get("source", "desconocido")

        logger.info(
            "[Decorator:Logging] Análisis completado | prenda='%s' | source='%s' | tiempo=%.1fms",
            garment_name,
            source,
            elapsed_ms,
        )
        return result


class CachingStrategyDecorator(StrategyDecorator):
    """
    ConcreteDecorator que cachea resultados de process_garment en memoria,
    usando el hash MD5 de la URL de imagen como clave.

    Valor real:
    - Evita llamar a la API de Gemini Vision dos veces para la misma fotografía
      (ej: marca sube el mismo Excel dos veces, o envía el mismo SKU en lotes distintos).
    - En un lote de 100 prendas con 20% de imágenes duplicadas, ahorra hasta 20 llamadas API.

    Nota: la caché es por instancia (en memoria). Para persistencia entre requests
    se podría extender a Redis o similar sin cambiar GeminiTryOnStrategy.
    """

    def __init__(self, wrapped: VirtualTryOnStrategy) -> None:
        super().__init__(wrapped)
        self._cache: dict[str, dict] = {}

    def _cache_key(self, garment_data: dict) -> str:
        """Genera clave de caché basada en el hash MD5 de la URL de imagen."""
        image_url = garment_data.get("image_url") or garment_data.get("ImageURL") or ""
        return hashlib.md5(image_url.encode()).hexdigest()

    def process_garment(self, garment_data: dict) -> dict:
        key = self._cache_key(garment_data)

        if key in self._cache:
            logger.info(
                "[Decorator:Cache] HIT para imagen hash='%s' — omitiendo llamada a Gemini", key
            )
            cached = dict(self._cache[key])
            # Marcamos el source para trazabilidad
            if isinstance(cached.get("metadata_json"), dict):
                cached["metadata_json"] = {
                    **cached["metadata_json"],
                    "source": "cache",
                }
            return cached

        logger.info("[Decorator:Cache] MISS para hash='%s' — llamando a estrategia AI", key)
        result = self._wrapped.process_garment(garment_data)
        self._cache[key] = result
        return result

    def cache_size(self) -> int:
        """Retorna la cantidad de entradas en caché (útil para métricas y tests)."""
        return len(self._cache)

    def clear_cache(self) -> None:
        """Vacía la caché (útil para tests o gestión manual)."""
        self._cache.clear()
