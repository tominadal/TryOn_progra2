# Requerimientos y Casos de Uso — TryOnHub

## 1. Idea General del Proyecto
TryOnHub es una plataforma B2B2C de prueba virtual de indumentaria que permite a marcas digitalizar sus catálogos y a clientes visualizar prendas adaptadas con precisión a su morfología corporal. El sistema combina inferencia paramétrica 3D asistida por visión computacional (IA) en backend con renderizado interactivo en tiempo real mediante WebGL en el navegador.

---

## 2. Requerimientos Funcionales de Alto Nivel (RQ)
* **RQ1: Gestión de Identidad y Autenticación:** Registro, login y emisión de credenciales seguras mediante tokens JWT con control de acceso según rol de usuario (Cliente o Marca).
  * *Endpoints:* `POST /api/v1/auth/login`, `POST /api/v1/users/`, `GET /api/v1/users/me`.
* **RQ2: Parametrización y Persistencia del Gemelo Digital (Avatar):** Creación, actualización, recuperación y eliminación de uno o varios avatares 3D por usuario (por ejemplo, un padre con un avatar por cada hijo), con nombre propio, medidas antropométricas (altura, peso, complexión) y personalización estética.
  * *Endpoints:* `GET/POST /api/v1/tryon/avatars`, `GET/PUT/DELETE /api/v1/tryon/avatars/{avatar_id}`.
* **RQ3: Ingesta de Prendas e Inferencia Paramétrica 3D:** Carga individual de fotografías de prendas y análisis automatizado mediante IA (Gemini Vision / Mock) para extraer descriptores tridimensionales y metadatos de calce.
  * *Endpoints:* `POST /api/v1/catalog/upload-image`, `POST /api/v1/catalog/garment`.
* **RQ4: Renderizado y Probador Virtual 3D:** Provisión de metadatos geométricos y parámetros anatómicos para la deformación de mallas en el cliente WebGL, junto con generación de composiciones 2D alternativas.
  * *Endpoints:* `GET /api/v1/catalog/garments/{garment_id}`, `GET /api/v1/tryon/avatars`, `POST /api/v1/tryon/preview/{garment_id}?avatar_id=`.
* **RQ5: Procesamiento Masivo y Caché de Catálogos:** Ingesta asíncrona de lotes de prendas mediante planillas Excel con notificación de estados a observadores y reutilización de descriptores mediante caché de imágenes.
  * *Endpoints:* `POST /api/v1/catalog/upload`, `GET /api/v1/catalog/jobs/{job_id}`.

---

## 3. Requerimientos No Funcionales
* **Rendimiento y Cómputo Distribuido:** El renderizado 3D se ejecuta en el navegador del cliente mediante WebGL (Three.js/React Three Fiber) eliminando sobrecarga gráfica en el servidor; la inferencia IA reutiliza descriptores mediante un decorador de caché en memoria con hashing MD5 de imágenes.
* **Consistencia e Integridad Transaccional:** La creación de prendas y sus activos tridimensionales (`GarmentAsset`) opera bajo transacciones atómicas con *rollback* automático ante caídas o tiempos de espera de la IA, previniendo productos inconsistentes en catálogo.
* **Seguridad y Control de Acceso por Roles (RBAC):** Autenticación *stateless* basada en tokens OAuth2 / JWT (HS256) con almacenamiento seguro de contraseñas mediante hashing bcrypt, restringiendo las operaciones de carga y administración exclusivamente a usuarios con rol `BRAND_MANAGER`.

---

## 4. Casos de Uso

### Caso de Uso 1: Cliente configurando su Avatar
* **Nombre:** Configuración y Persistencia del Gemelo Digital (Avatar).
* **Objetivo:** Registrar o actualizar las dimensiones corporales y atributos estéticos del avatar del cliente para su uso en el vestidor virtual.
* **Resumen:** El cliente autenticado ajusta sus medidas y rasgos visuales en la interfaz web y guarda la configuración en el backend.
* **Actores:** Cliente (Consumidor B2C).
* **Precondiciones:** El cliente debe estar registrado, activo y autenticado con un token JWT válido.
* **Disparador (Trigger):** El usuario hace clic en el botón "Guardar Avatar" en el módulo de personalización.
* **Secuencia de acciones principal:**
  1. El cliente modifica los controles visuales de medidas (altura, peso, complexión) y rasgos estéticos (color de piel, cabello, accesorios).
  2. El frontend envía una solicitud `POST /api/v1/tryon/avatars` (nuevo avatar) o `PUT /api/v1/tryon/avatars/{id}` (avatar existente) con el cuerpo JSON estructurado según el esquema `AvatarCreate` y el encabezado `Authorization: Bearer <token>`.
  3. El backend autentica la sesión del usuario mediante la dependencia `get_current_active_user`.
  4. El repositorio `avatar_repo` crea un avatar nuevo vinculado al usuario (hasta un máximo de 10) o actualiza parcialmente uno propio, verificando que el avatar pertenezca al usuario autenticado.
  5. El backend retorna `201 Created` (alta) o `200 OK` (actualización) con el objeto `AvatarResponse` serializado.
  6. El frontend actualiza el estado local y re-renderiza el avatar 3D en el lienzo WebGL con las nuevas proporciones anatómicas.
