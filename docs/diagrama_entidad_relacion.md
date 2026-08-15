# Diagrama de Entidad-Relación (ERD)

A continuación se detalla el esquema de la base de datos de TryOnHub, enfocado en los roles, autenticación de usuarios, organización de marcas y el catálogo de prendas generativas.

```mermaid
erDiagram
    ROLE {
        int id PK
        string name
        string description
    }
    
    MARKETPLACE {
        int id PK
        string name
        string domain
    }
    
    BRAND {
        int id PK
        string name
        string description
        int marketplace_id FK
    }

    USER {
        int id PK
        string email
        string hashed_password
        string full_name
        boolean is_active
        int role_id FK
        int brand_id FK
        int marketplace_id FK
        datetime created_at
        datetime updated_at
    }

    GARMENT {
        int id PK
        int brand_id FK
        string sku
        string name
        string fit
        string size
        string color
        float price
        boolean is_processed
    }

    GARMENT_ASSET {
        int id PK
        int garment_id FK
        string ai_generated_image_url
        string metadata_json
    }

    CART_ITEM {
        int id PK
        int user_id FK
        int garment_id FK
        int quantity
        string size
        string color
    }

    USER }|--|| ROLE : "pertenece a"
    USER }o--o| BRAND : "administra (si es marca)"
    USER }o--o| MARKETPLACE : "administra (si es dueño)"
    BRAND }|--|| MARKETPLACE : "publica en"
    
    BRAND ||--o{ GARMENT : "posee catálogo"
    GARMENT ||--|| GARMENT_ASSET : "tiene IA generada"
    
    USER ||--o{ CART_ITEM : "agrega a su carrito"
    GARMENT ||--o{ CART_ITEM : "es contenido en"
```

## Relaciones Principales
- Un **User** puede ser Cliente, Marca o Administrador (basado en `role_id`).
- Si un usuario tiene el rol de Marca, estará atado obligatoriamente a un `brand_id`.
- Cuando una Marca crea un **Garment** (Prenda), el flujo transaccional asegura que se comunique con la IA (Gemini Vision).
- Si la IA procesa todo exitosamente, se anexa un **GarmentAsset** que contiene la URL subida y la `metadata_json` (con parámetros físicos y de color del 3D).
- Todos los clientes pueden añadir prendas al **CartItem**.
