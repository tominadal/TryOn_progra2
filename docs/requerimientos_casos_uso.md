# Requerimientos, Casos de Uso e Historias de Usuario — TryOnHub

> Este documento aplica el marco conceptual del material de clase (*Requerimientos.pptx.pdf* y *RESTful APIs con FastAPI.pdf*) al proyecto TryOnHub.

---

## 1. Idea General del Proyecto
TryOnHub es una plataforma B2B2C de prueba virtual de indumentaria que permite a marcas digitalizar sus catálogos y a clientes visualizar prendas adaptadas con precisión a su morfología corporal. El sistema combina inferencia paramétrica 3D asistida por visión computacional (IA) en backend con renderizado interactivo en tiempo real mediante WebGL en el navegador.

---

## 2. Requerimientos Funcionales de Alto Nivel (RQ)

Los requerimientos funcionales describen **lo que el sistema debe hacer**. Cada RQ mapea directamente a uno o más endpoints de la API RESTful.

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

Los requerimientos no funcionales describen **cómo debe comportarse el sistema** (rendimiento, seguridad, usabilidad).

* **Rendimiento y Cómputo Distribuido:** El renderizado 3D se ejecuta en el navegador del cliente mediante WebGL (Three.js/React Three Fiber) eliminando sobrecarga gráfica en el servidor; la inferencia IA reutiliza descriptores mediante un decorador de caché en memoria con hashing MD5 de imágenes.
* **Consistencia e Integridad Transaccional:** La creación de prendas y sus activos tridimensionales (`GarmentAsset`) opera bajo transacciones atómicas con *rollback* automático ante caídas o tiempos de espera de la IA, previniendo productos inconsistentes en catálogo.
* **Seguridad y Control de Acceso por Roles (RBAC):** Autenticación *stateless* basada en tokens OAuth2 / JWT (HS256) con almacenamiento seguro de contraseñas mediante hashing bcrypt, restringiendo las operaciones de carga y administración exclusivamente a usuarios con rol `BRAND_MANAGER`.
* **Tiempo de respuesta:** Los endpoints de consulta (GET) deben responder en menos de 500ms bajo carga normal. Los endpoints de procesamiento IA retornan `202 Accepted` de inmediato y procesan en background para no bloquear al usuario.

---

## 4. Diseño RESTful de la API

> Principios aplicados del material de clase (*RESTful APIs con FastAPI.pdf*):
> - Los **recursos** son entidades conceptuales (usuarios, prendas, avatares, órdenes).
> - Las **rutas** mapean recursos a endpoints; los **métodos HTTP** expresan la acción.
> - Los **códigos de respuesta** comunican el resultado sin necesidad de leer el body.

| Método | Endpoint | Recurso | Descripción | Código exitoso |
|--------|----------|---------|-------------|----------------|
| `POST` | `/api/v1/auth/login` | Sesión | Autentica y devuelve JWT | `200 OK` |
| `POST` | `/api/v1/users/` | Usuario | Registra nuevo usuario | `201 Created` |
| `GET`  | `/api/v1/users/me` | Usuario | Perfil del usuario autenticado | `200 OK` |
| `POST` | `/api/v1/tryon/avatar` | Avatar | Crea o actualiza el avatar (upsert) | `200 OK` |
| `GET`  | `/api/v1/tryon/avatar` | Avatar | Recupera el avatar del usuario | `200 OK` |
| `POST` | `/api/v1/tryon/preview/{id}` | Composición | Genera imagen virtual try-on | `200 OK` |
| `POST` | `/api/v1/catalog/upload-image` | Imagen | Sube imagen de prenda al servidor | `200 OK` |
| `POST` | `/api/v1/catalog/garment` | Prenda | Publica prenda con análisis 3D IA | `200 OK` |
| `GET`  | `/api/v1/catalog/garments` | Prendas | Lista prendas procesadas (con filtro `?fit=`) | `200 OK` |
| `GET`  | `/api/v1/catalog/garments/{id}` | Prenda | Detalle de prenda + metadata 3D | `200 OK` |
| `POST` | `/api/v1/catalog/upload` | Job | Ingesta masiva de Excel (async) | `202 Accepted` |
| `GET`  | `/api/v1/catalog/jobs/{id}` | Job | Estado del procesamiento masivo | `200 OK` |
| `GET`  | `/api/v1/catalog/brand` | Catálogo | Catálogo de la marca autenticada | `200 OK` |
| `POST` | `/api/v1/commerce/cart` | CarritoÍtem | Agrega prenda al carrito | `200 OK` |
| `POST` | `/api/v1/commerce/checkout` | Orden | Crea orden desde el carrito | `200 OK` |

**Uso de códigos HTTP en TryOnHub:**

| Código | Semántica | Dónde se usa |
|--------|-----------|--------------|
| `200 OK` | Petición exitosa | La mayoría de GETs y POSTs de negocio |
| `201 Created` | Recurso creado | Registro de usuario |
| `202 Accepted` | Procesamiento diferido | Upload de Excel (tarea en background) |
| `400 Bad Request` | Datos inválidos del cliente | Imagen inválida, columnas Excel faltantes |
| `401 Unauthorized` | Token ausente o inválido | Cualquier endpoint protegido sin JWT |
| `403 Forbidden` | Sin permisos para el recurso | BRAND_MANAGER intentando acceder a rutas de admin |
| `404 Not Found` | Recurso inexistente | GET prenda/avatar que no existe |
| `409 Conflict` | Conflicto de integridad | Email duplicado en registro |
| `422 Unprocessable` | Error de validación de tipos | Pydantic rechaza el payload |
| `500 Internal Error` | Fallo inesperado | IA de Gemini no disponible (con rollback) |

