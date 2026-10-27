# 0004 — Carrito: opción para vaciarlo

- **Fecha:** 2026-10-26
- **Autor:** Lucio
- **Rama:** lucio

## Resumen
El carrito ahora tiene un botón "Vaciar carrito" que quita todas las prendas de una vez, con confirmación previa.

## Cambios
- **[Feat]** Nuevo endpoint `DELETE /api/v1/commerce/cart`: borra todos los ítems del carrito del usuario autenticado. Es idempotente: si el carrito está vacío o nunca se creó, responde 200 con `removed: 0`. Devuelve la cantidad de ítems quitados. (`backend/app/routers/commerce.py`)
- **[Feat]** Botón "Vaciar carrito" (rojo, con ícono de tacho) arriba a la derecha del título. Solo aparece si hay ítems. Pide confirmación (`window.confirm`), se deshabilita mientras procesa ("Vaciando...") y muestra un aviso de éxito o error con `sonner`. (`frontend/src/app/cart/page.tsx`)
- **[Fix]** El contador del carrito en el Navbar no se actualizaba al cambiar el carrito desde otra página. Ahora escucha el evento `cart:updated` y vuelve a consultar el carrito. La página del carrito lo dispara al vaciar y al pagar. (`frontend/src/components/Navbar.tsx`, `frontend/src/app/cart/page.tsx`)
- **[Test]** 3 tests nuevos: vaciar un carrito con ítems, vaciar un carrito vacío (idempotencia) y exigir autenticación. (`backend/tests/test_commerce.py`)

## Cómo probarlo
1. Iniciar sesión como `cliente@tryon.com`, agregar 2 o 3 prendas y abrir `/cart`.
2. Tocar "Vaciar carrito" y aceptar la confirmación: el carrito queda vacío, aparece "Carrito vaciado" y el contador del Navbar desaparece.
3. Tocar "Vaciar carrito" y cancelar: no pasa nada.
4. Con el carrito vacío, el botón no se muestra.
5. Backend: `python -m pytest tests/test_commerce.py` (6 tests).

## Pendiente / notas
- Al agregar una prenda desde la página de producto, el contador del Navbar todavía no se actualiza solo. Falta disparar `cart:updated` ahí (una línea).
- Todavía no hay botón para quitar un ítem individual, aunque el endpoint `DELETE /commerce/cart/{item_id}` ya existe.
- La confirmación usa el diálogo nativo del navegador. Se puede reemplazar por un modal propio más adelante.
