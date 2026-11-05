# Requerimientos, Casos de Uso e Historias de Usuario — TryOnHub

> Este documento aplica íntegramente el marco conceptual del material de cátedra (*Requerimientos.pptx.pdf*, *Consignas de entrega Proyecto Programación 2.pdf* y *RESTful APIs con FastAPI.pdf*) al estado actual del proyecto **TryOnHub**.

---

## 1. Idea General del Proyecto
**TryOnHub** es una plataforma B2B2C de comercio electrónico con prueba virtual tridimensional (*Virtual Try-On*) para indumentaria. Permite a las marcas (B2B) digitalizar su catálogo convirtiendo fotografías planas 2D o especificaciones físicas en descriptores paramétricos 3D mediante Visión Computacional (Google Gemini Vision), y a los consumidores (B2C) probarse las prendas en tiempo real sobre múltiples gemelos digitales (avatares 3D antropométricos) renderizados con WebGL en el navegador antes de comprar.

---

## 2. Requerimientos Funcionales de Alto Nivel (RQ)

Los requerimientos funcionales describen **lo que el sistema debe hacer**. Cada RQ mapea directamente a endpoints RESTful implementados y verificados con pruebas automatizadas.

* **RQ1: Gestión de Identidad, Autenticación y Roles (RBAC):** Registro de clientes y marcas (con creación atómica de entidad `Brand`), inicio de sesión OAuth2/JWT y control de acceso basado en roles (`PLATFORM_ADMIN = 1`, `BRAND_MANAGER = 2`, `CUSTOMER = 3`).
  * *Endpoints:* `POST /api/v1/auth/login`, `POST /api/v1/users/`, `GET /api/v1/users/me`, `GET /api/v1/users/`.
* **RQ2: Gestión Multi-Avatar del Gemelo Digital (CRUD Completo):** Creación, listado, actualización parcial y eliminación de hasta 10 avatares 3D por usuario (ej. un comprador con perfiles corporales para distintos familiares), persistiendo medidas antropométricas (`height_cm`, `weight_kg`, `body_type`, `muscle_definition`) y rasgos estéticos.
  * *Endpoints:* `GET /api/v1/tryon/avatars`, `POST /api/v1/tryon/avatars`, `GET /api/v1/tryon/avatars/{avatar_id}`, `PUT /api/v1/tryon/avatars/{avatar_id}`, `DELETE /api/v1/tryon/avatars/{avatar_id}`.
* **RQ3: Administración del Catálogo de Marca e Inferencia Paramétrica 3D (CRUD Completo):** Carga de imágenes validadas por *magic bytes*, alta manual de prendas con inferencia 3D por IA (`GeminiTryOnStrategy`) o cálculo paramétrico determinístico (`build_parametric_metadata`), edición total/parcial de prendas (`PUT` con regeneración 3D opcional) y baja lógica/física segura (`DELETE` con limpieza de carritos activos y preservación de órdenes históricas).
  * *Endpoints:* `POST /api/v1/catalog/upload-image`, `POST /api/v1/catalog/garment`, `GET /api/v1/catalog/brand`, `PUT /api/v1/catalog/garments/{garment_id}`, `DELETE /api/v1/catalog/garments/{garment_id}`, `GET /api/v1/catalog/garments`, `GET /api/v1/catalog/garments/{garment_id}`.
* **RQ4: Probador Virtual 3D Interactivo:** Provisión de descriptores geométricos (`scale_x`, `scale_y`, `taper`, `waist_rise`, `roughness`, `distress`, `has_cuff`, `has_pleats`) y morfología del avatar seleccionado para deformar mallas 3D en tiempo real en el cliente WebGL, además de previsualización asistida por IA.
  * *Endpoints:* `GET /api/v1/catalog/garments/{garment_id}`, `POST /api/v1/tryon/preview/{garment_id}?avatar_id=`.
