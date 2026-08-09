# Documento de Ideación y Especificación: TryOnHub

## 1. Descripción General del Proyecto
TryOnHub consiste en una plataforma de arquitectura B2B2C (Business-to-Business-to-Consumer) diseñada para innovar en la experiencia del comercio electrónico de indumentaria mediante la integración de inteligencia artificial. El ecosistema permite a las entidades comerciales (Marcas) gestionar sus catálogos de prendas, al tiempo que habilita a los consumidores finales (Clientes) a configurar avatares digitales para realizar pruebas de ropa en un entorno virtual, apoyándose en la API de Google Gemini para la composición de las imágenes resultantes.

## 2. Especificación de Requerimientos Funcionales

Conforme a las normativas establecidas para el proyecto final de la cátedra de Programación II, el sistema implementa los siguientes cinco requerimientos principales de alto nivel (RQ), expuestos a través de servicios web RESTful soportados por el framework FastAPI:

*   **RQ1 - Gestión y Seguridad de Identidades**: El sistema provee un mecanismo seguro para el registro e inicio de sesión de usuarios, garantizando la emisión y validación de tokens JWT (JSON Web Tokens). Este esquema soporta múltiples roles (Cliente, Administrador de Marca y Administrador de Plataforma) para el control de acceso.
*   **RQ2 - Parametrización del Perfil Digital**: Los usuarios registrados poseen la capacidad de definir las métricas biométricas e imagen representativa de su avatar. El sistema aplica validaciones estrictas sobre el formato, tamaño y naturaleza de los archivos multimedia para prevenir vulnerabilidades.
*   **RQ3 - Procesamiento Masivo de Catálogos (B2B)**: Los administradores representantes de marcas pueden realizar la ingesta de inventario a través del procesamiento de archivos Excel. La operación se delega a tareas asíncronas (BackgroundTasks) para garantizar la disponibilidad del servicio.
*   **RQ4 - Renderización de Prueba Virtual**: Los consumidores pueden simular el uso de una prenda sobre su avatar digital. Esta operación integra la invocación a la infraestructura de inteligencia artificial mediante el Patrón de Diseño Strategy, desacoplando así los servicios REST de los proveedores externos.
*   **RQ5 - Gestión Transaccional de Pedidos**: Los usuarios tienen acceso a un flujo de e-commerce completo, que incluye la administración del carrito de compras y la consolidación de órdenes (Checkout). La arquitectura implementa el modelo de "Snapshot Pricing" para asegurar la integridad de los datos financieros frente a fluctuaciones de precios.

## 3. Especificación de Casos de Uso

1.  **Rol: Administrador de Marca (Brand Admin)**:
    *   Ejecuta el inicio de sesión y obtiene credenciales (JWT).
    *   Invoca el endpoint `POST /api/v1/catalog/upload` adjuntando el documento tabular de inventario.
    *   Verifica el progreso del procesamiento en segundo plano mediante `GET /api/v1/catalog/jobs/{job_id}`.

2.  **Rol: Consumidor Final (Customer)**:
    *   Realiza el registro en la plataforma e inicia sesión.
    *   Configura el perfil fotográfico invocando `POST /api/v1/tryon/avatar`.
    *   Inicia la prueba virtual mediante `POST /api/v1/tryon/preview/{garment_id}`, recibiendo la URL del activo generado.
    *   Añade el artículo al carrito de compras utilizando `POST /api/v1/commerce/cart`.
    *   Consolida la transacción ejecutando `POST /api/v1/commerce/checkout`.

## 4. Arquitectura y Patrones de Diseño

El código base del sistema respeta principios de responsabilidad única e inversión de dependencias mediante la adopción de los siguientes patrones arquitectónicos:

- **Patrón Strategy (Estrategia)**: Implementado en el módulo `ai_strategy.py`. Facilita la inyección de dependencias dinámicas para el proceso de Virtual Try-On, permitiendo permutar entre una implementación de producción (`GeminiTryOnStrategy`) y una de pruebas unitarias (`MockTryOnStrategy`), sin introducir alteraciones en la capa de enrutamiento o servicio.
- **Patrón Repository (Repositorio)**: Instanciado en el módulo `base.py` mediante el uso de clases genéricas (`CRUDBase`). Su función radica en aislar la capa lógica de la aplicación del acceso a datos, garantizando que el framework ORM (SQLAlchemy) no exponga su complejidad en los controladores, favoreciendo así la limpieza y escalabilidad del código.
