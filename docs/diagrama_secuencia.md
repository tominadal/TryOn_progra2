# Diagrama de Secuencia UML: TryOnHub

Este documento contiene los diagramas de secuencia para los casos de uso más importantes del sistema, de acuerdo a las buenas prácticas de UML.

## 1. Subida de Prendas y Generación 3D (Brand)

Este diagrama ilustra cómo funciona la arquitectura cuando una marca sube un nuevo producto. Incluye el **Patrón Decorator** sobre la estrategia de IA y el **Patrón Observer** sobre el Job de procesamiento.

```mermaid
sequenceDiagram
    actor Brand as 🏢 Brand (User)
    participant NextJS as 💻 Next.js Frontend
    participant FastApi as ⚙️ FastAPI Backend
    participant Decorator as 🎨 Decorator Chain (Logging+Cache)
    participant Gemini as 🧠 Gemini 2.5 Flash Vision
    participant Observer as 📡 Job Observers
    participant DB as 🗄️ SQLite

    Brand->>NextJS: Sube imagen de la prenda + Datos (Talla, Precio)
    NextJS->>FastApi: POST /api/v1/catalog/upload-image (FormData)
    FastApi-->>NextJS: Retorna { url: "http://localhost:8000/static/uploads/..." }
    
    NextJS->>FastApi: POST /api/v1/catalog/garment (JSON con image_url)
    
    rect rgba(173, 216, 230, 0.15)
        Note over FastApi,DB: Transacción Atómica + Observer Pattern
        FastApi->>Observer: register_observer(LoggingJobObserver)
        FastApi->>Observer: register_observer(StatsJobObserver)
        FastApi->>Observer: notify_observers(UPLOADED → PROCESSING)
        FastApi->>DB: Inicia Transacción, flush() Garment
        
        Note over Decorator: Decorator Pattern: Logging → Cache → Gemini
        FastApi->>Decorator: process_garment(image_url, metadata)
        Decorator->>Decorator: LoggingDecorator: loguea inicio + timer
        Decorator->>Decorator: CachingDecorator: check MD5 hash → MISS
        Decorator->>Gemini: Envía imagen + VISION_PROMPT
        Note over Gemini: Analiza píxeles: silhouette, color, textura
        Gemini-->>Decorator: JSON (waist_rise, taper, color_hex, roughness...)
        Decorator->>Decorator: CachingDecorator: guarda en caché
        Decorator->>Decorator: LoggingDecorator: loguea tiempo + source
        Decorator-->>FastApi: Retorna descriptor 3D
        
        alt Si Gemini Falla o Timeout
            FastApi->>DB: rollback()
            FastApi->>Observer: notify_observers(PROCESSING → FAILED)
            FastApi-->>NextJS: 500 Error: No se pudo generar modelo 3D
            NextJS-->>Brand: Muestra Error en UI (Toast)
        else Si Gemini Tiene Éxito
            FastApi->>DB: add() GarmentAsset (metadata_json)
            FastApi->>DB: commit()
            FastApi->>Observer: notify_observers(PROCESSING → READY, processed_items=1)
            FastApi-->>NextJS: 200 OK: Garment ID & Asset
            NextJS-->>Brand: Éxito (Toast)
        end
    end
```

## 2. Probador Virtual (Try-On) Interactiva (Client)

Este diagrama detalla la interacción principal del sistema: cuando un usuario entra a ver cómo le queda una prenda en su avatar 3D.

```mermaid
sequenceDiagram
    actor Cliente as 👤 Cliente (User)
    participant NextJS as 💻 Next.js Frontend
    participant R3F as 🎨 React Three Fiber
    participant FastApi as ⚙️ FastAPI Backend
    participant DB as 🗄️ SQLite

    Cliente->>NextJS: Accede a /product/{id}
    NextJS->>FastApi: GET /api/v1/catalog/garment/{id}
    FastApi->>DB: query Garment & GarmentAsset
    DB-->>FastApi: Devuelve Metadata 3D (Fit, Escala, Color)
    FastApi-->>NextJS: Retorna JSON de la Prenda

    NextJS->>FastApi: GET /api/v1/tryon/avatar
    FastApi->>DB: query Avatar (del current_user)
    DB-->>FastApi: Devuelve JSON de anatomía (Morphs)
    FastApi-->>NextJS: Retorna JSON del Avatar
    
    NextJS->>R3F: Inicializa <Canvas>
    NextJS->>R3F: Pasa props (AvatarMorphs + GarmentMetadata)
    
    rect rgba(144, 238, 144, 0.15)
        Note over R3F: Renderizado Paramétrico en Cliente (WebGL)
        R3F->>R3F: Escala geometría del avatar base (chestWidth, legThickness)
        R3F->>R3F: Calcula radio de prenda apoyado en la piel (offset dinámico)
        R3F->>R3F: Aplica shaders y texturas PBR (Denim, Cotton)
    end
    
    R3F-->>Cliente: Muestra Modelo 3D Interactivo
```

