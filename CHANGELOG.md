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

**Al publicar una versión:**
1. Renombrar `[Sin publicar]` a `[X.Y.Z] - AAAA-MM-DD` y crear una sección `[Sin publicar]` vacía arriba.
2. Subir el número en `backend/app/config/settings.py` (`VERSION`) y en `frontend/package.json` (`version`).
3. Elegir el número: **PARCHE** para correcciones, **MENOR** para funcionalidades compatibles, **MAYOR** para cambios incompatibles.
4. Actualizar los enlaces al pie y crear el tag: `git tag vX.Y.Z`.

</details>

---

## [Sin publicar]

_Sin cambios pendientes._

---

## [1.0.0] - 2026-10-26

Primera versión estable. Este lanzamiento mejora la experiencia de compra (carrito y navegación), pasa los precios a pesos argentinos y permite **tener varios avatares por usuario**, pensado para quien compra ropa para otras personas, como un padre o una madre para sus hijos.

### Destacado

- 👨‍👩‍👧 **Múltiples avatares.** Cada usuario puede crear hasta 10 gemelos digitales con nombre propio y elegir con cuál probarse cada prenda.
- 🛒 **Carrito completo.** Vaciar el carrito, quitar prendas una por una y un contador que siempre está al día.
- 💲 **Precios en pesos argentinos** con formato local (`$ 89.900`).

### Añadido

**Avatares**
- Un usuario puede crear, renombrar, editar y eliminar hasta 10 avatares. La pantalla `/avatar` es ahora "Mis Gemelos Digitales".
- Selector **"Probar en"** en la página de cada prenda: al cambiar de avatar, el maniquí 3D, las medidas y el diagnóstico de talle se actualizan al instante.
- El último avatar elegido se recuerda en el navegador.
- API: `GET/POST /api/v1/tryon/avatars` y `GET/PUT/DELETE /api/v1/tryon/avatars/{id}`. Cada usuario solo puede ver y modificar sus propios avatares.
- `POST /api/v1/tryon/preview/{garment_id}` acepta el parámetro opcional `avatar_id`.
- Actualización automática del esquema de la base de datos al iniciar la API: las bases creadas con versiones anteriores se actualizan solas y conservan sus datos.

**Carrito y compras**
- Botón **"Vaciar carrito"** con confirmación (API: `DELETE /api/v1/commerce/cart`).
- Botón para **quitar una prenda individual** del carrito.
- El contador del carrito en la barra superior se actualiza al instante al agregar, quitar, vaciar o pagar.

**Navegación**
- La pestaña activa de la barra superior (Inicio o Marketplace) se resalta con un recuadro, con estilos para modo claro y oscuro. Marketplace se mantiene resaltado al ver una prenda.

**Calidad**
- 14 tests nuevos en el backend (de 57 a 71): carrito, múltiples avatares, aislamiento entre usuarios y actualización de una base de datos vieja.

### Cambiado

- Todos los precios están en **pesos argentinos (ARS)**, sin decimales y con formato `es-AR`: inicio, marketplace, producto, carrito y panel de marca.
- Los filtros de precio del marketplace se adaptaron a pesos: menos de $70.000, $70.000 a $100.000 y más de $100.000.
- El formulario de carga de prendas de las marcas pide el precio en ARS.
- Al guardar un avatar, el usuario se queda en la página (antes lo llevaba al inicio) para poder crear otro.
- El seed carga precios de ejemplo en pesos para las 6 prendas de muestra.

### Eliminado

- **Cambio incompatible:** `GET /api/v1/tryon/avatar` y `POST /api/v1/tryon/avatar` (en singular), que asumían un único avatar por usuario. Se reemplazan por los endpoints `/tryon/avatars`. El frontend ya usa los nuevos.

### Corregido

- El botón **"Empezar a Comprar"** del carrito vacío llevaba al inicio; ahora lleva al marketplace.
- Los ítems del carrito se mostraban con **precio $0**.
- Al **recargar (F5)** en el carrito o en la pantalla de avatar, la plataforma pedía iniciar sesión de nuevo.
- Las letras **"g"** del título de la página de inicio se veían cortadas por abajo.
- Las medidas corporales detalladas de un avatar (pecho, vientre, cadera, etc.) **no se aplicaban en el probador** y se perdían al volver a editar el avatar.

### Documentación

- Se actualizaron el diagrama entidad-relación (Usuario → Avatar pasa de 1:1 a 1:N), el diagrama de clases, el diagrama de secuencia, los requerimientos y casos de uso, y el README del backend.

### Notas de actualización

Pasos al actualizar desde una versión anterior:

1. **Reiniciar el backend.** La tabla de avatares se actualiza sola y los avatares existentes se conservan con el nombre "Mi avatar". También se puede ejecutar `python seed.py`.
2. **Ejecutar `python seed.py`** para actualizar los precios de las 6 prendas de muestra a pesos.
3. Las prendas que una marca haya cargado con precios en dólares **no se convierten solas**: hay que editar su precio.
4. Si algún cliente externo usaba `/tryon/avatar` (singular), debe migrar a `/tryon/avatars`.

### Problemas conocidos

- El talle y el color que elige el usuario se envían al agregar al carrito, pero el pedido todavía no los registra.
- El carrito no tiene controles de cantidad (+/−): solo se puede quitar la prenda completa.
- El formulario de suscripción al boletín del pie de página es solo visual y no guarda correos.
- La actualización automática de esquema para PostgreSQL no se probó en un entorno real (solo SQLite). Conviene probarla en una copia antes de desplegar en producción.
- Las migraciones de Alembic no permiten crear la base desde cero; el esquema se crea con `create_all`.

[Sin publicar]: https://github.com/tominadal/TryOn_progra2/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/tominadal/TryOn_progra2/releases/tag/v1.0.0
