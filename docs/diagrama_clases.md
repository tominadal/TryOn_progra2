# Diagramas UML Estructurales y de Estado — TryOnHub

Este documento presenta los diagramas estructurales y de comportamiento de **TryOnHub** siguiendo las convenciones de [`UML.pdf`](../../MaterialClase/UML.pdf):
1. **Diagrama de Clases del Modelo de Dominio**
2. **Diagrama de Clases de los Patrones GoF (Strategy, Factory Method, Decorator, Observer)**
3. **Diagrama de Clases del Patrón Repository**
4. **Diagramas de Estado (`ProcessingJob` y `Order`)**
5. **Diagrama de Componentes y Despliegue (Arquitectura multicapa)**

---

## 1. Modelo de Dominio (`app/domain/models/`)

```mermaid
classDiagram
    class User {
        +Integer id
        +String email
        -String hashed_password
        +String full_name
        +Boolean is_active
        +Integer role_id
        +Integer brand_id
        +Integer marketplace_id
        +Datetime created_at
        +Datetime updated_at
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

    class Brand {
        +Integer id
        +String name
        +String description
        +Integer marketplace_id
        +Boolean is_active
    }

    class Avatar {
        +Integer id
        +Integer user_id
        +String name
        +String avatar_3d_url
        +Float height_cm
        +Float weight_kg
        +JSON body_type
        +Float muscle_definition
        +String skin_color
        +String hair_color
        +String hair_style
        +Boolean glasses
        +String gender
    }

    class Garment {
        +Integer id
        +Integer brand_id
        +String sku
        +String name
        +String fit
        +String material
        +String size
        +String color
        +Float price
        +Boolean is_processed
        +JSON available_sizes
        +JSON available_colors
        +String description
    }

    class GarmentAsset {
        +Integer id
        +Integer garment_id
        +String ai_generated_image_url
        +String thumbnail_url
        +String status
        +JSON metadata_json
    }

    class GarmentImage {
        +Integer id
        +Integer garment_id
        +String image_url
        +String image_type
        +Integer sort_order
    }

    class ProcessingJob {
        +Integer id
        +Integer brand_id
        +JobStatus status
        +Integer total_items
        +Integer processed_items
        +JSON error_log
    }

    class Cart {
        +Integer id
        +Integer user_id
        +Datetime created_at
        +Datetime updated_at
    }

    class CartItem {
        +Integer id
        +Integer cart_id
        +Integer garment_id
        +Integer quantity
        +String size
        +String color
    }

    class Order {
        +Integer id
        +Integer user_id
        +Float total_amount
        +OrderStatus status
        +Datetime created_at
    }

    class OrderItem {
        +Integer id
        +Integer order_id
        +Integer garment_id
        +Float price
        +Integer quantity
        +String size
        +String color
    }

    User "*" --> "1" Role : tiene
    User "1" --> "0..10" Avatar : posee (Multi-Avatar)
    User "1" --> "0..1" Cart : posee
    User "1" --> "*" Order : realiza
    User "*" --> "0..1" Brand : administra
    User "*" --> "0..1" Marketplace : administra

    Brand "*" --> "1" Marketplace : publica en
    Brand "1" --> "*" Garment : posee catálogo
    Brand "1" --> "*" ProcessingJob : ejecuta lotes

    Garment "1" *-- "0..1" GarmentAsset : contiene 3D
    Garment "1" *-- "*" GarmentImage : galería
    Garment "1" --> "*" CartItem : referenciada en
    Garment "0..1" --> "*" OrderItem : histórico

    Cart "1" *-- "*" CartItem : contiene líneas
    Order "1" *-- "*" OrderItem : contiene ítems
```

---

## 2. Patrones de Diseño GoF

### 2.1. Strategy Pattern (`app/services/ai_strategy.py`)

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
    }

    class MockTryOnStrategy {
        +process_garment(garment_data: dict) dict
    }

    class AIServiceError {
        <<exception>>
    }

    VirtualTryOnStrategy <|-- GeminiTryOnStrategy : implementa
    VirtualTryOnStrategy <|-- MockTryOnStrategy : implementa
    GeminiTryOnStrategy ..> AIServiceError : lanza en fallo
```

---

### 2.2. Factory Method Pattern (`app/services/strategy_factory.py`)

```mermaid
classDiagram
    class IStrategyFactory {
        <<abstract>>
        +create_single_garment() VirtualTryOnStrategy*
        +create_bulk_catalog() VirtualTryOnStrategy*
    }

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

    IStrategyFactory <|-- StrategyFactory : implementa (ConcreteCreator)
    StrategyFactory ..> VirtualTryOnStrategy : ensambla y retorna
```

---

### 2.3. Decorator Pattern (`app/services/strategy_decorators.py`)

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

    VirtualTryOnStrategy <|-- StrategyDecorator : hereda tipo (LSP)
    StrategyDecorator <|-- LoggingStrategyDecorator : extiende
    StrategyDecorator <|-- CachingStrategyDecorator : extiende
    StrategyDecorator "1" o--> "1" VirtualTryOnStrategy : envuelve (composición)
```

---