## 3. Flujo de Observer — Cambio de Estado de Jobs

Este diagrama muestra el modelo **Push** del Patrón Observer aplicado al procesamiento de catálogos.

```mermaid
sequenceDiagram
    participant Catalog as ⚙️ catalog.py (process_catalog_background)
    participant Job as 📋 ProcessingJob (Subject)
    participant LogObs as 📝 LoggingJobObserver
    participant StatsObs as 📊 StatsJobObserver

    Catalog->>Job: register_observer(LoggingJobObserver)
    Catalog->>Job: register_observer(StatsJobObserver)

    Note over Catalog,Job: Estado: UPLOADED → PROCESSING
    Catalog->>Job: job.status = PROCESSING
    Catalog->>Job: notify_observers(UPLOADED, PROCESSING)
    Job->>LogObs: update(job_id=5, UPLOADED→PROCESSING)
    LogObs-->>Job: "[Logging] Job #5: UPLOADED → PROCESSING"
    Job->>StatsObs: update(job_id=5, UPLOADED→PROCESSING)
    Note over StatsObs: (transición intermedia, no incrementa contadores)

    Note over Catalog,Job: Procesamiento completo → READY
    Catalog->>Job: job.status = READY
    Catalog->>Job: notify_observers(PROCESSING, READY, {processed_items:12})
    Job->>LogObs: update(job_id=5, PROCESSING→READY, ctx={processed_items:12})
    LogObs-->>Job: "[Logging] Job #5: PROCESSING → READY | processed_items=12"
    Job->>StatsObs: update(job_id=5, PROCESSING→READY, ctx={processed_items:12})
    StatsObs-->>Job: jobs_completed+=1, total_garments+=12
```

## 4. Flujo de Decorator — Cadena sobre GeminiTryOnStrategy

Este diagrama muestra cómo funciona la cadena `Logging(Cache(Gemini))` en el procesamiento de una prenda.

```mermaid
sequenceDiagram
    participant Router as ⚙️ catalog.py
    participant Log as 🖊️ LoggingStrategyDecorator
    participant Cache as 💾 CachingStrategyDecorator
    participant Gemini as 🧠 GeminiTryOnStrategy

    Router->>Log: process_garment(data_prenda_A)
    Log->>Log: Loguea inicio + timer
    Log->>Cache: process_garment(data_prenda_A)
    Cache->>Cache: hash MD5(image_url) → key="abc123"
    Cache->>Cache: _cache["abc123"] → MISS
    Cache->>Gemini: process_garment(data_prenda_A)
    Gemini-->>Cache: descriptor_3D {color_hex, taper, ...}
    Cache->>Cache: _cache["abc123"] = descriptor_3D
    Cache-->>Log: descriptor_3D
    Log->>Log: Loguea tiempo=2340ms, source=gemini_vision
    Log-->>Router: descriptor_3D

    Note over Router,Gemini: Segunda prenda con la MISMA foto (imagen duplicada en Excel)

    Router->>Log: process_garment(data_prenda_B, misma image_url)
    Log->>Log: Loguea inicio + timer
    Log->>Cache: process_garment(data_prenda_B)
    Cache->>Cache: hash MD5(image_url) → key="abc123"
    Cache->>Cache: _cache["abc123"] → HIT ✓
    Cache-->>Log: descriptor_3D (source: "cache")
    Log->>Log: Loguea tiempo=0.1ms, source=cache
    Log-->>Router: descriptor_3D (sin llamar a Gemini API 💰)
```
