# Diagramas de Secuencia UML — TryOnHub

Este documento presenta los diagramas de secuencia UML para los flujos principales de negocio y patrones de diseño de **TryOnHub**, siguiendo las convenciones de [`UML.pdf`](../../MaterialClase/UML.pdf).

---

## 1. Alta y Edición de Prenda con Inferencia 3D o Paramétrica (`POST /garment` y `PUT /garments/{id}`)

Ilustra la gestión completa de una prenda por parte de la marca, incluyendo la bifurcación entre inferencia por IA (`GeminiTryOnStrategy` envuelta en `LoggingStrategyDecorator`) con rollback atómico en caso de fallo, y el cálculo paramétrico instantáneo (`build_parametric_metadata`).

```mermaid
sequenceDiagram
    actor Brand as 🏢 Brand Manager
    participant NextJS as 💻 Next.js (/brand/dashboard)
    participant Router as ⚙️ catalog.py
    participant Repo as 🗃️ GarmentRepository
    participant Strategy as 🎨 LoggingDecorator(Strategy)
    participant DB as 🗄️ SQLite / PostgreSQL

    Brand->>NextJS: Completa formulario (Alta o Edición)
    opt Si adjunta nueva fotografía
        NextJS->>Router: POST /api/v1/catalog/upload-image (FormData)
        Router->>Router: is_valid_image(magic_bytes)
        Router-->>NextJS: 200 OK { url }
    end

    NextJS->>Router: POST /catalog/garment ó PUT /catalog/garments/{id}
    Router->>Router: _require_brand_manager(current_user)
    Router->>Repo: Verifica existencia y ownership (si es PUT)

    rect rgba(173, 216, 230, 0.15)
        Note over Router,DB: Transacción Atómica (ACID)
        Router->>DB: add/update Garment + flush()

        alt generate_3d / regenerate_3d == True
            Router->>Strategy: run_in_threadpool(process_garment, garment_data)
            alt Éxito en IA (Gemini / Mock)
                Strategy-->>Router: { ai_generated_image_url, metadata_json }
                Router->>DB: Upsert GarmentAsset + GarmentImage + commit()
                Router-->>NextJS: 200 OK (Prenda actualizada)
            else Fallo en IA (AIServiceError)
                Strategy-->>Router: lanza AIServiceError
                Router->>DB: rollback() (Preserva estado anterior)
                Router-->>NextJS: 500 Internal Server Error
            end
        else generate_3d / regenerate_3d == False (Modo Paramétrico Instantáneo)
            Router->>Router: build_parametric_metadata(fit, waist_rise, color_hex...)
            Router->>DB: Upsert GarmentAsset + GarmentImage + commit()
            Router-->>NextJS: 200 OK (Prenda actualizada al instante)
        end
    end
```

---

## 2. Eliminación Segura de Prenda (`DELETE /api/v1/catalog/garments/{id}`)

Muestra cómo `GarmentRepository.delete_with_relations` mantiene la integridad referencial eliminando ítems de carritos activos mientras preserva el historial de órdenes cerradas (`OrderItem.garment_id = NULL`).

```mermaid
sequenceDiagram
    actor Brand as 🏢 Brand Manager
    participant NextJS as 💻 Next.js (/brand/dashboard)
    participant Router as ⚙️ catalog.py
    participant Repo as 🗃️ GarmentRepository
    participant DB as 🗄️ SQLite / PostgreSQL

    Brand->>NextJS: Confirma modal "Eliminar Prenda"
    NextJS->>Router: DELETE /api/v1/catalog/garments/{id}
    Router->>Router: _require_brand_manager(current_user)
    Router->>Repo: get(db, garment_id)
    Repo-->>Router: Garment (valida garment.brand_id == brand_id)
    Router->>Repo: delete_with_relations(db, garment)
    Repo->>DB: DELETE FROM cart_items WHERE garment_id = id
    Repo->>DB: UPDATE order_items SET garment_id = NULL WHERE garment_id = id
    Repo->>DB: DELETE FROM garments WHERE id = id (Cascade Asset & Images)
    Repo->>DB: commit()
    Router-->>NextJS: 200 OK { message, id }
```

---

## 3. Probador Virtual 3D Interactivo Multi-Avatar (`Client WebGL`)

Detalla la interacción cuando un cliente selecciona uno de sus avatares 3D para probarse una prenda en tiempo real.

```mermaid
sequenceDiagram
    actor Cliente as 👤 Cliente (B2C)
    participant NextJS as 💻 Next.js (/product/[id])
    participant R3F as 🎨 React Three Fiber (WebGL)
    participant FastApi as ⚙️ FastAPI Backend
    participant DB as 🗄️ Base de Datos

    Cliente->>NextJS: Abre /product/{id} y activa Probador 3D
    NextJS->>FastApi: GET /api/v1/catalog/garments/{id}
    FastApi->>DB: garment_repo.get(id)
    DB-->>FastApi: Garment + GarmentAsset (metadata_json) + GarmentImages
    FastApi-->>NextJS: JSON de la Prenda

    NextJS->>FastApi: GET /api/v1/tryon/avatars
    FastApi->>DB: avatar_repo.list_by_user(user_id)
    DB-->>FastApi: Lista de Avatares del Usuario (1..10)
    FastApi-->>NextJS: JSON de Avatares

    Cliente->>NextJS: Elige Avatar en selector "Probar en"
    NextJS->>R3F: Pasa props (AvatarMorphs + GarmentMetadata)

    rect rgba(144, 238, 144, 0.15)
        Note over R3F: Renderizado Paramétrico 60 FPS en GPU del Cliente
        R3F->>R3F: Escala segmentos anatómicos (height, weight, body_type)
        R3F->>R3F: Deforma ParametricPants (scale_x, scale_y, taper, waist_rise)
        R3F->>R3F: Aplica texturas PBR, desgaste (distress), dobladillos y pinzas
    end

    R3F-->>Cliente: Visualización 360° + Recomendación de Talle
```

