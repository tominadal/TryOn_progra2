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
- **Suite ampliada a 90 pruebas automatizadas** cubriendo edición de prendas (`PUT`), eliminación (`DELETE`), notificaciones Observer, Factory Method y aislamiento por marca.

### Cambiado

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
