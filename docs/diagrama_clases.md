# Diagrama de Clases UML: Modelos de Dominio + Patrones de Diseño

Este diagrama describe las clases principales de TryOnHub y cómo interactúan, siguiendo las convenciones UML recomendadas en clase (usando **atributos** para tipos de datos primitivos y **asociaciones** para relaciones significativas entre clases).

## Modelo de Dominio

```mermaid
classDiagram
    class User {
        +Integer id
        +String email
        -String hashed_password
        +String full_name
        +Boolean is_active
        +Datetime created_at
        +Datetime updated_at
        +login() Token
        +logout() void
    }

    class Role {
        +Integer id
        +String name
        +String description
    }

    class Marketplace {
        +Integer id
        +String name
        +String domain
        +Boolean is_active
    }

    class Avatar {
        +Integer id
        +String skin_color
        +Float height_cm
        +Float weight_kg
        +String gender
        +String body_type
        +Float muscle_definition
        +String hair_color
        +String hair_style
        +Boolean glasses
        +saveAnatomy() void
    }

    class Garment {
        +Integer id
        +String sku
        +String name
        +String fit
        +String size
        +String color
        +Float price
        +Boolean is_processed
        +processWithAI() void
    }

    class GarmentAsset {
        +Integer id
        +String ai_generated_image_url
        +JSON metadata_json
    }

    class Brand {
        +Integer id
        +String name
        +String description
        +uploadGarment() Garment
    }

    class Cart {
        +Integer id
        +Datetime created_at
        +Datetime updated_at
        +getTotal() Float
    }

    class CartItem {
        +Integer id
        +Integer quantity
        +calculateSubtotal() Float
    }

    class Order {
        +Integer id
        +Float total_amount
        +String status
        +Datetime created_at
    }

    class OrderItem {
        +Integer id
        +Float price
        +Integer quantity
    }

    %% Asociaciones de dominio
    User "1" --> "1" Role : tiene
    User "1" --> "0..*" Avatar : posee
    User "1" --> "0..1" Cart : tiene
    User "1" --> "*" Order : realiza
    User "1" --> "0..1" Brand : administra (si es marca)
    User "1" --> "0..1" Marketplace : administra (si es dueño)

    Brand "1" --> "1" Marketplace : publica en
    Brand "1" --> "*" Garment : vende

    Cart "1" --> "*" CartItem : contiene
    CartItem "*" --> "1" Garment : referencia

    Garment "1" --> "0..1" GarmentAsset : contiene 3D
    Garment "1" --> "*" OrderItem : referenciada en

    Order "1" --> "*" OrderItem : contiene
```

---

## Patrones de Diseño

### Strategy Pattern — `ai_strategy.py`

```mermaid
classDiagram
    class VirtualTryOnStrategy {
        <<abstract>>
        +process_garment(garment_data: dict) dict*
    }

    class GeminiTryOnStrategy {
        -_sdk: str
        -_model: GenerativeModel
        +process_garment(garment_data: dict) dict
        -_fetch_image_b64(image_url: str) tuple
        -_text_fallback(garment_data, error) dict
    }

    class MockTryOnStrategy {
        +process_garment(garment_data: dict) dict
    }

    class AIServiceError {
        <<exception>>
    }

    VirtualTryOnStrategy <|-- GeminiTryOnStrategy : implementa
    VirtualTryOnStrategy <|-- MockTryOnStrategy : implementa
    GeminiTryOnStrategy ..> AIServiceError : lanza
```

---

### Factory Pattern — `strategy_factory.py`

```mermaid
classDiagram
    class StrategyFactory {
        -_settings: Settings
        +__init__(settings: Settings)
        +create_single_garment() VirtualTryOnStrategy
        +create_bulk_catalog() VirtualTryOnStrategy
        -_create_base() VirtualTryOnStrategy
    }

    class VirtualTryOnStrategy {
        <<abstract>>
        +process_garment(garment_data: dict) dict*
    }

    class GeminiTryOnStrategy {
        +process_garment(garment_data: dict) dict
    }

    class MockTryOnStrategy {
        +process_garment(garment_data: dict) dict
    }

    StrategyFactory ..> VirtualTryOnStrategy : crea (Product)
    StrategyFactory ..> GeminiTryOnStrategy : instancia si USE_MOCK_AI=False
    StrategyFactory ..> MockTryOnStrategy : instancia si USE_MOCK_AI=True
    VirtualTryOnStrategy <|-- GeminiTryOnStrategy : implementa
    VirtualTryOnStrategy <|-- MockTryOnStrategy : implementa
```

