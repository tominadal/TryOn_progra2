# TryOnHub: Plataforma B2B2C de Prueba Virtual 3D y Modelado Generativo

Este repositorio contiene el código fuente de **TryOnHub**, un sistema de comercio electrónico avanzado con capacidades de prueba virtual tridimensional (Virtual Try-On), desarrollado como proyecto académico para la cátedra de Programación II.

## 🚀 Características Principales

- **Flujo B2B2C Completo**: Sistema multirrol donde las Marcas (B2B) suben fotos reales de sus prendas y los Consumidores (B2C) las prueban en sus gemelos digitales.
- **Generación 3D Paramétrica**: Integración con **Google Gemini 1.5 Pro Vision**. Las fotos subidas por las marcas son analizadas en tiempo real por la IA para extraer colores predominantes y metadatos paramétricos (escala, calce).
- **Vestidor Virtual (Fitting Room)**: Interfaz construida en React Three Fiber (R3F) donde los parámetros dictados por la IA deforman y colorean mallas base nativas para representar la prenda sobre el avatar personalizado del usuario.
- **Transacciones Robustas**: Gestión atómica de base de datos garantizando que no se publiquen prendas sin su respectivo modelado 3D, y que las marcas no queden huérfanas en fallos de red.

## 📚 Documentación y Rigor Académico

Hemos estructurado la documentación en `docs/` con el estándar de la cátedra:
- 📋 **[Requerimientos y Casos de Uso](docs/requerimientos_casos_uso.md)**: Requerimientos de alto nivel, endpoints RESTful, casos de uso formales e historias de usuario (INVEST).
- 🧩 **[Patrones de Diseño y Principios SOLID](docs/patrones_solid.md)**: Justificación detallada de Factory, Strategy, Decorator, Observer y Repository, junto a los 5 principios SOLID.
- 📐 **[Diagrama de Clases UML](docs/diagrama_clases.md)**: Diagrama completo de relaciones, interfaces y herencia en Mermaid.
- ⚙️ **[Diagrama de Secuencia](docs/diagrama_secuencia.md)**: Flujos temporales de Try-On, Ingesta masiva y procesamiento de IA.
- 📊 **[Diagrama de Entidad-Relación (ERD)](docs/diagrama_entidad_relacion.md)**: Modelo relacional de base de datos.
- 🎯 **[Resumen Ejecutivo](docs/resumen_ejecutivo.md)**: Propuesta de valor, métricas y viabilidad de negocio.
- 🖥️ **[Presentación Interactiva para Defensa](docs/presentacion.html)**: Slides interactivas para la defensa oral del proyecto (40% de la nota).

## 📋 Cumplimiento de Consignas de la Cátedra

| Consigna / Requisito | Estado | Detalle de Implementación |
|---|:---:|---|
| **1. Framework FastAPI** | ✅ | API modular con Routers, Dependency Injection y Pydantic v2 |
| **2. Autenticación y Seguridad** | ✅ | OAuth2 con JWT, hash bcrypt, control de roles (`BUYER`, `BRAND_ADMIN`, `PLATFORM_ADMIN`) |
| **3. SQLAlchemy ORM** | ✅ | Modelos relacionales con SQLAlchemy, migraciones Alembic y soporte SQLite/PostgreSQL |
| **4. Documentación y Casos de Uso** | ✅ | Requerimientos formales, Casos de Uso, Historias de Usuario, Swagger UI interactivo |
| **5. Contenedor Docker** | ✅ | `backend/Dockerfile` optimizado y `docker-compose.yml` para despliegue reproducible |
| **6. Funciones de Testing** | ✅ | **57 tests automatizados** (supera ampliamente el mínimo de 10) con `pytest` y `httpx` |
| **7. CI/CD con GitHub Actions** | ✅ | Workflow en `.github/workflows/main.yml` que valida la suite en cada commit |
| **8. Patrones de Diseño GoF** | ✅ | Factory, Strategy, Decorator, Observer y Repository |
| **9. Presentación y Defensa UML** | ✅ | `presentacion.html`, `diagrama_clases.md` y `diagrama_secuencia.md` |
| **10. Deploy** | ✅ | Archivo `render.yaml` para despliegue automatizado en la nube |

## 🏗 Arquitectura del Sistema

El sistema sigue una arquitectura desacoplada cliente-servidor (SPA + API REST).

### 1. Backend (FastAPI + SQLAlchemy)
- **Framework**: FastAPI (Python 3.11+)
- **Base de Datos**: SQLite (desarrollo/tests) / PostgreSQL (producción) con SQLAlchemy ORM.
- **Inteligencia Artificial**: Pipeline con `google-generativeai` y Mock alternativo (`USE_MOCK_AI=true`).
- **Arquitectura**: Patrón Repositorio, Servicios desacoplados con Strategy, Decorators para Caching/Logging y Observers para telemetría.

### 2. Frontend (Next.js + Three.js)
- **Framework**: Next.js 16 (App Router con Turbopack) + React 19
- **Gráficos 3D**: `@react-three/fiber` y `@react-three/drei` (WebGL) para el vestidor paramétrico interactivo.
- **Estilos**: TailwindCSS v4, Lucide Icons, diseño moderno y responsivo.

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
python seed.py           # Opcional: poblar base con jeans de muestra y usuarios
uvicorn app.main:app --reload --port 8000
```
- API y Documentación interactiva Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
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
cd backend
docker-compose up --build
```

### Ejecutar Pruebas Automatizadas

```bash
cd backend
venv\Scripts\python.exe -m pytest tests/ -v
```

---
*Desarrollado para la cátedra de Programación II.*

