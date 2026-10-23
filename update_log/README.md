# Update Log

Registro interno de cambios de TryOnHub. Cada push relevante deja una entrada acá, para saber de un vistazo qué cambió, por qué y cómo probarlo.

## Convención

- Un archivo por entrada: `NNNN_YYYY-MM-DD_titulo-corto.md`
  - `NNNN`: número correlativo (0001, 0002, ...), define el orden.
  - Fecha del push, y un título corto en minúsculas con guiones.
- Se escribe **al terminar** un grupo de cambios, antes (o junto con) el push.
- Se agrega el archivo a la tabla de abajo, la más reciente arriba.
- Es documentación de desarrollo: lenguaje simple, sin formalidades.

## Plantilla

```markdown
# NNNN — Título

- **Fecha:** YYYY-MM-DD
- **Autor:** nombre
- **Rama:** nombre-de-la-rama

## Resumen
Una o dos líneas de qué se hizo.

## Cambios
- **[Fix | Feat | Refactor | Docs | Chore]** Qué cambió y por qué. (`ruta/archivo`)

## Cómo probarlo
1. Pasos concretos.

## Pendiente / notas
- Cosas que quedaron fuera o que conviene saber.
```

## Entradas

| # | Fecha | Título | Autor |
|---|---|---|---|
| [0002](0002_2026-10-23_navbar-pestana-activa.md) | 2026-10-23 | Navbar: pestaña activa resaltada | Lucio |
| [0001](0001_2026-10-23_carrito-y-sesion.md) | 2026-10-23 | Carrito: precios, redirección y sesión al recargar | Lucio |