---

## 4. Procesamiento Masivo por Lotes + Patrones Observer y Decorator

Muestra el flujo asíncrono (`BackgroundTasks`) al subir un catálogo Excel, la notificación en modelo **Push** a los tres observadores (`LoggingJobObserver`, `StatsJobObserver`, `NotificationJobObserver`) y la consulta del feed desde el Dashboard.

```mermaid
sequenceDiagram
    actor Brand as 🏢 Brand Manager
    participant NextJS as 💻 Next.js (/brand/dashboard)
    participant Catalog as ⚙️ catalog.py
    participant Job as 📋 ProcessingJob (Subject)
    participant Obs as 📡 Observers (Logging, Stats, Notification)
    participant Chain as 🎨 Logging(Caching(Strategy))

    Brand->>NextJS: Sube archivo .xlsx
    NextJS->>Catalog: POST /api/v1/catalog/upload
    Catalog->>Catalog: validate_excel_columns(df)
    Catalog->>Job: job_repo.create_job(status=UPLOADED)
    Catalog-->>NextJS: 202 Accepted { job_id }

    Note over Catalog,Chain: Ejecución Asíncrona (process_catalog_background)
    Catalog->>Job: register_observer(global_logging / stats / notification)
    Catalog->>Job: status = PROCESSING + notify_observers(UPLOADED → PROCESSING)
    Job->>Obs: update(job_id, UPLOADED, PROCESSING, {brand_id})

    loop Por cada fila del Excel
        Catalog->>Chain: process_garment(row_data)
        Note over Chain: CachingStrategyDecorator verifica MD5(image_url)
        Chain-->>Catalog: descriptor_3D (desde IA o Caché)
        Catalog->>Job: processed_items += 1 + db.commit()
    end

    Catalog->>Job: status = READY + notify_observers(PROCESSING → READY)
    Job->>Obs: update(job_id, PROCESSING, READY, {processed_items, brand_id})
    Obs->>Obs: StatsJobObserver incrementa contadores
    Obs->>Obs: NotificationJobObserver guarda evento en historial

    NextJS->>Catalog: GET /api/v1/catalog/notifications
    Catalog-->>NextJS: { stats, notifications }
```

---

## 5. Flujo de Factory Method (`IStrategyFactory` → `StrategyFactory`)

```mermaid
sequenceDiagram
    participant Router as ⚙️ catalog.py
    participant Deps as 🔌 dependencies.py
    participant Factory as 🏭 StrategyFactory (IStrategyFactory)
    participant Settings as ⚙️ Settings
    participant Product as 🧠 VirtualTryOnStrategy

    Router->>Deps: get_tryon_strategy(with_cache=True)
    Deps->>Factory: create_bulk_catalog()
    Factory->>Settings: Consulta USE_MOCK_AI
    Settings-->>Factory: True / False
    Factory->>Product: Instancia Base (MockTryOnStrategy ó GeminiTryOnStrategy)
    Factory->>Product: Envuelve en CachingStrategyDecorator
    Factory->>Product: Envuelve en LoggingStrategyDecorator
    Factory-->>Deps: Retorna VirtualTryOnStrategy decorada
    Deps-->>Router: Inyecta abstracción (DIP)
```

---

## 6. Carrito por Variante y Checkout con Snapshot Pricing (`CartRepository` & `OrderRepository`)

```mermaid
sequenceDiagram
    actor Cliente as 👤 Cliente
    participant NextJS as 💻 Next.js (/product/[id], /cart)
    participant Router as ⚙️ commerce.py
    participant CartRepo as 🛒 CartRepository
    participant OrderRepo as 📦 OrderRepository
    participant DB as 🗄️ Base de Datos

    Cliente->>NextJS: Elige Talle "32" y Color "Negro" y pulsa "Agregar al Carrito"
    NextJS->>Router: POST /api/v1/commerce/cart { garment_id, quantity, size, color }
    Router->>CartRepo: get_or_create_for_user(user_id)
    Router->>CartRepo: add_or_increment_item(cart, garment_id, quantity, size, color)
    CartRepo->>DB: Si coincide (garment_id + size + color) suma cantidad; sino crea nueva línea
    Router-->>NextJS: 201 Created

    Cliente->>NextJS: Pulsa "Finalizar Compra" en /cart
    NextJS->>Router: POST /api/v1/commerce/checkout
    Router->>CartRepo: get_by_user_with_items(user_id) (con joinedload)
    Router->>OrderRepo: create_from_cart(user_id, cart)
    OrderRepo->>DB: Crea Order + OrderItems congelando garment.price actual (Snapshot Pricing)
    OrderRepo->>DB: Elimina CartItems y ejecuta commit()
    Router-->>NextJS: 201 Created { order_id, total }
```
