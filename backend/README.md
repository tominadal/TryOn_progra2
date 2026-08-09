# TryOnHub Backend API

**Plataforma de Virtual Try-On — Backend FastAPI**

Sistema B2B2C diseñado para permitir a las marcas publicar prendas y a los consumidores probárselas virtualmente. Proyecto académico enfocado en buenas prácticas de arquitectura y diseño de software.

---

## Pila Tecnológica (Tech Stack)

| Capa | Tecnología |
|---|---|
| Framework API | **FastAPI** |
| ORM | **SQLAlchemy** y **Alembic** (para migraciones) |
| Base de Datos | **PostgreSQL** (producción) / SQLite (desarrollo y pruebas) |
| Autenticación | **JWT** (python-jose) y **bcrypt** (passlib) |
| Integración IA | **Google Gemini API** |
| Procesamiento de Imágenes | **Pillow** |
| Ingesta de Catálogos | **pandas** y **openpyxl** |
| Contenedores | **Docker** y **Docker Compose** |
| CI/CD | **GitHub Actions** |
| Pruebas Unitarias | **pytest** y **httpx** |

---

## Guía de Inicio Rápido (Desarrollo Local con SQLite)

### 1. Prerrequisitos
- Python 3.11+
- pip

### 2. Configuración del Entorno

```bash
# Clonar el repositorio y acceder al backend
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate   # En Windows
# source venv/bin/activate  # En Linux/Mac

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configuración de Variables de Entorno

Copiar `.env.example` a `.env` y completar los valores requeridos:

```env
GEMINI_API_KEY=su_clave_api_de_gemini
DATABASE_URL=sqlite:///./tryon_db.sqlite
SECRET_KEY=su_clave_secreta_de_al_menos_32_caracteres
BASE_URL=http://127.0.0.1:8000
```

*Nota: El archivo `.env` se encuentra excluido del control de versiones por razones de seguridad.*

### 4. Población de la Base de Datos (Seed)

```bash
python seed.py
```

Este script inicializa la base de datos con:
- 3 Roles: `Platform Admin`, `Brand Manager`, `Customer`
- 3 Usuarios de prueba
- 1 Marketplace y 1 Marca (Brand) de demostración
- 3 Prendas de muestra con sus respectivos recursos

### 5. Ejecución de la API

```bash
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva disponible en: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Despliegue con Docker Compose (PostgreSQL)

```bash
# Desde el directorio backend
docker compose up --build
```

Servicios desplegados:
- `api` — Aplicación FastAPI en el puerto `8000`
- `db` — Servidor PostgreSQL 15 en el puerto `5432`

---

## Ejecución de Pruebas Unitarias

```bash
# Desde el directorio backend
pytest --tb=short -v
```

El conjunto de pruebas utiliza una **base de datos SQLite en memoria**, garantizando aislamiento y prescindiendo de servicios externos.

Se espera la ejecución exitosa de **20+ pruebas** que evalúan los dominios de Autenticación, Catálogo, Comercio, Try-On y las Estrategias de IA.

---

## Arquitectura del Software

```
app/
├── main.py               # Instancia FastAPI, middleware y manejo de excepciones
├── config/
│   └── settings.py       # Configuración mediante Pydantic
├── routers/              # Capa de presentación (Endpoints HTTP)
│   ├── auth.py           
│   ├── users.py          
│   ├── catalog.py        
│   ├── tryon.py          
│   └── commerce.py       
├── services/             # Capa de lógica de negocio
│   ├── auth_service.py   
│   └── ai_strategy.py    # Implementación del Patrón Strategy
└── domain/               # Capa de dominio y acceso a datos
    ├── database.py        # Configuración del motor SQLAlchemy
    ├── models/            # Entidades del ORM
    │   ├── user.py        
    │   ├── organization.py
    │   ├── catalog.py     
    │   ├── experience.py  
    │   └── commerce.py    
    └── repositories/      # Implementación del Patrón Repository
        ├── base.py        
        ├── user_repository.py
        └── organization_repository.py
```

### Patrones de Diseño Implementados

1. **Patrón Repository**: Clases genéricas (`BaseRepository` / `CRUDBase`) que abstraen las operaciones de persistencia, desacoplando la lógica de negocio de las consultas directas al ORM.
2. **Patrón Strategy**: Definición de la interfaz `VirtualTryOnStrategy` y sus implementaciones concretas (`GeminiTryOnStrategy` para el entorno de producción y `MockTryOnStrategy` para pruebas). Permite la inyección y sustitución del motor de inteligencia artificial sin impactar las capas superiores.

---

## Consideraciones de Seguridad

- Almacenamiento seguro de contraseñas utilizando **bcrypt**.
- Emisión de tokens **JWT** con tiempo de expiración configurable.
- Validación estricta de la longitud mínima de `SECRET_KEY` (≥ 32 caracteres).
- Mitigación de riesgos en carga de archivos mediante validación de extensiones y límites de tamaño (10 MB para hojas de cálculo, 5 MB para imágenes).
- Sanitización de nombres de archivo para prevenir ataques de Directory Traversal.
- Configuración restrictiva de políticas CORS.

---

## Resumen de Endpoints de la API

| Método | Endpoint | Autorización | Descripción |
|--------|----------|--------------|-------------|
| POST | `/api/v1/auth/login` | Público | Generación de token JWT |
| POST | `/api/v1/users/` | Público | Registro de nuevos usuarios |
| GET | `/api/v1/users/me` | Autenticado | Recuperación de información del perfil |
| POST | `/api/v1/catalog/upload` | Rol Brand | Ingesta masiva de catálogo vía Excel |
| GET | `/api/v1/catalog/jobs/{id}` | Autenticado | Consulta de estado de procesamiento |
| GET | `/api/v1/catalog/garments` | Público | Listado de prendas activas |
| GET | `/api/v1/catalog/garments/{id}` | Público | Detalle de prenda específica |
| POST | `/api/v1/tryon/avatar` | Autenticado | Registro y actualización del avatar del usuario |
| GET | `/api/v1/tryon/avatar` | Autenticado | Recuperación de los datos del avatar |
| POST | `/api/v1/tryon/preview/{id}` | Autenticado | Generación de la experiencia Virtual Try-On |
| GET | `/api/v1/commerce/cart` | Autenticado | Visualización del carrito de compras |
| POST | `/api/v1/commerce/cart` | Autenticado | Adición de productos al carrito |
| DELETE | `/api/v1/commerce/cart/{item_id}` | Autenticado | Eliminación de productos del carrito |
| POST | `/api/v1/commerce/checkout` | Autenticado | Procesamiento de la compra |
| GET | `/api/v1/commerce/orders` | Autenticado | Historial de órdenes de compra |
| GET | `/health` | Público | Verificación de estado del sistema |

---

## Cumplimiento de Requerimientos Funcionales

| Requerimiento | Descripción | Módulos Implicados |
|---|---|---|
| RQ1 | Autenticación y Gestión de Usuarios (Roles) | `routers/auth.py`, `routers/users.py`, `services/auth_service.py` |
| RQ2 | Configuración del Avatar Digital | `routers/tryon.py` |
| RQ3 | Ingesta de Catálogos (B2B) | `routers/catalog.py` |
| RQ4 | Pipeline de IA (Procesamiento Asíncrono) | `routers/catalog.py` (BackgroundTasks), `services/ai_strategy.py` |
| RQ5 | Experiencia Virtual Try-On | `routers/tryon.py` |
| RQ6 | Flujo de Comercio Electrónico | `routers/commerce.py` |