* **RQ5: Procesamiento Masivo por Lotes, Caché y Notificaciones (Observer):** Ingesta asíncrona de catálogos en Excel (`BackgroundTasks`), reutilización de descriptores mediante caché MD5 (`CachingStrategyDecorator`) y emisión de telemetría/alertas en tiempo real mediante el patrón `Observer` (`LoggingJobObserver`, `StatsJobObserver`, `NotificationJobObserver`).
  * *Endpoints:* `POST /api/v1/catalog/upload`, `GET /api/v1/catalog/jobs/{job_id}`, `GET /api/v1/catalog/notifications`.
* **RQ6: Carrito de Compras por Variante y Checkout con Snapshot Pricing:** Gestión de carrito persistente donde cada combinación de prenda + talle + color constituye una línea independiente, actualización de cantidades (`1–99`), vaciado de carrito y conversión en orden de compra congelando el precio unitario vigente al momento del pago (*snapshot pricing*).
  * *Endpoints:* `GET /api/v1/commerce/cart`, `POST /api/v1/commerce/cart`, `PATCH /api/v1/commerce/cart/{item_id}`, `DELETE /api/v1/commerce/cart/{item_id}`, `DELETE /api/v1/commerce/cart`, `POST /api/v1/commerce/checkout`, `GET /api/v1/commerce/orders`.

---

## 3. Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales describen **cómo debe comportarse el sistema** (atributos de calidad y restricciones de diseño):

* **RNF1 — Rendimiento y Cómputo Distribuido (60 FPS en Cliente):** El renderizado tridimensional se ejecuta en la GPU del navegador del usuario mediante WebGL (`@react-three/fiber`), reduciendo a cero el costo de cómputo gráfico en el servidor. En el backend, `CachingStrategyDecorator` evita llamadas repetidas a Gemini Vision ante imágenes duplicadas (`O(1)` por hit de caché).
* **RNF2 — Atomicidad e Integridad Transaccional:** Tanto el alta (`POST /catalog/garment`), la edición con regeneración 3D (`PUT /catalog/garments/{id}`) como el registro de usuario con marca (`POST /users/`) operan dentro de transacciones atómicas con `db.flush()` y `db.rollback()` automático en caso de error de IA o de base de datos, impidiendo la aparición de prendas sin activo 3D o marcas huérfanas.
* **RNF3 — Seguridad y Control de Acceso (Stateless JWT + Ownership):** Autenticación *stateless* con JWT (HS256), contraseñas hasheadas con `bcrypt`, validación de propiedad de recursos (una marca solo puede editar o eliminar sus propias prendas; un cliente solo puede acceder a sus propios avatares y carrito) y verificación de firmas binarias (*magic bytes*) en cargas de imágenes.
* **RNF4 — Prevención de Consultas N+1:** Los repositorios `CartRepository` y `OrderRepository` utilizan `joinedload` de SQLAlchemy para recuperar carritos y órdenes junto con sus ítems y prendas en una única consulta SQL.
* **RNF5 — Testabilidad y Entrega Continua (CI/CD):** El sistema cuenta con **90 pruebas automatizadas** ejecutadas con `pytest` sobre base de datos aislada en memoria (`StaticPool`) y validadas automáticamente en cada push/PR mediante GitHub Actions (`.github/workflows/main.yml`).

---

## 4. Diseño RESTful de la API

> Principios aplicados del material de clase (*RESTful APIs con FastAPI.pdf*):
> - **Recursos sustantivos:** rutas organizadas por entidades (`/users`, `/avatars`, `/garments`, `/cart`, `/orders`, `/jobs`).
> - **Ciclo CRUD completo:** uso semántico de `GET` (lectura), `POST` (creación), `PUT` (actualización de entidad), `PATCH` (modificación puntual de atributo) y `DELETE` (eliminación).
> - **Statelessness:** cada petición contiene toda la información necesaria para ser autenticada y procesada mediante el header `Authorization: Bearer <JWT>`.

