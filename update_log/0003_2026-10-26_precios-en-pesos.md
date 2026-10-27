# 0003 — Precios en pesos argentinos

- **Fecha:** 2026-10-26
- **Autor:** Lucio
- **Rama:** lucio

## Resumen
Los precios pasan de dólares a pesos argentinos (ARS). Los precios se guardan directamente en pesos, sin cotización en el código, y se muestran con formato argentino (`$ 89.900`).

## Cambios
- **[Feat]** Nuevo helper `formatPrice()` que formatea con `Intl.NumberFormat("es-AR")`, moneda ARS y sin decimales. (`frontend/src/lib/format.ts`)
- **[Feat]** Todas las pantallas que mostraban precios usan `formatPrice()`: inicio, marketplace, producto, carrito (unitario y total) y tabla del dashboard de marca. (`frontend/src/app/...`)
- **[Feat]** El seed carga precios redondos en pesos, sin conversión por cotización: 501 Original `$89.900`, 711 Skinny `$79.900`, 90s Vintage Mom `$109.900`, Bermuda `$64.900`, Pollera `$69.900`, Flared `$104.900`. (`backend/seed.py`)
- **[Fix]** Los filtros de precio del marketplace estaban pensados en dólares (menos de 50 / 50-100 / más de 100) y ahora son en pesos: menos de `$70.000` / `$70.000 - $100.000` / más de `$100.000`. (`frontend/src/app/marketplace/page.tsx`)
- **[Feat]** El formulario de carga de prendas del dashboard pide el precio en ARS (etiqueta y ejemplo `89900`). (`frontend/src/app/brand/dashboard/page.tsx`)

## Cómo probarlo
1. Actualizar la base local: `python seed.py` (desde `backend/`). Actualiza los precios de las 6 prendas del seed.
2. Marketplace: los precios se ven como `$ 89.900` y los filtros de precio devuelven 2 prendas por rango.
3. Producto, carrito y tabla del dashboard: mismo formato.
4. Dashboard de marca: subir una prenda con precio `45000` y ver `$ 45.000` en la tabla.

## Pendiente / notas
- **Los precios en la base no se convierten solos.** El seed solo actualiza las 6 prendas originales. Las prendas que se hayan subido desde el dashboard con un precio en dólares siguen con ese valor hasta que se editen.
- Los precios de seed son valores de ejemplo redondeados, no una conversión por cotización.
- Los tests del backend usan precios de ejemplo en dólares (`49.99`, `59.99`). Es solo dato de prueba y no afecta nada.
- La validación de precio en el backend sigue sin exigir mayor o igual a 0 (ver auditoría).