**Justificación:**
El Factory centraliza la construcción de la cadena `Logging(Cache(Gemini|Mock))`. Los routers piden `create_bulk_catalog()` o `create_single_garment()` sin saber cuántos decoradores se apilan ni qué ConcreteProduct se usa. Cumple **SRP** (la lógica de construcción vive en un lugar) y **DIP** (los routers dependen de `VirtualTryOnStrategy`, no de `Gemini`).



### Decorator Pattern — `strategy_decorators.py`

```mermaid
classDiagram
    class VirtualTryOnStrategy {
        <<abstract>>
        +process_garment(garment_data: dict) dict*
    }

    class StrategyDecorator {
        <<abstract>>
        -_wrapped: VirtualTryOnStrategy
        +__init__(wrapped: VirtualTryOnStrategy)
        +process_garment(garment_data: dict) dict*
    }

    class LoggingStrategyDecorator {
        +process_garment(garment_data: dict) dict
    }

    class CachingStrategyDecorator {
        -_cache: dict
        +process_garment(garment_data: dict) dict
        +cache_size() int
        +clear_cache() void
    }

    VirtualTryOnStrategy <|-- StrategyDecorator : hereda tipo
    StrategyDecorator <|-- LoggingStrategyDecorator : extiende
    StrategyDecorator <|-- CachingStrategyDecorator : extiende
    StrategyDecorator "1" o--> "1" VirtualTryOnStrategy : envuelve (composición)
```

---

### Observer Pattern — `job_observers.py`

```mermaid
classDiagram
    class IJobObserver {
        <<abstract>>
        +update(job_id, old_status, new_status, context) void*
    }

    class LoggingJobObserver {
        +update(job_id, old_status, new_status, context) void
    }

    class StatsJobObserver {
        +jobs_completed: int
        +jobs_failed: int
        +total_garments_processed: int
        +update(job_id, old_status, new_status, context) void
        +summary() dict
    }

    class JobSubjectMixin {
        -_observers: list
        +register_observer(observer: IJobObserver) void
        +remove_observer(observer: IJobObserver) void
        +notify_observers(old_status, new_status, context) void
    }

    class ProcessingJob {
        +Integer id
        +Integer brand_id
        +JobStatus status
        +Integer total_items
        +Integer processed_items
        +JSON error_log
    }

    IJobObserver <|-- LoggingJobObserver : implementa
    IJobObserver <|-- StatsJobObserver : implementa
    JobSubjectMixin <|-- ProcessingJob : hereda (mixin)
    JobSubjectMixin "1" --> "*" IJobObserver : notifica
```

---

### Justificación de Diseño

*   **Atributos vs Asociaciones**: Los datos primitivos (como `skin_color` o `price`) están modelados como *Atributos* internos, mientras que las relaciones de dominio importante están modeladas como *Asociaciones* (flechas).
*   **Encapsulamiento**: Campos sensibles como la contraseña (`hashed_password`) se modelan con visibilidad privada (`-`).
*   **Cart como entidad intermedia**: El `Cart` es una entidad propia porque tiene identidad propia, timestamps y puede persistir entre sesiones. Un `User` tiene exactamente un `Cart` (composición 1..1).
*   **Strategy Pattern**: Permite que el backend de IA evolucione independientemente de los routers. Cambiar de Gemini a OpenAI requiere cero cambios fuera de `ai_strategy.py`.
*   **Decorator Pattern**: Añade logging y caché a la estrategia de IA en runtime, sin modificar `GeminiTryOnStrategy` (Open/Closed Principle). Igual al ejemplo de Starbuzz Coffee del libro.
*   **Observer Pattern**: Desacopla el sistema de notificaciones del procesamiento de jobs. `NotificationJobObserver` fue agregado sin modificar `ProcessingJob` ni los observers existentes — demostración directa de OCP.
*   **Factory Pattern** *(nuevo)*: `StrategyFactory` centraliza la construcción de la cadena de decoradores. Antes, `dependencies.py` armaba la cadena inline; ahora ese conocimiento vive en un único lugar (SRP). Los routers solo conocen `VirtualTryOnStrategy` (DIP).
*   **SRP en `validators.py`** *(nuevo)*: La lógica de validación de magic bytes, columnas Excel y parseo de precios fue extraída a su propio módulo. `catalog.py` tiene ahora una sola razón para cambiar: la lógica de negocio del catálogo.

> Para el mapeo completo de principios SOLID al código, ver [`patrones_solid.md`](patrones_solid.md).