| Método | Endpoint | Recurso | Descripción | Código exitoso |
|--------|----------|---------|-------------|----------------|
| `POST` | `/api/v1/auth/login` | Sesión | Autentica credenciales y devuelve token JWT | `200 OK` |
| `POST` | `/api/v1/users/` | Usuario | Registra nuevo usuario (y crea `Brand` si es rol marca) | `200 OK` |
| `GET`  | `/api/v1/users/me` | Usuario | Retorna el perfil del usuario autenticado | `200 OK` |
| `GET`  | `/api/v1/users/` | Usuarios | Lista usuarios (exclusivo `PLATFORM_ADMIN`) | `200 OK` |
| `GET`  | `/api/v1/tryon/avatars` | Avatares | Lista todos los avatares del usuario autenticado | `200 OK` |
| `POST` | `/api/v1/tryon/avatars` | Avatar | Crea un nuevo avatar (máximo 10 por usuario) | `201 Created` |
| `GET`  | `/api/v1/tryon/avatars/{id}` | Avatar | Obtiene el detalle de un avatar propio | `200 OK` |
| `PUT`  | `/api/v1/tryon/avatars/{id}` | Avatar | Actualiza medidas o estética de un avatar propio | `200 OK` |
| `DELETE` | `/api/v1/tryon/avatars/{id}` | Avatar | Elimina un avatar propio | `200 OK` |
| `POST` | `/api/v1/tryon/preview/{id}` | Composición | Genera vista previa de prueba virtual (`?avatar_id=`) | `200 OK` |
| `POST` | `/api/v1/catalog/upload-image` | Imagen | Valida *magic bytes* y almacena foto de prenda | `200 OK` |
| `POST` | `/api/v1/catalog/garment` | Prenda | Crea prenda con inferencia 3D IA o paramétrica | `200 OK` |
| `GET`  | `/api/v1/catalog/garments` | Prendas | Lista prendas procesadas (soporta filtro `?fit=`) | `200 OK` |
| `GET`  | `/api/v1/catalog/garments/{id}` | Prenda | Obtiene detalle de prenda, galería y `metadata_json` 3D | `200 OK` |
| `PUT`  | `/api/v1/catalog/garments/{id}` | Prenda | Actualiza prenda de la marca (con regeneración 3D opcional) | `200 OK` |
| `DELETE` | `/api/v1/catalog/garments/{id}` | Prenda | Elimina prenda de la marca y limpia referencias en carritos | `200 OK` |
| `GET`  | `/api/v1/catalog/brand` | Catálogo | Lista todas las prendas de la marca autenticada | `200 OK` |
| `POST` | `/api/v1/catalog/upload` | Job | Inicia ingesta masiva de catálogo Excel en segundo plano | `202 Accepted` |
| `GET`  | `/api/v1/catalog/jobs/{id}` | Job | Consulta el progreso de un trabajo de carga masiva | `200 OK` |
| `GET`  | `/api/v1/catalog/notifications` | Notificaciones | Obtiene métricas y alertas emitidas por los `JobObservers` | `200 OK` |
| `GET`  | `/api/v1/commerce/cart` | Carrito | Recupera el carrito del usuario con subtotales y total | `200 OK` |
| `POST` | `/api/v1/commerce/cart` | CarritoÍtem | Agrega prenda con variante (`size`, `color`) al carrito | `201 Created` |
| `PATCH` | `/api/v1/commerce/cart/{id}` | CarritoÍtem | Modifica la cantidad (`1–99`) de una línea del carrito | `200 OK` |
| `DELETE` | `/api/v1/commerce/cart/{id}` | CarritoÍtem | Quita una línea específica del carrito | `200 OK` |
| `DELETE` | `/api/v1/commerce/cart` | Carrito | Vacía completamente el carrito del usuario | `200 OK` |
| `POST` | `/api/v1/commerce/checkout` | Orden | Convierte el carrito en orden con *snapshot pricing* | `201 Created` |
| `GET`  | `/api/v1/commerce/orders` | Órdenes | Lista el historial de órdenes del usuario | `200 OK` |

---

## 5. Especificación Formal de Casos de Uso (Estructura de Ronald Mak)

> Siguiendo la metodología de *Requerimientos.pptx.pdf* (págs. 11–12), cada caso de uso detalla: Nombre, Objetivo, Resumen, Actores, Precondiciones, Disparador, Secuencia Principal, Secuencias Alternativas, Postcondiciones, Reglas de Negocio/RNF y Glosario.

