# TryOnHub: Plataforma B2B2C de Prueba Virtual 3D y Modelado Generativo

Este repositorio contiene el código fuente de **TryOnHub**, un sistema de comercio electrónico avanzado con capacidades de prueba virtual tridimensional (Virtual Try-On), desarrollado como proyecto académico para la cátedra de Programación II.

## 🚀 Características Principales

- **Flujo B2B2C Completo**: Sistema multirrol donde las Marcas (B2B) suben fotos reales de sus prendas y los Consumidores (B2C) las prueban en sus gemelos digitales.
- **Generación 3D Paramétrica**: Integración con **Google Gemini 1.5 Pro Vision**. Las fotos subidas por las marcas son analizadas en tiempo real por la IA para extraer colores predominantes y metadatos paramétricos (escala, calce).
- **Vestidor Virtual (Fitting Room)**: Interfaz construida en React Three Fiber (R3F) donde los parámetros dictados por la IA deforman y colorean mallas base nativas para representar la prenda sobre el avatar personalizado del usuario.
- **Transacciones Robustas**: Gestión atómica de base de datos garantizando que no se publiquen prendas sin su respectivo modelado 3D, y que las marcas no queden huérfanas en fallos de red.

## 📚 Documentación de Arquitectura

Hemos estructurado la documentación en directorios separados para facilitar su lectura:
- 📊 **[Diagrama de Entidad-Relación (ERD)](docs/diagrama_entidad_relacion.md)**: Estructura de la base de datos (Roles, Marcas, Prendas, etc).
- ⚙️ **[Diagrama de Secuencia de Subida e IA](docs/diagrama_secuencia.md)**: Flujo de comunicación entre el Frontend, FastAPI, la Base de Datos y Gemini Vision.

## 🏗 Arquitectura del Sistema

El sistema sigue el patrón cliente-servidor (SPA + API REST).

### 1. Backend (Motor Inteligente y API)
- **Framework**: FastAPI (Python 3.9+)
- **Base de Datos**: SQLite gestionado con SQLAlchemy (ORM) y migraciones con Alembic.
- **Inteligencia Artificial**: Pipeline asíncrono con `google-generativeai` que transforma imágenes PNG/JPG en un `metadata_json` que el frontend luego compila dinámicamente en WebGL.

### 2. Frontend (Motor 3D Cliente)
- **Framework**: React (Next.js 14+)
- **Gráficos 3D**: `@react-three/fiber` y `@react-three/drei` (WebGL).
- **Diseño UI/UX**: TailwindCSS, `lucide-react`, Glassmorphism, y notificaciones con react-hot-toast.
- **Motor Paramétrico Propio**: Al prescindir de servicios externos caídos, creamos un motor nativo `AvatarCreatorNative` extremadamente modular que manipula la topología de avatares en el navegador del cliente.

## 🛠 Instalación y Configuración

### Backend
1. Navega a `cd backend/`
2. Instala dependencias: `pip install -r requirements.txt`
3. Configura las variables de entorno `.env` incluyendo tu `GEMINI_API_KEY`.
4. Inicia el servidor: `python -m uvicorn app.main:app --reload --port 8000`

### Frontend
1. Navega a `cd frontend/`
2. Instala paquetes: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`

---
*Desarrollado para la cátedra de Programación II.*
