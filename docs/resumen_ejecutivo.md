# 🚀 Resumen de Proyecto: TryOnHub

Este es un resumen ejecutivo de la arquitectura y la lógica de negocio de **TryOnHub**, ideal para que se lo presentes a los compañeros que se unirán a colaborar contigo.

---

## 💡 La Idea de Negocio (El Problema y la Solución)
TryOnHub es una plataforma de **comercio electrónico B2B2C (Business-to-Business-to-Consumer)** centrada en la **Prueba Virtual 3D** (Virtual Try-On). 
* **El Problema:** La gente duda al comprar ropa online porque no saben cómo les quedará. Las marcas tienen altos costos por devoluciones.
* **La Solución:** 
  * Las **Marcas (B2B)** suben fotos 2D de su catálogo.
  * Los **Consumidores (B2C)** crean un "gemelo digital" paramétrico (su propio avatar en 3D con sus medidas corporales).
  * La plataforma permite "probarse" la ropa de las fotos en el avatar 3D antes de concretar la compra.

## ✨ ¿Qué lo hace especial / Qué tiene de bueno?
1. **Inteligencia Artificial Generativa:** Usa **Google Gemini 1.5 Pro Vision**. Cuando una marca sube una foto plana, la IA la analiza y extrae la volumetría, el calce, metadatos y colores.
2. **Motor 3D Paramétrico Propio:** En el navegador, la aplicación usa esa información de la IA para deformar y adaptar mallas (modelos 3D) a los cuerpos de los usuarios en tiempo real, sin depender de costosos servicios de renderizado en la nube.
3. **Consistencia de Datos:** Arquitectura robusta que garantiza transacciones atómicas (una prenda no aparece en el catálogo si la IA falló en procesar su modelo 3D).

---

## 🧠 ¿Por qué se tomaron estas decisiones técnicas?

> [!NOTE]
> Estas justificaciones son excelentes para discutir en defensa de proyectos o code reviews.

1.  **FastAPI (Backend):** Se eligió porque es extremadamente rápido y su soporte **asíncrono** (async/await) es vital. Como llamar a la IA de Gemini puede tardar unos segundos, FastAPI permite que el servidor no se bloquee y siga atendiendo a otros usuarios mientras espera la respuesta.
2.  **Motor Nativo 3D vs APIs de terceros:** En lugar de contratar una API cerrada para probarse ropa, el equipo decidió crear su propio motor en el cliente (`@react-three/fiber`). Esto abarata costos, evita depender de servidores externos que se caen (Single Point of Failure), y el renderizado lo hace la placa de video del propio usuario en el navegador (WebGL).
3.  **Separación de Responsabilidades Frontend/Backend:** El backend *no sabe nada de gráficos 3D*, solo expide un `metadata_json` en texto. Es el frontend el que interpreta ese JSON y lo "compila" visualmente. Esto hace que el backend sea muy ligero y escalable.
4.  **Modelo de Datos (UML Clásico):** Como se observa en el diagrama de clases, se siguieron las buenas prácticas encapsulando información sensible (como la contraseña hash) y usando asociaciones directas para vincular entidades fuertes (ej: `User` tiene un `Avatar`, `Brand` tiene `Garment`).

---

## 🏗️ Patrones de Diseño y Principios SOLID

El proyecto implementa los cuatro patrones y principios del material de clase de forma articulada:

| Patrón / Principio | Archivo clave | Beneficio concreto |
|---|---|---|
| **Strategy** | `ai_strategy.py` | Cambiar de Gemini a OpenAI = editar 1 archivo |
| **Decorator** | `strategy_decorators.py` | Logging y caché sin modificar `GeminiTryOnStrategy` |
| **Observer** | `job_observers.py` | `NotificationJobObserver` agregado sin tocar `ProcessingJob` |
| **Factory** | `strategy_factory.py` | La construcción de la cadena de decoradores está centralizada |
| **SRP** | `validators.py` | Validación de imágenes y Excel separada del router |
| **OCP** | Observer + Decorator | Comportamiento extendido sin modificar clases cerradas |
| **LSP** | `StrategyDecorator` | Cualquier decorador es sustituible por `VirtualTryOnStrategy` |
| **DIP** | `catalog.py` + `dependencies.py` | Routers dependen de abstracciones, no de Gemini directo |

> Para el mapeo detallado de SOLID al código, ver [`docs/patrones_solid.md`](patrones_solid.md).

---

## 📂 ¿Qué hay en cada carpeta? (Estructura)

*   `📁 backend/` **(El Motor Inteligente y API):**
    Desarrollado en **Python con FastAPI**. Aquí vive la lógica de negocio pesada, el manejo de la base de datos relacional (SQLite con SQLAlchemy/Alembic) y, lo más importante, el **pipeline que se conecta a la IA de Gemini** para analizar las imágenes que suben las marcas y devolver un JSON con parámetros 3D.
*   `📁 frontend/` **(La Interfaz y Motor 3D Web):**
    Desarrollado en **React y Next.js 14**. Usa TailwindCSS para una estética moderna (glassmorphism). Aquí se implementa todo el motor gráfico en el navegador utilizando **React Three Fiber (WebGL)**. Contiene el componente vital `AvatarCreatorNative`, que es el vestidor virtual del cliente.
*   `📁 docs/` **(Documentación Académica):**
    Contiene la documentación formal de UML y arquitectura.
    - [`diagrama_clases.md`](diagrama_clases.md) — Dominio + Strategy + Decorator + Observer + **Factory**
    - [`diagrama_secuencia.md`](diagrama_secuencia.md) — Flujos de Upload, Try-On, Observer, Decorator, **Factory**
    - [`diagrama_entidad_relacion.md`](diagrama_entidad_relacion.md) — Esquema de base de datos
    - [`requerimientos_casos_uso.md`](requerimientos_casos_uso.md) — Casos de uso formales
    - [`patrones_solid.md`](patrones_solid.md) ⬅️ **(nuevo)** — Mapeo SOLID al código
*   `📄 seed.py` **(Script de Datos Iniciales):**
    Pobla la base de datos con usuarios, marcas y prendas de ejemplo para demo y testing.

