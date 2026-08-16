# Diagrama de Secuencia UML: TryOnHub

Este documento contiene los diagramas de secuencia para los casos de uso más importantes del sistema, de acuerdo a las buenas prácticas de UML.

## 1. Subida de Prendas y Generación 3D (Brand)

Este diagrama ilustra cómo funciona la arquitectura cuando una marca sube un nuevo producto y nuestra Inteligencia Artificial parametriza el diseño 3D.

```mermaid
sequenceDiagram
    actor Brand as 🏢 Brand (User)
    participant NextJS as 💻 Next.js Frontend
    participant FastApi as ⚙️ FastAPI Backend
    participant Gemini as 🧠 Gemini 1.5 Pro Vision
    participant DB as 🗄️ SQLite

    Brand->>NextJS: Sube imagen de la prenda + Datos (Talla, Precio)
    NextJS->>FastApi: POST /api/v1/catalog/upload-image (FormData)
    FastApi-->>NextJS: Retorna { url: "http://localhost:8000/static/uploads/..." }
    
    NextJS->>FastApi: POST /api/v1/catalog/garment (JSON con image_url)
    
    rect rgba(173, 216, 230, 0.15)
        Note over FastApi,DB: Transacción Atómica
        FastApi->>DB: Inicia Transacción
        FastApi->>DB: flush() Garment
        
        FastApi->>Gemini: process_garment(image_url, metadata)
        Note over Gemini: Analiza los píxeles de la foto real
        Gemini-->>FastApi: Retorna JSON (Medidas, Colores exactos, Escala)
        
        alt Si Gemini Falla o Timeout
            FastApi->>DB: rollback()
            FastApi-->>NextJS: 500 Error: No se pudo generar modelo 3D
            NextJS-->>Brand: Muestra Error en UI (Toast)
        else Si Gemini Tiene Éxito
            FastApi->>DB: add() GarmentAsset (metadata_json)
            FastApi->>DB: commit()
            FastApi-->>NextJS: 200 OK: Garment ID & Asset
            NextJS-->>Brand: Éxito (Toast)
        end
    end
```

## 2. Probador Virtual (Try-On) Interactiva (Client)

Este diagrama detalla la interacción principal del sistema: cuando un usuario entra a ver cómo le queda una prenda en su avatar 3D.

```mermaid
sequenceDiagram
    actor Cliente as 👤 Cliente (User)
    participant NextJS as 💻 Next.js Frontend
    participant R3F as 🎨 React Three Fiber
    participant FastApi as ⚙️ FastAPI Backend
    participant DB as 🗄️ SQLite

    Cliente->>NextJS: Accede a /product/{id}
    NextJS->>FastApi: GET /api/v1/catalog/garment/{id}
    FastApi->>DB: query Garment & GarmentAsset
    DB-->>FastApi: Devuelve Metadata 3D (Fit, Escala, Color)
    FastApi-->>NextJS: Retorna JSON de la Prenda
    
    NextJS->>FastApi: GET /api/v1/tryon/avatar
    FastApi->>DB: query Avatar (del current_user)
    DB-->>FastApi: Devuelve JSON de anatomía (Morphs)
    FastApi-->>NextJS: Retorna JSON del Avatar
    
    NextJS->>R3F: Inicializa <Canvas>
    NextJS->>R3F: Pasa props (AvatarMorphs + GarmentMetadata)
    
    rect rgba(144, 238, 144, 0.15)
        Note over R3F: Renderizado Paramétrico en Cliente
        R3F->>R3F: Escala geometría del avatar base (chestWidth, legThickness)
        R3F->>R3F: Calcula radio de prenda apoyado en la piel (offset dinámico)
        R3F->>R3F: Aplica shaders y texturas PBR (Denim, Cotton)
    end
    
    R3F-->>Cliente: Muestra Modelo 3D Interactivo
```
