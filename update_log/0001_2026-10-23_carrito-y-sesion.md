# 0001 — Carrito: precios, redirección y sesión al recargar

- **Fecha:** 2026-10-23
- **Autor:** Lucio
- **Rama:** lucio

## Resumen
Se corrigen tres problemas del carrito y un detalle visual del título del Inicio, detectados al probar la plataforma en local, y se crea este update log.

## Cambios
- **[Fix]** El botón "Empezar a Comprar" del carrito vacío llevaba al inicio (`/`). Ahora lleva al marketplace (`/marketplace`). (`frontend/src/app/cart/page.tsx`)
- **[Fix]** Los ítems del carrito se mostraban con precio `$0.00`. El backend devuelve `unit_price` y `subtotal` por ítem, pero el front leía `item.price`, que no existe. Se actualizó la interfaz `CartItem` y la vista para usar `unit_price`. (`frontend/src/app/cart/page.tsx`)
- **[Fix]** Al recargar (F5) estando en `/cart` pedía loguearse otra vez. La página redirigía a `/login` apenas montaba, antes de que `AuthContext` terminara de restaurar la sesión desde el token. Ahora espera a que termine de cargar la sesión (`loading` de `useAuth`) antes de decidir si redirige. (`frontend/src/app/cart/page.tsx`)
- **[Fix]** Mismo problema de F5 en `/avatar`, corregido de la misma forma. (`frontend/src/app/avatar/page.tsx`)
- **[Fix]** En el título del Inicio, las "g" de "gemelo" y "digital" aparecían cortadas por abajo. El título usa `bg-clip-text` (texto con degradado) y `leading-[1.1]`: el degradado solo se pinta dentro de la caja del `<h1>`, y los descendentes de la última línea sobresalían de esa caja. Se agregó `pb-3` al `<h1>` para que la caja los incluya. (`frontend/src/app/page.tsx`)
- **[Docs]** Se crea la carpeta `update_log/` con su convención y plantilla.

## Cómo probarlo
1. Levantar backend y frontend, e iniciar sesión con `cliente@tryon.com`.
2. Con el carrito vacío, entrar a `/cart` y tocar "Empezar a Comprar": debe abrir `/marketplace`.
3. Agregar una o varias prendas al carrito: cada ítem debe mostrar su precio real, y el resumen el total.
4. Estando en `/cart` (y en `/avatar`), presionar F5: debe quedarse en la página, sin pedir login.
5. Cerrar sesión y entrar a `/cart` directo: debe redirigir a `/login`.
6. En el Inicio, mirar el título: las "g" de "gemelo" y "digital" deben verse completas, con su curva inferior.

## Pendiente / notas
- El subtotal por línea (`subtotal`) ya llega del backend pero la vista sigue mostrando solo el precio unitario.
- `/brand/dashboard` tiene el problema inverso: sin sesión queda en blanco en vez de redirigir.
- El resto de mejoras detectadas en la auditoría sigue pendiente.
