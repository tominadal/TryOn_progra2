# Diagrama de Secuencia UML: Subida de Prendas y Generación 3D

Este diagrama ilustra cómo funciona la arquitectura de TryOnHub cuando una marca sube un nuevo producto y nuestra Inteligencia Artificial parametriza el diseño 3D.

```mermaid
sequenceDiagram
    actor Brand as 🏢 Brand (User)
    participant NextJS as 💻 Next.js Frontend
    participant FastApi as ⚙️ FastAPI Backend
    participant Gemini as 🧠 Gemini 1.5 Pro Vision
    participant DB as 🗄️ PostgreSQL

    Brand->>NextJS: Sube imagen de la prenda + Datos (Talla, Precio)
    NextJS->>FastApi: POST /api/v1/catalog/upload-image (FormData)
    FastApi-->>NextJS: Retorna { url: "http://localhost:8000/static/uploads/..." }
    
    NextJS->>FastApi: POST /api/v1/catalog/garment (JSON con image_url)
    
    rect rgb(200, 220, 255)
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

### Explicación Técnica
1. **Transacción Atómica**: Todo el proceso de base de datos (`Garment` y `GarmentAsset`) se hace dentro de una única transacción. Si Gemini Vision se cae, todo se deshace (`rollback`), evitando dejar la base de datos con prendas "zombis" que no pueden mostrarse en el probador 3D.
2. **Vision-Driven Parameters**: Gemini Vision extrae directamente los colores predominantes en HEX y las medidas a escala basándose en la foto real que sube el usuario. No usamos texturas estáticas, sino variables React Three Fiber (`material.color.set(hex)`).