### 2.4. Observer Pattern (`app/services/job_observers.py`)

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

    class NotificationJobObserver {
        -_notify_on: set
        +notifications: list
        +update(job_id, old_status, new_status, context) void
        +get_notifications(brand_id: int) list
        +clear_notifications() void
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
    IJobObserver <|-- NotificationJobObserver : implementa
    JobSubjectMixin <|-- ProcessingJob : hereda (Subject)
    JobSubjectMixin "1" --> "*" IJobObserver : notifica (Push)
```

---

## 3. Patrón Repository (`app/domain/repositories/`)

```mermaid
classDiagram
    class BaseRepository~ModelType~ {
        +model: Type
        +get(db, id) ModelType
        +get_all(db, skip, limit) List
        +create(db, obj_in) ModelType
        +delete(db, id) bool
    }

    class CRUDBase~ModelType, CreateSchema, UpdateSchema~ {
        +get(db, id) ModelType
        +get_all(db, skip, limit) List
        +create(db, obj_in) ModelType
        +update(db, db_obj, obj_in) ModelType
        +delete(db, id) bool
    }

    class GarmentRepository {
        +count(db) int
        +get_by_sku(db, sku) Garment
        +get_processed(db, skip, limit) List
        +get_by_brand(db, brand_id, skip, limit) List
        +get_by_fit(db, fit) List
        +delete_with_relations(db, garment) void
    }

    class ProcessingJobRepository {
        +create_job(db, brand_id, total_items) ProcessingJob
        +get_by_brand(db, brand_id, limit) List
    }

    class AvatarRepository {
        +list_by_user(db, user_id) List
        +count_by_user(db, user_id) int
        +get_by_id_for_user(db, avatar_id, user_id) Avatar
        +create_for_user(db, user_id, avatar_in) Avatar
        +update_avatar(db, db_avatar, avatar_in) Avatar
    }

    class CartRepository {
        +get_by_user(db, user_id) Cart
        +get_by_user_with_items(db, user_id) Cart
        +get_or_create_for_user(db, user_id) Cart
        +add_or_increment_item(db, cart, ...) CartItem
        +update_item_quantity(db, item, quantity) CartItem
        +remove_item(db, item) void
        +clear_for_user(db, user_id) int
    }

    class OrderRepository {
        +create_from_cart(db, user_id, cart) Order
        +get_by_user_with_items(db, user_id) List
    }

    CRUDBase <|-- GarmentRepository
    BaseRepository <|-- ProcessingJobRepository
    BaseRepository <|-- AvatarRepository
    BaseRepository <|-- CartRepository
    BaseRepository <|-- OrderRepository
```

---

## 4. Diagramas de Estado UML (`UML.pdf` — Comportamiento)

### 4.1. Ciclo de Vida de `ProcessingJob` (Carga Masiva de Catálogo)

```mermaid
stateDiagram-v2
    [*] --> UPLOADED : POST /api/v1/catalog/upload (Excel válido)
    UPLOADED --> PROCESSING : BackgroundTask inicia + notify_observers()
    PROCESSING --> PROCESSING : Fila procesada (processed_items += 1)
    PROCESSING --> READY : Todas las filas completadas + notify_observers(READY)
    PROCESSING --> FAILED : Excepción / Precio inválido + notify_observers(FAILED)
    READY --> [*]
    FAILED --> [*]
```

### 4.2. Ciclo de Vida de `Order` (Comercio Electrónico)

```mermaid
stateDiagram-v2
    [*] --> PENDING : POST /api/v1/commerce/checkout (Snapshot Pricing)
    PENDING --> PAID : Confirmación de pago
    PENDING --> CANCELLED : Cancelación de orden
    PAID --> SHIPPED : Despacho logístico
    SHIPPED --> [*]
    CANCELLED --> [*]
```

---

## 5. Diagrama de Paquetes y Componentes (`UML.pdf` — Estructura)

```mermaid
flowchart TB
    subgraph Cliente["Frontend SPA (Next.js 16 + React 19 + WebGL)"]
        UI_Store["Marketplace & Producto (/marketplace, /product/[id])"]
        UI_Avatar["Configurador Multi-Avatar (/avatar)"]
        UI_Brand["Dashboard de Marca CRUD + Excel (/brand/dashboard)"]
        UI_Cart["Carrito & Checkout (/cart)"]
        R3F["Motor 3D Paramétrico (@react-three/fiber + Three.js)"]
    end

    subgraph Servidor["Backend RESTful API (FastAPI)"]
        Routers["Capa HTTP (Routers: auth, users, catalog, tryon, commerce)"]
        Validators["Validadores & Schemas (validators.py, domain/schemas/)"]
        Services["Capa de Servicios y Patrones GoF (Factory, Strategy, Decorator, Observer)"]
        Repos["Capa de Persistencia (Repositories: garment, job, avatar, cart, order)"]
    end

    subgraph Externos["Persistencia e IA Externa"]
        DB[("SQLite / PostgreSQL (SQLAlchemy ORM)")]
        Gemini["Google Gemini 2.5 Flash Vision API"]
    end

    UI_Store & UI_Avatar & UI_Brand & UI_Cart -->|"JSON + JWT"| Routers
    UI_Store & UI_Avatar --> R3F
    Routers --> Validators
    Routers --> Services
    Routers --> Repos
    Services -->|"Multimodal HTTPS"| Gemini
    Repos -->|"Transacciones ACID"| DB
```