### Caso de Uso 1: Configuración y Gestión Multi-Avatar del Cliente
1. **Nombre:** Gestión del Gemelo Digital Antropométrico (Multi-Avatar).
2. **Objetivo:** Permitir al cliente crear, seleccionar, actualizar o eliminar hasta 10 perfiles corporales 3D para probarse prendas en el vestidor virtual.
3. **Resumen:** El cliente autenticado ingresa medidas corporales y rasgos estéticos en `/avatar` y los persiste mediante el repositorio `AvatarRepository`.
4. **Actores:** Cliente (Consumidor B2C).
5. **Precondiciones:** El cliente debe poseer una cuenta activa y un token JWT válido.
6. **Disparador (Trigger):** El usuario pulsa "Guardar Cambios" o "Crear Nuevo" en la vista "Mis Gemelos Digitales" (`/avatar`).
7. **Secuencia de acciones principal:**
   1. El cliente ajusta deslizadores antropométricos (altura, peso, ancho de pecho, cintura, cadera, definición muscular) y opciones estéticas (piel, peinado, barba, lentes, ropa base).
   2. El frontend envía `POST /api/v1/tryon/avatars` (alta) o `PUT /api/v1/tryon/avatars/{id}` (edición) con el esquema `AvatarCreate` / `AvatarUpdate`.
   3. El backend valida el token JWT mediante `get_current_active_user` y verifica que el usuario no supere el límite de 10 avatares (en alta) o que sea el propietario del avatar (en edición).
   4. `avatar_repo` persiste los cambios en la tabla `avatars` y retorna el registro actualizado.
   5. El backend responde `201 Created` o `200 OK` con `AvatarResponse`.
   6. El lienzo WebGL (`Mannequin`) re-renderiza instantáneamente la malla 3D con los nuevos parámetros.
8. **Secuencias de acciones alternativas:**
   - **A1 — Límite de avatares alcanzado (`HTTP 400 Bad Request`):** Si el usuario ya posee 10 avatares e intenta crear el #11, el backend rechaza la solicitud informando el tope.
   - **A2 — Intento de acceso a avatar ajeno (`HTTP 404 Not Found`):** Si el `avatar_id` pertenece a otro usuario, `avatar_repo.get_by_id_for_user` retorna `None` y el endpoint responde `404`.
   - **A3 — Datos fuera de rango (`HTTP 422 Unprocessable Entity`):** Pydantic rechaza nombres vacíos o estructuras `body_type` inválidas.
9. **Postcondiciones:** El gemelo digital queda disponible en el selector "Probar en" de todas las páginas de producto (`/product/{id}`).
10. **Reglas de Negocio y RNF:** Máximo `MAX_AVATARS_PER_USER = 10` por usuario; aislamiento estricto por `user_id`.
11. **Glosario:** *Morphs:* factores numéricos que escalan segmentos anatómicos de la malla 3D en tiempo real.

---

