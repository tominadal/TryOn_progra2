# 0005 — Carrito: quitar prenda individual y contador al agregar

- **Fecha:** 2026-10-26
- **Autor:** Lucio
- **Rama:** lucio

## Resumen
Se cierran los dos pendientes de la entrada 0004: el contador del carrito en el Navbar ahora se actualiza al agregar una prenda desde la página del producto, y cada ítem del carrito tiene un botón para quitarlo individualmente.

## Cambios
- **[Fix]** El contador del Navbar no se actualizaba al tocar "Añadir al Carrito" en la página del producto. Ahora esa página dispara el evento `cart:updated` después de agregar. (`frontend/src/app/product/[id]/page.tsx`)
- **[Feat]** Cada ítem del carrito tiene un botón de tacho (arriba a la derecha de la tarjeta) para quitar solo esa prenda. No pide confirmación, porque es una acción chica y fácil de rehacer. Se deshabilita mientras procesa, actualiza la lista y el total, refresca el contador del Navbar y muestra el aviso "Prenda quitada del carrito". Tiene `aria-label` con el nombre de la prenda. (`frontend/src/app/cart/page.tsx`)
- **[Test]** 2 tests nuevos para `DELETE /commerce/cart/{item_id}`, que hasta ahora no tenía cobertura: quita solo el ítem indicado y recalcula el total, y devuelve 404 si el ítem pertenece al carrito de otro usuario. (`backend/tests/test_commerce.py`)

## Cómo probarlo
1. Iniciar sesión como `cliente@tryon.com`, abrir una prenda (`/product/1`) y tocar "Añadir al Carrito": el número del carrito en el Navbar sube al instante, sin recargar.
2. Abrir `/cart` con 2 o más prendas y tocar el tacho de una: desaparece solo esa, el total baja por su subtotal y el contador del Navbar se actualiza.
3. Quitar la última prenda: aparece "Tu carrito está vacío".
4. Backend: `python -m pytest tests/test_commerce.py` (8 tests).

## Pendiente / notas
- Agregar la misma prenda dos veces las fusiona en un solo ítem (suma cantidades). No hay controles de cantidad (+/-) en el carrito; hoy solo se puede quitar el ítem completo.
- El talle y el color que elige el usuario se envían al backend, pero este los ignora (`AddToCartRequest` solo tiene `garment_id` y `quantity`). Sigue pendiente de la auditoría.
