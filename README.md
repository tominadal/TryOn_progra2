# TryOnHub: Plataforma B2B2C de Prueba Virtual 3D

Este repositorio contiene el código fuente de **TryOnHub**, un sistema de comercio electrónico avanzado con capacidades de prueba virtual tridimensional (Virtual Try-On), desarrollado como proyecto académico para la cátedra de Programación II.

## Arquitectura del Sistema

La arquitectura sigue el patrón cliente-servidor, componiéndose de dos subsistemas principales:

### 1. Backend (Motor Paramétrico y API REST)
Desarrollado en **Python (FastAPI)**, actúa no solo como API transaccional sino como motor de preprocesamiento de geometría tridimensional.

- **Generación Paramétrica de Prendas**: Utiliza la librería `trimesh` para la construcción matemática de mallas 3D (`.glb`). Los parámetros base de la malla se derivan del análisis semántico del catálogo mediante la API de **Google Gemini 1.5 Pro**.
- **Gestión de Base de Datos**: Emplea **SQLAlchemy** (ORM) sobre una base de datos SQLite para la gestión de usuarios (consumidores y marcas), catálogos (SKUs) y metadatos de los modelos 3D (`thumbnail_url`, `model_3d_url`).
- **Migraciones**: Integración con **Alembic** para el control de versiones del esquema relacional.

### 2. Frontend (Motor 3D de Cliente y SPA)
Desarrollado en **React (Next.js)**, proporcionando una Single Page Application de alto rendimiento y una interfaz de usuario inmersiva.

- **Creador de Avatares Nativo (Paramétrico)**: Se desarrolló un motor 3D propietario utilizando `@react-three/fiber` y `@react-three/drei`. El módulo genera un avatar jerárquico que asegura la correcta articulación (ej. brazos y codos conectados), adapta proporciones anatómicas según género (masculino/femenino), y aplica transformaciones espaciales en tiempo real (escala y color) basadas en parámetros ingresados por el usuario.
- **Composición 3D Integrada (Fitting Room)**: El lienzo interactivo (Virtual Try-On) está completamente inmerso en la página del producto. Cuenta con un entorno simulado de vestidor (suelo ajustado geométricamente, paredes, reflejos) donde la geometría paramétrica de la prenda (Skinny, Mom Fit, Straight, etc.) se moldea dinámicamente sobre las piernas del avatar en tiempo real.
- **Catálogo Dinámico e IA**: Interfaz de Marketplace 100% funcional con filtrado en vivo por precios y calces. Cada producto cuenta con su propia galería de imágenes de alta fidelidad con vistas laterales y traseras autogeneradas e independizadas mediante rutinas de Inteligencia Artificial para evitar contenido duplicado.
- **Interfaz Premium (UI/UX)**: Diseño inmersivo que utiliza Glassmorphism, animaciones fluidas, paletas de colores vibrantes y navegación responsiva.
- **Flujo de Comercio Electrónico**: Implementación transversal desde el catálogo hasta el carrito de compras (`/cart`), manteniendo la sesión del usuario intacta (incluso entre reinicios) mediante persistencia local y tokens JWT simulados.

## Requisitos de Entorno

### Backend
- Python 3.9+
- `pip install -r requirements.txt` (directorio backend)
- Las dependencias críticas incluyen `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `trimesh`, `numpy`, y `google-generativeai`.

### Frontend
- Node.js 18+
- `npm install` (directorio frontend)
- Las dependencias críticas incluyen `next`, `react`, `three`, `@react-three/fiber`, `@react-three/drei` y `tailwindcss`.

## Flujo de Ejecución

1. **Pre-procesamiento (Backend)**: El catálogo base debe ser cargado y procesado. El script interno parsea los atributos de cada prenda, invoca al modelo de lenguaje para derivar parámetros matemáticos, y finalmente delega a `trimesh` la exportación de las mallas 3D resultantes al almacenamiento estático.
2. **Registro de Consumidor**: El usuario ingresa a la plataforma, genera credenciales de acceso y es redirigido a la configuración inicial de su Gemelo Digital (Digital Twin).
3. **Simulación de Prueba (Try-On)**: Al seleccionar una prenda, el sistema computa los parámetros físicos del usuario y renderiza la malla final superponiendo la prenda correspondiente.
4. **Checkout**: El producto puede ser agregado al carrito, donde se preserva la integridad de los datos (metadatos, precio, SKUs) para la eventual simulación de facturación y pedido.

## Decisiones de Diseño (Trade-offs)

- **Renderizado 3D en Cliente vs. Servidor**: Se optó por derivar el esfuerzo computacional del renderizado final (iluminación, composición, cámara) a la GPU del dispositivo cliente (mediante WebGL/Three.js) para maximizar la escalabilidad del sistema, en lugar de utilizar granjas de renderizado en el servidor.
- **Motor Paramétrico Nativo vs. SaaS**: La integración planificada con Ready Player Me fue descartada tras el cese de sus servicios públicos. Como alternativa robusta, se diseñó un motor paramétrico propio en React Three Fiber, garantizando independencia tecnológica, reducción de latencia (sin iframes) y continuidad académica del proyecto.

---
*Desarrollado para el ciclo lectivo vigente. Universidad - Cátedra de Programación II.*