### Caso de Uso 2: Alta, Edición y Eliminación de Prenda con Inferencia 3D (CRUD de Marca)
1. **Nombre:** Administración Integral de Prenda y Gemelo Digital 3D.
2. **Objetivo:** Permitir a un Brand Manager publicar nuevas prendas, editar sus atributos comerciales/físicos (con o sin re-inferencia de IA) y eliminar prendas obsoletas de su catálogo.
3. **Resumen:** Desde `/brand/dashboard`, la marca gestiona el ciclo de vida completo (`POST`, `GET`, `PUT`, `DELETE`) de sus productos manteniendo la consistencia atómica entre `Garment`, `GarmentAsset` y `GarmentImage`.
4. **Actores:** Administrador de Marca (`BRAND_MANAGER`, `role_id == 2`).
5. **Precondiciones:** El usuario debe estar autenticado con rol `BRAND_MANAGER` y tener un `brand_id` válido asociado.
6. **Disparador (Trigger):** El usuario envía el formulario de "Subir Nuevo Producto", "Guardar Cambios" (Modo Edición) o confirma el modal "Eliminar Prenda".
7. **Secuencia de acciones principal (Alta / Edición):**
   1. Si el usuario seleccionó una fotografía nueva, el frontend la envía a `POST /api/v1/catalog/upload-image`.
   2. El backend verifica la firma binaria (*magic bytes*) con `is_valid_image()`, guarda el archivo en `static/uploads/` y devuelve su URL.
   3. El frontend envía `POST /api/v1/catalog/garment` (alta) o `PUT /api/v1/catalog/garments/{id}` (edición) con los datos comerciales y físicos.
   4. El backend verifica rol y propiedad de marca (`_require_brand_manager` y `garment.brand_id == brand_id`).
   5. Si la opción de IA está activa (`generate_3d=True` o `regenerate_3d=True`), el backend invoca `strategy.process_garment(garment_data)` en un worker thread (`run_in_threadpool`); en caso contrario, calcula el descriptor determinístico con `build_parametric_metadata()`.
   6. El backend actualiza/crea `Garment`, `GarmentAsset` y `GarmentImage` y ejecuta un único `db.commit()` atómico.
   7. En caso de eliminación (`DELETE /api/v1/catalog/garments/{id}`), `garment_repo.delete_with_relations()` elimina los `CartItem` activos que apuntaban a la prenda, desvincula los `OrderItem` históricos (`garment_id = NULL`) y borra la prenda y sus activos en cascada.
8. **Secuencias de acciones alternativas:**
   - **A1 — Fallo de IA (`HTTP 500 Internal Server Error`):** Si Gemini Vision lanza `AIServiceError`, el backend ejecuta `db.rollback()`, preservando intacta la base de datos (sin prendas huérfanas ni ediciones corruptas).
   - **A2 — Acceso no autorizado (`HTTP 403 Forbidden`):** Si un cliente o una marca distinta intenta editar o borrar la prenda, el backend deniega la operación con `403`.
   - **A3 — Archivo no válido (`HTTP 400 Bad Request`):** Si se sube un archivo cuya cabecera binaria no corresponde a JPEG, PNG, GIF o WEBP, es rechazado antes de tocar el disco.
9. **Postcondiciones:** El catálogo de la marca y el marketplace público reflejan inmediatamente la prenda creada, actualizada o eliminada.
10. **Reglas de Negocio y RNF:** Transaccionalidad todo-o-nada (ACID); preservación de historial contable en `order_items`.
11. **Glosario:** *Descriptor Paramétrico (`metadata_json`):* documento JSON con factores de escala, tiro, ahusamiento (`taper`), rugosidad y desgaste interpretados por `ParametricPants`.

---

### Caso de Uso 3: Carga Masiva por Lotes y Monitoreo con Patrón Observer
1. **Nombre:** Ingesta Asíncrona de Catálogo Excel con Telemetría Observer y Caché Decorator.
2. **Objetivo:** Procesar lotes completos de prendas en segundo plano notificando a múltiples observadores desacoplados sobre cada transición de estado.
3. **Resumen:** La marca sube un archivo `.xlsx`/`.xls`; el backend valida su estructura, encola `process_catalog_background` y notifica a `LoggingJobObserver`, `StatsJobObserver` y `NotificationJobObserver`.
4. **Actores:** Administrador de Marca (`BRAND_MANAGER`).
5. **Precondiciones:** Archivo Excel con columnas obligatorias `SKU`, `Name`, `Fit`, `Size`, `Color`, `Price` y tamaño menor a `MAX_UPLOAD_SIZE_MB`.
6. **Disparador (Trigger):** El usuario selecciona un archivo Excel en `/brand/dashboard` y pulsa "Importar Catálogo Excel".
7. **Secuencia de acciones principal:**
   1. El frontend envía `POST /api/v1/catalog/upload`.
   2. El backend valida extensión, tamaño y columnas con `validate_excel_columns(df)`, crea un `ProcessingJob` en estado `UPLOADED` mediante `job_repo.create_job()` y responde `202 Accepted`.
   3. En background, el `ProcessingJob` (que hereda de `JobSubjectMixin`) registra los tres observadores (`global_logging_observer`, `global_stats_observer`, `global_notification_observer`) y transiciona a `PROCESSING`, disparando `notify_observers()`.
   4. Por cada fila, utiliza la cadena `LoggingStrategyDecorator(CachingStrategyDecorator(Strategy))` creada por `StrategyFactory.create_bulk_catalog()` para obtener el descriptor 3D (reutilizando caché si la URL de imagen se repite).
   5. Al finalizar, el job pasa a `READY`, incrementa los contadores en `StatsJobObserver` y registra la notificación en `NotificationJobObserver`.
   6. El Dashboard de Marca hace polling a `GET /api/v1/catalog/jobs/{id}` y consulta `GET /api/v1/catalog/notifications` para mostrar la barra de progreso y las alertas en vivo.