---

## 5. Casos de Uso

> Los casos de uso describen escenarios detallados de interacción (actor + flujo principal + alternativos). Son el nivel más narrativo y estructurado de especificación.

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

---

## 6. Historias de Usuario

> Las historias de usuario describen necesidades **desde el punto de vista del usuario** en formato ágil: *"Como [rol], quiero [acción] para [beneficio]"*. Son el nivel más conciso de especificación y se complementan con Criterios de Aceptación verificables.

---

### HU-01: Guardar mi avatar para probarme ropa

**Historia:**
> Como **cliente registrado**, quiero **configurar y guardar mis medidas corporales y rasgos físicos** para que la plataforma me muestre cómo quedan las prendas en un avatar que me representa fielmente.

**Criterios de Aceptación:**
- [ ] Puedo ingresar mi altura (cm) y peso (kg) en controles numéricos con validación de rango (ej: 100–250 cm).
- [ ] Puedo seleccionar color de piel, cabello, tipo de cuerpo y otros rasgos estéticos mediante controles visuales.
- [ ] Al presionar "Guardar Avatar", los datos se envían al backend y el avatar 3D en pantalla refleja los cambios en menos de 2 segundos.
- [ ] Si ya tenía un avatar guardado, la operación lo actualiza (upsert) sin perder datos no modificados.
- [ ] Si no estoy autenticado, soy redirigido al login con un mensaje informativo.
- [ ] Si envío un valor fuera de rango (ej: altura = 5 cm), la UI resalta el campo en rojo con el mensaje de error del backend.

---

### HU-02: Publicar una prenda con modelo 3D automático

**Historia:**
> Como **administrador de marca**, quiero **subir una foto de un jean y que el sistema genere su descriptor 3D automáticamente** para que mis clientes puedan probarse la prenda en su avatar sin trabajo manual de mi parte.

**Criterios de Aceptación:**
- [ ] Puedo seleccionar una imagen (JPEG, PNG o WEBP); formatos no válidos son rechazados con un mensaje claro.
- [ ] Puedo completar los datos comerciales: nombre, fit, precio, color, talle, material y atributos avanzados (tiro, elasticidad, nivel de desgaste).
- [ ] Al confirmar la publicación, el sistema procesa la imagen con IA y retorna el resultado en menos de 15 segundos.
- [ ] Si la IA falla, la prenda **no aparece** en el catálogo (integridad transaccional); se muestra un error descriptivo.
- [ ] Si la IA tiene éxito, la prenda aparece inmediatamente en el panel de mi marca y está disponible para prueba virtual.
- [ ] Solo usuarios con rol `BRAND_MANAGER` vinculados a una marca pueden publicar prendas.

---

### HU-03: Subir un catálogo masivo en Excel

**Historia:**
> Como **administrador de marca**, quiero **subir un archivo Excel con todas mis prendas de la temporada** para poblar el catálogo de una sola vez sin tener que cargar cada prenda individualmente.

**Criterios de Aceptación:**
- [ ] Puedo subir archivos `.xlsx` o `.xls` de hasta `{MAX_UPLOAD_SIZE_MB}` MB.
- [ ] El sistema valida que el Excel contenga las columnas mínimas requeridas (SKU, Name, Fit, Size, Color, Price) y rechaza el archivo con detalle de las columnas faltantes.
- [ ] El procesamiento ocurre en segundo plano: la API responde `202 Accepted` inmediatamente.
- [ ] Puedo consultar el estado del procesamiento con el `job_id` retornado.
- [ ] El estado del job avanza: `UPLOADED → PROCESSING → READY` (o `FAILED` con detalle del error).
- [ ] Si una fila falla, el resto del catálogo sigue procesándose (tolerancia a fallos parciales).
- [ ] Al finalizar, el sistema notifica en los logs de servidor con conteo de prendas procesadas exitosamente.

---

### HU-04: Probarme una prenda en mi avatar

**Historia:**
> Como **cliente**, quiero **ver cómo me queda un jean en mi avatar 3D** para decidir si lo compro sin necesidad de probarlo físicamente.

**Criterios de Aceptación:**
- [ ] Al acceder a la página de un producto, veo el probador virtual 3D si tengo un avatar configurado.
- [ ] El avatar renderizado refleja mis proporciones (altura, peso, tipo de cuerpo) y rasgos estéticos guardados.
- [ ] La prenda se muestra con su color, fit y textura correctos según el descriptor 3D generado por la IA.
- [ ] Puedo rotar el avatar 360° interactivamente para ver la prenda desde cualquier ángulo.
- [ ] Si no tengo avatar configurado, se me muestra un aviso con un botón de acceso directo al configurador.
- [ ] Si la prenda no tiene descriptor 3D generado, se muestra la imagen plana del producto como fallback.

---

### HU-05: Agregar una prenda al carrito y comprarla

**Historia:**
> Como **cliente**, quiero **agregar prendas que me gustaron al carrito y completar la compra** para recibirlas en mi domicilio.

**Criterios de Aceptación:**
- [ ] Puedo agregar una prenda al carrito desde la página de producto.
- [ ] El carrito persiste entre sesiones (está guardado en el servidor, no solo en el navegador).
- [ ] Puedo ver el total acumulado del carrito.
- [ ] Al hacer checkout, se crea una orden con el precio de cada prenda al momento de la compra (snapshot pricing — el precio no cambia si la marca lo modifica después).
- [ ] Recibo confirmación de la orden con su ID.
- [ ] Si no estoy autenticado, soy redirigido al login antes de poder comprar.
