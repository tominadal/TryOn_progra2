# 0002 — Navbar: pestaña activa resaltada

- **Fecha:** 2026-10-23
- **Autor:** Lucio
- **Rama:** lucio

## Resumen
El menú superior ahora marca en qué sección estás (Inicio o Marketplace) con un rectángulo de borde redondeado alrededor de la pestaña activa.

## Cambios
- **[Feat]** La pestaña activa del Navbar se resalta con un rectángulo (`rounded-lg`) con borde y fondo suaves, y el texto con más contraste. (`frontend/src/components/Navbar.tsx`)
  - Modo claro: fondo `neutral-100`, borde `neutral-300`, texto negro.
  - Modo oscuro: fondo `neutral-900`, borde `neutral-700`, texto blanco. (Se usa un tono más claro que la barra para que el borde se note sobre el fondo casi negro.)
- "Inicio" se marca solo en `/`. "Marketplace" se marca en `/marketplace` y en `/product/...`, porque ver una prenda es parte del flujo del marketplace.
- Las pestañas inactivas llevan un borde transparente, así el texto no se corre al activarse.
- Se agrega `aria-current="page"` a la pestaña activa (accesibilidad).
- Se ajusta el espaciado entre pestañas (`gap-6` a `gap-2`) para compensar el padding nuevo.

## Cómo probarlo
1. Entrar a `/`: "Inicio" debe verse dentro de un rectángulo.
2. Entrar a `/marketplace`: el rectángulo pasa a "Marketplace".
3. Abrir una prenda (`/product/...`): "Marketplace" sigue marcado.
4. Cambiar entre modo claro y oscuro con el botón del Navbar: el rectángulo debe verse bien en ambos.
5. En `/cart`, `/login` o `/avatar` ninguna pestaña queda marcada (no son parte del menú).

## Pendiente / notas
- El menú del centro está oculto en pantallas chicas (`hidden md:flex`), así que el cambio no afecta a móvil. Un menú móvil queda como mejora a futuro.