8. **Secuencias de acciones alternativas:**
   - **A1 — Columnas faltantes o precio inválido (`HTTP 400` / `FAILED`):** Si faltan columnas al subir, retorna `400`; si una fila contiene un precio negativo o nulo durante el lote, el job pasa a `FAILED`, registra el error en `error_log` y `NotificationJobObserver` emite una alerta de nivel `ERROR`.
9. **Postcondiciones:** Todas las prendas del lote quedan publicadas y las métricas del lote disponibles en el monitor Observer.
10. **Reglas de Negocio y RNF:** Procesamiento no bloqueante (`202 Accepted`); deduplicación de llamadas a IA mediante hash MD5.
11. **Glosario:** *JobSubjectMixin:* clase mixin que dota a `ProcessingJob` de comportamiento *Subject* (patrón Observer) sin alterar su mapeo ORM.

---

## 6. Historias de Usuario y Validación INVEST

> Siguiendo *Requerimientos.pptx.pdf* (págs. 15–20), cada Historia de Usuario se redacta en formato *"Como [rol], quiero [acción] para [beneficio]"*, cumple los criterios **INVEST** (*Independent, Negotiable, Valuable, Estimable, Small, Testable*) y define **Criterios de Aceptación** verificados por la suite de tests.

| ID | Historia de Usuario | I | N | V | E | S | T | Tests que la verifican |
|----|---------------------|---|---|---|---|---|---|------------------------|
| **HU-01** | Configurar múltiples avatares 3D | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `test_tryon.py` (`test_multiple_avatars_lifecycle_and_isolation`) |
| **HU-02** | Publicar prenda con IA o paramétrica | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `test_catalog.py` (`test_create_garment_manual_parametric_without_ai`) |
| **HU-03** | Importar catálogo masivo en Excel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `test_catalog.py` (`test_upload_catalog_success`, `test_patterns.py`) |
| **HU-04** | Probar prenda en avatar 3D interactivo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `test_tryon.py` (`test_tryon_preview_uses_requested_avatar_id`) |
| **HU-05** | Comprar con talle/color y snapshot pricing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `test_commerce.py` (`test_same_garment_different_size_or_color_creates_separate_lines`) |
| **HU-06** | Editar y eliminar prendas de mi marca | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `test_catalog.py` (`test_update_garment_*`, `test_delete_garment_*`) |

---

### HU-01: Guardar mis avatares para probarme ropa
> Como **cliente registrado**, quiero **crear, personalizar y guardar hasta 10 gemelos digitales con nombre propio y medidas corporales** para probar cómo quedan las prendas en mi cuerpo o en el de mis familiares.

**Criterios de Aceptación:**
- [x] Puedo crear hasta 10 avatares por cuenta con nombre propio, altura, peso, morfología (`body_type`) y rasgos estéticos (`POST /api/v1/tryon/avatars`).
- [x] Puedo actualizar o eliminar cualquiera de mis avatares sin afectar los de otros usuarios (`PUT/DELETE /api/v1/tryon/avatars/{id}`).
- [x] Puedo alternar entre mis avatares desde el selector **"Probar en"** dentro del Probador Virtual 3D.

---

