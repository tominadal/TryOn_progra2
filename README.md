# TryOnHub: Plataforma B2B2C de Prueba Virtual 3D y Modelado Generativo

Este repositorio contiene el código fuente de **TryOnHub**, un sistema de comercio electrónico avanzado con capacidades de prueba virtual tridimensional (*Virtual Try-On*), desarrollado como proyecto académico para la cátedra de **Programación II**.

> 📋 Novedades y cambios de cada versión: **[CHANGELOG.md](CHANGELOG.md)**

## 🚀 Características Principales

- **Flujo B2B2C Completo**: Sistema multirrol donde las Marcas (`BRAND_MANAGER`) administran su catálogo completo (alta individual con patronaje en centímetros, carga masiva por Excel, edición y baja de prendas) y los Consumidores (`CUSTOMER`) las prueban sobre hasta 10 gemelos digitales personalizados en centímetros (`cm`).
- **Generación 3D Paramétrica Dual (IA + Patronaje en Centímetros)**: Integración con **Google Gemini 2.5 Flash Vision** para analizar fotografías reales de prendas y extraer descriptores 3D (`scale_x`, `scale_y`, `taper`, `waist_rise`, `roughness`, `distress`, `has_cuff`, `has_pleats`) combinados con medidas reales de patronaje en `cm` (`waist_cm`, `hip_cm`, `thigh_cm`, `inseam_cm`, `hem_width_cm`, `rise_cm`) y motor paramétrico instantáneo (`build_parametric_metadata`).
- **Vestidor Virtual 3D con Lofting Anatómico Continuo (Fitting Room WebGL)**: Interfaz construida en **React Three Fiber (R3F)** con geometrías lofteadas continuas (`buildLoftedGeometry`, `getHeadLoftRings`, `buildSurfaceEyebrowGeometry`, `buildSkullConformedHairCap`), manos y dedos articulados, y diagnóstico antropométrico en tiempo real (`Avatar cm vs. Prenda cm`) a 60 FPS.
- **Transacciones ACID y Telemetría Observer**: Gestión atómica de base de datos con `rollback` automático ante fallos de IA, y monitoreo en vivo de lotes mediante el patrón `Observer` (`GET /api/v1/catalog/notifications`).

## 📚 Documentación y Rigor Académico

Toda la documentación oficial se encuentra unificada y actualizada en [`docs/`](docs/):
- 📋 **[Requerimientos, Casos de Uso e Historias de Usuario](docs/requerimientos_casos_uso.md)**: RF, RNF, tabla completa de endpoints RESTful, Casos de Uso con las 11 secciones de Ronald Mak e Historias de Usuario validadas con criterios **INVEST**.
- 🧩 **[Patrones de Diseño GoF y Principios SOLID](docs/patrones_solid.md)**: Justificación en código de *Strategy*, *Decorator* (*Starbuzz Coffee*), *Observer* (comparativa *Push vs. Pull*), *Factory Method* (`IStrategyFactory` → `StrategyFactory`) y *Repository*, junto a los 5 principios SOLID.
- 📐 **[Diagramas UML Estructurales y de Estado](docs/diagrama_clases.md)**: Diagramas de Clases (Dominio, GoF y Repositorios), Diagramas de Estado (`ProcessingJob` y `Order`) y Diagrama de Componentes.
- ⚙️ **[Diagramas de Secuencia UML](docs/diagrama_secuencia.md)**: Flujos temporales de Alta/Edición (`PUT`), Eliminación (`DELETE`), Probador 3D, Observer, Decorator, Factory y Checkout.
- 📊 **[Diagrama de Entidad-Relación (ERD)](docs/diagrama_entidad_relacion.md)**: Esquema relacional completo de las 11 tablas de la base de datos.
- 💼 **[Modelo de Negocios y Plan Maestro de Paso a Producción](docs/modelo_de_negocios.md)**: Análisis estratégico (*Zero to One*, *Pattern Breakers*, Sarmiento 1849, General Magic), Unit Economics B2B2C y arquitectura de 8 dimensiones para producción Cloud.
- 🎯 **[Resumen Ejecutivo y Creación de Valor](docs/resumen_ejecutivo.md)**: Propuesta de valor analizada bajo *Zero to One* (Peter Thiel) y *Pattern Breakers* (Mike Maples).
- 🖥️ **[Presentación Interactiva para Defensa](docs/presentacion.html)**: Slides interactivas listas para la defensa oral del proyecto.