* **Secuencias de acciones alternativas:**
  1. **HTTP 401 Unauthorized:** Si el token JWT expiró o no fue enviado, el backend aborta la solicitud y el frontend redirige al cliente a la pantalla de login.
  2. **HTTP 422 Unprocessable Entity:** Si los datos antropométricos contienen tipos incompatibles o valores fuera de rango, el backend retorna los detalles del error de validación y el frontend resalta los campos inválidos.
  3. **HTTP 500 Internal Server Error:** Si la base de datos no está disponible, el backend revierte la operación y retorna un error interno; el frontend notifica al usuario para que reintente más tarde.
* **Postcondiciones:** Los parámetros anatómicos y estéticos del avatar quedan persistidos en la base de datos y listos para consultar desde cualquier probador de prendas.

### Caso de Uso 2: Marca subiendo una prenda
* **Nombre:** Ingesta de Prenda con Inferencia Paramétrica 3D.
* **Objetivo:** Incorporar una nueva prenda al catálogo de una marca generando automáticamente su modelo tridimensional descriptivo a partir de una fotografía.
* **Resumen:** Un representante de marca sube una imagen y especificaciones comerciales de un producto; el backend deduce parámetros 3D mediante IA y persiste la prenda con sus activos en forma atómica.
* **Actores:** Marca (Brand Manager).
* **Precondiciones:** El usuario debe estar autenticado con rol `BRAND_MANAGER` (`role_id == 2`) y asociado a una marca existente (`brand_id`).
* **Disparador (Trigger):** El usuario completa el formulario de carga y pulsa "Publicar Prenda".
* **Secuencia de acciones principal:**
  1. La marca selecciona el archivo de imagen; el frontend envía `POST /api/v1/catalog/upload-image` (FormData).
  2. El backend valida la firma de bytes (*magic bytes*) de la imagen (JPEG/PNG/WEBP), la guarda en almacenamiento estático y retorna la URL pública con código `200 OK`.
  3. La marca completa los datos comerciales (nombre, calce, precio, color) y confirma la publicación con generación 3D activa.
  4. El frontend envía una solicitud `POST /api/v1/catalog/garment` con el payload `GarmentCreate` y el token JWT de la marca.
  5. El backend inicia una transacción de base de datos, valida el rol del usuario e inserta el registro `Garment` ejecutando `flush()` para obtener su ID.
  6. El backend invoca a la estrategia de IA (`GeminiTryOnStrategy` envuelta con observadores y decoradores de caché y log) para analizar la imagen y extraer `metadata_json` (volumetría, tiro, caída y textura).
  7. El backend crea el registro `GarmentAsset` con los metadatos generados, asocia la URL, marca la prenda como procesada (`is_processed = true`) y ejecuta `commit()` definitivo.
  8. El backend retorna código `200 OK` con el resumen de la prenda creada; el frontend notifica el éxito y actualiza la grilla del catálogo.
* **Secuencias de acciones alternativas:**
  1. **HTTP 400 Bad Request:** Si el archivo cargado no corresponde a una imagen válida por firma de bytes o los campos obligatorios están ausentes, el backend rechaza la petición indicando el error.
  2. **HTTP 403 Forbidden:** Si el usuario carece de rol `BRAND_MANAGER` o no tiene un `brand_id` asignado, el backend deniega el acceso sin procesar la carga.
  3. **HTTP 500 Internal Server Error (Fallo de Servicio de IA):** Si la invocación a la API de Gemini falla o expira por timeout, el backend ejecuta `rollback()` descartando la prenda para evitar registros huérfanos y retorna un mensaje de error controlado.
* **Postcondiciones:** La prenda y su descriptor 3D (`GarmentAsset`) quedan persistidos en la base de datos, figurando de inmediato en el catálogo de la marca y habilitados para el probador virtual.