### HU-02: Publicar una prenda con modelo 3D automático o paramétrico
> Como **administrador de marca**, quiero **subir una prenda con su foto y propiedades físicas para generar su gemelo digital 3D automáticamente con IA o de forma paramétrica instantánea** para que mis clientes puedan probársela en 3D.

**Criterios de Aceptación:**
- [x] El sistema valida los *magic bytes* de la imagen subida (`POST /api/v1/catalog/upload-image`).
- [x] Si activo la generación con IA (`generate_3d=True`), Gemini Vision analiza la prenda; si la IA falla, se ejecuta `rollback` atómico sin dejar prendas corruptas.
- [x] Si desactivo la IA (`generate_3d=False`), el sistema calcula instantáneamente los parámetros 3D (`scale_x`, `scale_y`, `taper`, `waist_rise`, `distress`) mediante `build_parametric_metadata`.

---

### HU-03: Subir un catálogo masivo en Excel con monitoreo Observer
> Como **administrador de marca**, quiero **importar un archivo Excel con múltiples prendas y recibir notificaciones del resultado del procesamiento** para poblar mi catálogo rápidamente.

**Criterios de Aceptación:**
- [x] La API valida las columnas requeridas (`SKU, Name, Fit, Size, Color, Price`) y responde `202 Accepted` con el `job_id`.
- [x] Los observadores (`LoggingJobObserver`, `StatsJobObserver`, `NotificationJobObserver`) registran las transiciones `UPLOADED → PROCESSING → READY / FAILED`.
- [x] El Dashboard de Marca muestra el progreso en vivo y las notificaciones emitidas por `GET /api/v1/catalog/notifications`.

---

### HU-04: Probarme una prenda en mi avatar 3D
> Como **cliente**, quiero **visualizar en 360° cómo se adapta un pantalón a las proporciones de mi avatar y consultar la guía de talles** para comprar con seguridad.

**Criterios de Aceptación:**
- [x] El lienzo WebGL (`ParametricMannequin` + `ParametricPants`) deforma la prenda según las medidas del avatar activo y el `metadata_json` de la prenda.
- [x] El sistema calcula una recomendación automática de talle basada en las dimensiones del avatar y ofrece un modal interactivo con la Guía de Talles.

---

### HU-05: Gestionar variantes en el carrito y comprar con precio congelado
> Como **cliente**, quiero **agregar prendas con talle y color específicos al carrito, ajustar cantidades y finalizar la compra** para recibir exactamente la variante elegida al precio vigente.

**Criterios de Aceptación:**
- [x] La misma prenda en distinto talle o color se registra como una línea independiente en el carrito (`POST /api/v1/commerce/cart`).
- [x] Puedo incrementar/decrementar cantidades (`PATCH /api/v1/commerce/cart/{id}`), eliminar líneas individuales o vaciar el carrito completo.
- [x] Al ejecutar `POST /api/v1/commerce/checkout`, `OrderRepository` congela el precio unitario de cada ítem (*snapshot pricing*) y registra el talle y color comprados.

---

### HU-06: Editar y eliminar prendas en el Dashboard de Marca
> Como **administrador de marca**, quiero **editar los precios, talles, colores o parámetros 3D de mis prendas publicadas y eliminar las discontinuadas** para mantener mi catálogo siempre actualizado.

**Criterios de Aceptación:**
- [x] Puedo hacer clic en **"Editar"** sobre cualquier prenda de mi marca en `/brand/dashboard`, modificar sus campos comerciales o físicos y guardar con `PUT /api/v1/catalog/garments/{id}`.
- [x] Puedo optar entre actualización paramétrica instantánea (`regenerate_3d=False`) o re-análisis completo con IA (`regenerate_3d=True`, con rollback automático si la IA falla).
- [x] Puedo eliminar una prenda propia (`DELETE /api/v1/catalog/garments/{id}`) con modal de confirmación, limpiando carritos activos sin romper órdenes históricas.
- [x] Ninguna marca puede editar ni eliminar prendas pertenecientes a otra marca (`403 Forbidden`).