## 📋 Cumplimiento de Consignas de la Cátedra

| Consigna / Requisito | Estado | Detalle de Implementación |
|---|:---:|---|
| **1. Framework FastAPI (RESTful CRUD)** | ✅ | API modular con ciclo CRUD completo (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), Dependency Injection y Pydantic v2 |
| **2. Autenticación y Seguridad (RBAC)** | ✅ | OAuth2 con JWT stateless (`sub`, `iat`, `role`, `exp`), hash bcrypt, control de roles y ownership (`PLATFORM_ADMIN`, `BRAND_MANAGER`, `CUSTOMER`) |
| **3. SQLAlchemy ORM 2.0** | ✅ | 11 modelos relacionales con `DeclarativeBase` (SQLAlchemy 2.0), migración automática de esquema y normalización SQLite/PostgreSQL |
| **4. Documentación y Casos de Uso** | ✅ | Requerimientos formales, Casos de Uso (Ronald Mak), Historias de Usuario INVEST, Plan a Producción y Swagger UI (`/docs`) |
| **5. Contenedor Docker** | ✅ | `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore` y `docker-compose.yml` para despliegue reproducible |
| **6. Funciones de Testing** | ✅ | **118 tests automatizados** (casi 12x el mínimo de 10 exigido) con `pytest`, `@pytest.mark.parametrize` (DRY) y `TestClient` |
| **7. CI/CD con GitHub Actions** | ✅ | Workflow en `.github/workflows/main.yml` ejecutado en cada push/PR (`master` y `main`) para Backend y Frontend |
| **8. Patrones de Diseño GoF + SOLID** | ✅ | Strategy, Decorator, Observer, Factory Method y Repository + 5 principios SOLID |
| **9. Presentación y Defensa UML** | ✅ | `docs/presentacion.html`, `diagrama_clases.md`, `diagrama_secuencia.md` y `diagrama_entidad_relacion.md` |
| **10. Deploy Cloud** | ✅ | Manifiesto `render.yaml` para despliegue automatizado en Render |

## 🏗 Arquitectura del Sistema

### 1. Backend (`backend/` — FastAPI + SQLAlchemy)
- **Framework**: FastAPI (Python 3.11+)
- **Persistencia**: SQLite (desarrollo/tests) / PostgreSQL (producción) a través del patrón Repository (`garment_repo`, `job_repo`, `avatar_repo`, `cart_repo`, `order_repo`).
- **Inteligencia Artificial**: Pipeline multimodal con Gemini Vision y estrategia Mock determinística (`USE_MOCK_AI=true`).

### 2. Frontend (`frontend/` — Next.js + Three.js + Liquid Glass UI)
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Gráficos 3D Optimizado**: `@react-three/fiber` y `@react-three/drei` (WebGL) con componentes anatómicos memoizados (`React.memo` + `useMemo`), precarga de texturas PBR (`useTexture.preload`) y control adaptativo de densidad de píxeles (`dpr={[1, 2]}`).
- **Sistema Estético Liquid Glass & 100% Responsivo**: TailwindCSS v4 con capas de cristal translúcido (`backdrop-filter: blur() saturate()`), bordes especulares internos, filtro de refracción óptica SVG (`#liquid-glass-refract`), soporte nativo claro/oscuro (`next-themes`) y adaptación fluida desde `320px` (Mobile) hasta `1440px+` (Desktop).

## 🛠 Instalación y Ejecución

### Opción 1: Desarrollo Local

#### Backend
```bash
cd backend
python -m venv venv
# Activar entorno virtual:
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed.py           # Poblar base con roles, usuarios y 6 prendas de muestra
uvicorn app.main:app --reload --port 8000
```
- Documentación interactiva Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Aplicación web: [http://localhost:3000](http://localhost:3000)

### Opción 2: Docker Compose

```bash
docker-compose up --build
```

### Ejecutar Pruebas Automatizadas (118 Tests)

```bash
cd backend
venv\Scripts\python.exe -m pytest -v
```

---
*Desarrollado para la cátedra de Programación II.*
