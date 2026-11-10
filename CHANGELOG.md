# Changelog

Historial de versiones de **TryOnHub**. Sigue el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado [SemVer](https://semver.org/lang/es/) (`MAYOR.MENOR.PARCHE`).

<details>
<summary><strong>Cómo mantener este archivo</strong></summary>

**Al hacer un cambio:** agregar una línea en la sección `[Sin publicar]`, bajo la categoría que corresponda.

| Categoría | Cuándo usarla |
|---|---|
| **Añadido** | Funcionalidades nuevas |
| **Cambiado** | Cambios en funcionalidades existentes |
| **Obsoleto** | Funcionalidades que se eliminarán pronto |
| **Eliminado** | Funcionalidades quitadas |
| **Corregido** | Arreglo de errores |
| **Seguridad** | Cambios relacionados con vulnerabilidades |

Las líneas se escriben pensando en quien usa la plataforma, no en el código: qué cambió y por qué importa. Si el cambio rompe algo existente (un endpoint, un formato), se marca con **⚠️ Cambio incompatible**.

</details>

---

## [Sin publicar]

### Añadido

- **Articulación Anatómica de Hombros/Brazos, Empalme de Muñecas sin Costura y Accesorios 3D (`Anteojos` y `Reloj de Pulsera`).**
  - **Hombros y Brazos (`Mannequin.tsx`, `Hands.tsx`, `Face.tsx`)**: Elevación del acromion/deltoides (`y = 1.446` con pendiente de trapecio a `y = 1.480`), desplazamiento lateral dinámico de los brazos según el contorno de pecho (`shoulderLatX = Math.max(rawShoulderX, baseChestRx + upperArmR * 0.52)`) para que nunca se hundan en el torso, empalme continuo antebrazo-muñeca sin tapas internas (`capBottom: false` / `capTop: false` con radios igualados `0.0258`) y suavizado del anillo submentoniano (`Face.tsx`).
  - **Anteojos 3D y Reloj de Pulsera 3D**: Selectores `Sí / No` + color personalizado (`glasses`, `glasses_color`, `watch`, `watch_color` persistidos en `Avatar` con migración automática en `schema_upgrades.py`), con montura, puente nasal, cristales translúcidos y patillas conformadas al cráneo (`buildGlassesTempleGeometry` en `Face.tsx`), y reloj de pulsera en la muñeca izquierda con malla lofteada elíptica, caja, bisel metálico, agujas, corona y hebilla (`Hands.tsx`), visibles tanto en `/avatar` como en el Probador Virtual 3D (`/product/{id}`).
- **Vista Previa 3D en Vivo, Multi-Color e Inputs Numéricos (`cm`) en el Dashboard de Marca (`/brand/dashboard/page.tsx`, `Pants.tsx`, `routers/catalog.py`).**
  - **Previsualizador 3D en Tiempo Real**: Visor `<Canvas>` interactivo integrado en el formulario de creación/edición de prendas que actualiza al instante el pantalón 3D al modificar centímetros de moldería, fit, tiro, color, textura (`Denim`, `Cuero/Ecocuero`, `Gabardina`, `Lino`, `Corderoy`), pinzas (`pleatGeometries`), dobladillos (`hasCuff`) y desgaste (`pelvisWhiskerGeometries` y desgaste en rodillas/muslos).
  - **Gestión de Múltiples Colores e Hidratación de Prendas Existentes**: Soporte para agregar/quitar variantes de color por prenda (`colors` en `GarmentCreate`/`GarmentUpdate`), preservación de colores secundarios al editar prendas del catálogo semilla (`seed.py`) e hidratación automática de moldería en `cm` en `_garment_to_dict`.
- **Sistema Antropométrico y de Patronaje 3D Unificado en Centímetros (`cm`).** Los Gemelos Digitales (`/avatar` y `AvatarCreatorNative`) ahora se configuran mediante circunferencias y medidas reales en centímetros (`Cintura`, `Cadera`, `Pecho`, `Busto`, `Muslo`, `Brazo`, `Cuello`, `Abdomen`) con sliders e inputs numéricos directos, mientras que el Dashboard de Marca (`/brand/dashboard`) y el Probador 3D (`/product/{id}`) operan sobre medidas reales de patronaje en `cm` (`waist_cm`, `hip_cm`, `thigh_cm`, `inseam_cm`, `hem_width_cm`, `rise_cm`) y comparan `Avatar cm vs. Prenda cm` para diagnosticar el calce por talle.
- **Reconstrucción Anatómica de Manos, Cejas y Cabello Conforme al Cráneo (`Hands.tsx`, `Face.tsx`, `Hair.tsx`).**
  - **Manos y Muñecas**: Reemplazo de cubos y esferas por una palma continua (`palmGeometry`) con cuello de empalme empotrado en el antebrazo y 5 dedos lofteados continuos (`buildLoftedFingerGeometry`) con curvatura fisiológica MCP/PIP/DIP.
  - **Cejas y Rostro**: Muestreo directo sobre los anillos craneales (`getHeadLoftRings` + `buildSurfaceEyebrowGeometry`) para que las cejas sigan el arco superciliar al ras de la piel sin sobresalir de perfil ni cruzarse en vertical, junto con nariz lofteada continua (`noseGeometry`) y ojos empotrados en la órbita.
  - **Cabello Conforme al Cráneo y Nuca**: Generación de casquete capilar (`buildSkullConformedHairCap`) y cortina volumétrica 3D cerrada (`buildLongHairVolume`) muestreados sobre `getHeadLoftRings`, eliminando el efecto casco en la nuca, el óvalo suelto sobre el pelo `Corto` y los recortes cuadrados sobre las orejas.
- **Plan Maestro de Modelo de Negocios y Paso a Producción (`docs/modelo_de_negocios.md`).** Expansión integral articulando *Zero to One*, *Pattern Breakers*, Sarmiento (1849), General Magic, Unit Economics B2B2C y hoja de ruta de 8 dimensiones para despliegue en producción Cloud.
- **Motor 3D Procedural de Geometría Continua (*Lofting* Anatómico) y Adherencia Superficial.** Rediseño integral de `ParametricMannequin`, `ParametricPants`, `RealisticFace`, `HairComponent` y `ModernShoe` utilizando generadores de mallas continuas (`buildLoftedGeometry` con interpolación spline Catmull-Rom y normales soldadas) y parches 3D adheridos matemáticamente a la superficie (`buildSurfacePatch`), eliminando todos los artefactos de primitivas desconectadas, costuras flotantes y superposiciones.
- **Alineación integral con Material de Clase (SQLAlchemy 2.0, JWT Estándar, Docker y Testing DRY):**
  - Migración de `Base` a `DeclarativeBase` (SQLAlchemy 2.0) y normalización automática de cadenas `postgres://` a `postgresql://` en `database.py` para proveedores Cloud (Render/Neon).
  - Enriquecimiento del payload JWT en `auth_service.py` y `auth.py` con claims estándar (`sub`, `iat`, `role`, `exp`).
  - Incorporación de `.dockerignore` (raíz, `backend/` y `frontend/`), optimización de capas en `backend/Dockerfile`, nuevo `frontend/Dockerfile` multi-stage y `docker-compose.yml` unificado en la raíz del proyecto.
  - Nuevas baterías de pruebas parametrizadas con `@pytest.mark.parametrize` (Principio DRY) en `backend/tests/test_extra.py` y verificación de tipado Frontend en GitHub Actions CI (`.github/workflows/main.yml`).
- **Sistema de Diseño Liquid Glass 100% Responsivo.** Rediseño estético integral con superficies de cristal translúcido multicapa (`backdrop-filter: blur() saturate()`), bordes especulares internos (`inset 0 1px 1px`), filtro global de refracción óptica SVG (`feTurbulence` + `feDisplacementMap`), fondos ambientales con gradientes radiales dinámicos y soporte de accesibilidad (`prefers-reduced-transparency`), preservando intactos el contenido y la estructura funcional.
- **Edición completa de prendas en el Dashboard de Marca (`PUT /api/v1/catalog/garments/{id}`).** Las marcas ahora pueden editar nombre, precio, fit, color, hex, talles, material, descripción, fotografía y propiedades físicas 3D de cualquier prenda propia, eligiendo entre actualización paramétrica instantánea (`regenerate_3d=False`) o re-análisis con IA (`regenerate_3d=True`) con rollback transaccional automático en caso de fallo.
- **Eliminación segura de prendas (`DELETE /api/v1/catalog/garments/{id}`).** Permite dar de baja prendas desde el Dashboard de Marca con modal de confirmación, limpiando automáticamente los ítems en carritos activos y preservando el historial de órdenes cerradas (`OrderItem.garment_id = NULL`).
- **Carga masiva por Excel e historial Observer en vivo en el Dashboard de Marca.** Se incorporó el panel de importación `.xlsx`/`.xls` con barra de progreso en tiempo real y el endpoint `GET /api/v1/catalog/notifications` que expone las estadísticas y alertas generadas por `StatsJobObserver` y `NotificationJobObserver`.
- **Buscador y filtro por Fit en el Dashboard de Marca**, junto con columnas enriquecidas (muestra de color Hex, talles disponibles, SKU, precio formateado en ARS y estado 3D).
- **Repositorios `CartRepository`, `OrderRepository` y `ProcessingJobRepository`** en `app/domain/repositories/`, e interfaz abstracta `IStrategyFactory` (Factory Method) en `app/services/strategy_factory.py`.
- **Talle y color en el carrito.** Cada prenda del carrito muestra el talle y el color elegidos (con una muestra del color). El pedido también los registra, así que ya se sabe qué talle y color se compró.
- **Selector de cantidad (+/−)** en cada línea del carrito (API: `PATCH /api/v1/commerce/cart/{id}`).
- Los pedidos (`GET /api/v1/commerce/orders`) incluyen el talle y el color de cada prenda.
- **Centro de Ayuda** en `/ayuda` con preguntas frecuentes agrupadas por categoría (`Gemelos Digitales`, `Probador Virtual 3D`, `Compras y Carrito` y `Marcas B2B`), desplegables y con varios párrafos por respuesta (`frontend/src/lib/faqs.ts`).
- **Carga manual paramétrica en el Dashboard de Marca.** Permite publicar prendas con metadatos 3D determinísticos (`build_parametric_metadata`) aun cuando se desactiva la inferencia automática de IA (`generate_3d=False`).
- **Guía de Talles interactiva** en la página de producto (`/product/{id}`), con tabla de equivalencias entre talles por letra, pulgadas US, talles AR/EU y medidas en centímetros.
- **Suite ampliada a 118 pruebas automatizadas** cubriendo edición de prendas (`PUT`), eliminación (`DELETE`), patronaje en centímetros, notificaciones Observer, Factory Method, aislamiento por marca y pruebas parametrizadas DRY (`@pytest.mark.parametrize`).

### Cambiado

- **Optimización de rendimiento 3D (WebGL / R3F), Red y Backend:**
  - Memoización de sub-árboles anatómicos y materiales PBR (`React.memo` + `useMemo` en `ParametricMannequin`, `ParametricPants`, `RealisticFace`, `RealisticHand`, `ModernShoe` y `HairComponent`), precarga de texturas (`useTexture.preload`) y tope de densidad de píxeles `dpr={[1, 2]}` en `<Canvas>`.
  - Hidratación directa de `image` y `available_colors` en `GET /api/v1/commerce/cart` mediante `joinedload` en `CartRepository`, eliminando las $N$ peticiones adicionales por prenda al abrir `/cart`.
  - Reutilización de filas validadas y commits por lotes en `process_catalog_background` para evitar el doble parseo de archivos Excel y reducir escrituras sincrónicas a disco.
- **Sección "Nuestro Movimiento" en Inicio (`/`):** igualación simétrica de altura entre la tarjeta de narrativa y el marco visual en escritorio (`lg:items-stretch`), incorporando una nueva composición visual de estudio acorde a la estética Liquid Glass y Gemelos Digitales 3D.
- **El mismo pantalón en otro talle o color es una línea aparte.** Solo se suman las unidades si coinciden prenda, talle **y** color; en cualquier otro caso se puede quitar cada variante por separado.
- **Pie de página:** el ícono del globo ahora es el logo de **GitHub** y abre el repositorio del proyecto en una pestaña nueva. Los links "Marketplace" y "Gemelo Digital" funcionan, y "Centro de Ayuda" lleva a `/ayuda`. Se incorporó el pie de página en todas las vistas principales (`/marketplace`, `/cart`, `/avatar`).
- En el marketplace, el filtro "Calce (Jeans)" pasa a llamarse **"Fit (Jeans)"**, igual que en las páginas de producto ("Straight Fit", "Mom Fit").
- El selector **"Probar en"** (elección de avatar) ahora aparece solo cuando el Probador Virtual 3D está abierto.
- Las líneas del carrito se muestran siempre en el orden en que se agregaron, con tope de 99 unidades por línea.
- **CI/CD en GitHub Actions:** el workflow `.github/workflows/main.yml` se ejecuta tanto en la rama `master` como en `main`.
- **Unificación de documentación y esquemas:** toda la documentación académica (Requerimientos, Casos de Uso Ronald Mak, Historias INVEST, SOLID, GoF, Diagramas de Clases/Estados/Componentes, Secuencia, DER y Resumen Ejecutivo) quedó centralizada en `docs/`.

### Eliminado

- Eliminados archivos residuales de prueba, activos duplicados no referenciados (`*_v2.png`, `tattoo_maori.*`), método muerto `_text_fallback` y carpetas de documentación duplicadas (`backend/docs/`, `update_log/`).

### Corregido

- Al quitar una prenda del carrito que se había agregado más de una vez, se eliminaban todas las unidades. Ahora se puede quitar una línea concreta o bajar la cantidad de a una.
- El navegador bloqueaba los cambios parciales (`PATCH`) por una restricción de CORS del backend; ahora está permitido.
- Eliminada URL hardcodeada `http://localhost:8000` en la página de inicio de sesión (`/login`), unificando las peticiones a través de `fetchApi`.
- Normalizado el valor de `waist_rise` en el probador 3D para aceptar tanto valores numéricos (`0.0–1.0`) como etiquetas de texto (`"Tiro Alto"`, `"Tiro Medio"`, `"Tiro Bajo"`), evitando valores `NaN` en la geometría de `ParametricPants`.
- Corregidos todos los errores de ESLint y React 19 Compiler (`react-hooks/immutability`, `react-hooks/set-state-in-effect` y tipado estricto en TypeScript).

---

## [1.0.0] - 2026-10-26

Primera versión estable. Este lanzamiento mejora la experiencia de compra (carrito y navegación), pasa los precios a pesos argentinos y permite **tener varios avatares por usuario**, pensado para quien compra ropa para otras personas, como un padre o una madre para sus hijos.

### Destacado

- 👨‍👩‍👧 **Múltiples avatares.** Cada usuario puede crear hasta 10 gemelos digitales con nombre propio y elegir con cuál probarse cada prenda.
- 🛒 **Carrito completo.** Vaciar el carrito, quitar prendas una por una y un contador que siempre está al día.
- 💲 **Precios en pesos argentinos** con formato local (`$ 89.900`).

[Sin publicar]: https://github.com/tominadal/TryOn_progra2/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tominadal/TryOn_progra2/releases/tag/v1.0.0
