# TryOnHub Frontend — Next.js 16 + React Three Fiber + Liquid Glass UI

Interfaz web B2B2C de **TryOnHub**, construida con **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **TailwindCSS v4** y **React Three Fiber (Three.js / WebGL)**.

## ✨ Características Principales

- **Sistema de Diseño Liquid Glass 100% Responsivo**:
  - Superficies translúcidas multicapa (`.liquid-glass-nav`, `.liquid-glass-panel`, `.liquid-glass-card`, `.liquid-glass-pill`, `.liquid-glass-input`) con `backdrop-filter: blur() saturate(190%)`, reflejos especulares internos (`inset 0 1px 1px`) y sombras cromáticas difusas.
  - Filtro SVG global de refracción óptica (`#liquid-glass-refract` con `feTurbulence` + `feDisplacementMap`) integrado en `src/app/layout.tsx`.
  - Soporte completo para Modo Claro y Modo Oscuro (`next-themes`) y accesibilidad (`prefers-reduced-transparency`).
  - Diseño adaptativo en todos los breakpoints (`320px` Mobile, `640px` Tablet, `1024px` Laptop, `1440px+` Desktop).
- **Motor 3D Paramétrico de Alto Rendimiento (`src/components/avatar/`)**:
  - Gemelo digital antropométrico (`ParametricMannequin`) y prendas deformables en tiempo real (`ParametricPants`).
  - Sub-árboles anatómicos (`RealisticFace`, `RealisticHand`, `ModernShoe`, `HairComponent`) y materiales PBR memoizados (`React.memo` + `useMemo`), precarga de texturas (`useTexture.preload`) y control de densidad de píxeles (`dpr={[1, 2]}`) para mantener 60 FPS estables.
- **Flujo B2C y B2B Completo**:
  - **Consumidores (`/`, `/marketplace`, `/product/[id]`, `/avatar`, `/cart`, `/ayuda`)**: Exploración de catálogo, probador virtual 3D con diagnóstico inteligente de calce, gestión de hasta 10 gemelos digitales y carrito por variante (talle/color) hidratado en una única consulta HTTP.
  - **Marcas (`/brand/dashboard`)**: Alta individual de prendas (con IA Vision o motor paramétrico determinístico), edición (`PUT`), baja segura (`DELETE`), importación masiva por Excel con barra de progreso y monitor `Observer` en tiempo real.

## 🚀 Ejecución en Desarrollo Local

```bash
cd frontend
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador (requiere el backend FastAPI corriendo en `http://127.0.0.1:8000`).

## 🧪 Verificación de Tipos y Linter

```bash
npx tsc --noEmit
npm run lint
```
