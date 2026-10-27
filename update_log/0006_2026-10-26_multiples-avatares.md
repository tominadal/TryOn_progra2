# 0006 — Múltiples avatares y selector en el probador

- **Fecha:** 2026-10-26
- **Autor:** Lucio
- **Rama:** lucio

## Resumen
Un usuario ya no está limitado a un solo avatar: puede crear varios (por ejemplo, un padre o madre con un avatar por cada hijo), ponerles nombre, editarlos y eliminarlos. En el Probador Virtual se elige con cuál avatar probarse cada prenda.

## Cambios

### Backend
- **[Feat]** Un usuario puede tener hasta 10 avatares (`MAX_AVATARS_PER_USER`). La tabla `avatars` pierde el `UNIQUE` sobre `user_id` y gana la columna `name` (default `"Mi avatar"`). (`backend/app/domain/models/experience.py`, `backend/app/domain/models/user.py`, `backend/app/constants.py`)
- **[Feat]** Endpoints nuevos bajo `/api/v1/tryon/avatars` (`backend/app/routers/tryon.py`):
  - `GET /avatars` lista los avatares del usuario (más antiguo primero).
  - `POST /avatars` crea uno (201). Responde 400 al pasar el máximo.
  - `GET /avatars/{id}`, `PUT /avatars/{id}` (actualización parcial) y `DELETE /avatars/{id}`.
  - Todos verifican que el avatar sea del usuario autenticado: el de otra persona responde 404.
- **[Feat]** `POST /tryon/preview/{garment_id}` acepta `?avatar_id=` para elegir con qué avatar generar el preview. Si no se indica, usa el primero. Un `avatar_id` inexistente o ajeno responde 404.
- **[Breaking]** Se eliminan `GET/POST /tryon/avatar` (singular), que asumían un único avatar. El frontend ya usa los nuevos.
- **[Feat]** El nombre se valida: se recortan espacios, no puede quedar vacío y tiene un máximo de 50 caracteres. (`backend/app/domain/schemas/experience.py`)
- **[Feat]** Actualización automática del esquema para bases existentes. El proyecto crea sus tablas con `create_all`, que nunca modifica tablas que ya existen, así que se agregó `upgrade_schema()`. Detecta la tabla `avatars` vieja y la reconstruye conservando los datos (SQLite) o la altera (PostgreSQL). Es idempotente y se ejecuta al arrancar la API y en `seed.py`. (`backend/app/domain/schema_upgrades.py`, `backend/app/main.py`, `backend/seed.py`)
- **[Test]** 9 tests nuevos en `backend/tests/test_multi_avatar.py` (crear varios, nombre, actualización parcial, eliminar, aislamiento entre usuarios, límite, autenticación, preview y migración de una base vieja). Los 4 tests de avatar existentes pasaron a los endpoints nuevos.

### Frontend
- **[Feat]** `/avatar` ahora es "Mis Gemelos Digitales": fila de avatares con su nombre, botón "Nuevo avatar", campo de nombre y botón "Eliminar avatar" (con confirmación). Se muestra el contador `n/10`. Al guardar, el usuario se queda en la página (antes lo mandaba al inicio) para poder crear otro. (`frontend/src/app/avatar/page.tsx`)
- **[Feat]** En la página de un producto aparece "Probar en" con un botón por avatar. Al cambiar de avatar, el maniquí 3D, las medidas y el diagnóstico de talle se actualizan al instante. Incluye un link a "Gestionar avatares". (`frontend/src/app/product/[id]/page.tsx`)
- **[Feat]** El último avatar elegido se recuerda en el navegador (`localStorage`) y se usa tanto en `/avatar` como en el probador. (`frontend/src/lib/avatars.ts`)
- **[Fix]** Al reabrir un avatar guardado, los morphs corporales (pecho, vientre, cadera, etc.) se perdían: el editor arrancaba en 1.0 y los sobrescribía al guardar. Ahora se cargan. (`frontend/src/app/avatar/page.tsx`)
- **[Fix]** En el probador, los morphs no se aplicaban: se hacía `JSON.parse` sobre un objeto, fallaba en silencio y quedaban en `{}`. Ahora se aceptan objeto o texto JSON. (`frontend/src/lib/avatars.ts`)

### Docs
- Se actualizaron el ERD (relación User → Avatar de 1:1 a 1:N), el diagrama de clases, el diagrama de secuencia, los requerimientos y casos de uso, y el README del backend con los endpoints nuevos.

## Cómo probarlo
1. **Actualizar la base:** reiniciar el backend. El esquema se actualiza solo y los avatares existentes se conservan (con el nombre "Mi avatar"). También se puede correr `python seed.py`.
2. Iniciar sesión como `cliente@tryon.com` y abrir `/avatar`.
3. Tocar "Nuevo avatar", ponerle un nombre (ej. "Mateo"), cambiar la altura y guardar. Aparece como segunda opción y el avatar original queda intacto.
4. Alternar entre avatares: el editor muestra los valores de cada uno.
5. Abrir una prenda (`/product/1`), elegir un avatar en "Probar en" y tocar "Probarse en 3D". Cambiar de avatar con el probador abierto: el maniquí y el diagnóstico de talle cambian.
6. Eliminar un avatar desde `/avatar`.
7. Backend: `python -m pytest` (71 tests).

## Pendiente / notas
- **Producción (Render/PostgreSQL):** `upgrade_schema()` también cubre PostgreSQL, pero esa rama **no fue probada** (solo SQLite). Conviene probarla en una copia antes de desplegar. Las migraciones de Alembic siguen sin servir para una base vacía (ver auditoría).
- El avatar elegido se guarda por navegador, no por cuenta. Si se quiere que el avatar "predeterminado" siga al usuario entre dispositivos, habría que guardarlo en el backend.
- Compras para terceros: el pedido todavía no registra para qué avatar se compró ni el talle elegido.
- Los archivos `backend/app/dto/experience.py` y `backend/app/domain/schemas/avatar.py` son copias de los esquemas que no se usan, así que no se actualizaron.
