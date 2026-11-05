# Diagrama de Entidad-Relación (ERD) — TryOnHub

A continuación se detalla el esquema relacional completo de la base de datos de **TryOnHub**, sincronizado al 100% con los modelos de SQLAlchemy (`app/domain/models/`).

```mermaid
erDiagram
    ROLES {
        int id PK
        string name UK
        string description
        datetime created_at
        datetime updated_at
    }

    MARKETPLACES {
        int id PK
        string name
        string domain UK
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    BRANDS {
        int id PK
        string name
        string description
        int marketplace_id FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        boolean is_active
        int role_id FK
        int brand_id FK
        int marketplace_id FK
        datetime created_at
        datetime updated_at
    }

    AVATARS {
        int id PK
        int user_id FK
        string name
        string base_photo_url
        string avatar_3d_url
        float height_cm
        float weight_kg
        json body_type
        float muscle_definition
        string skin_color
        string hair_color
        string hair_style
        string beard_style
        string beard_color
        string eyebrow_style
        boolean glasses
        string hat_style
        string shirt_color
        string shirt_style
        string shoes_color
        boolean tattoo_left_arm
        string gender
        datetime created_at
        datetime updated_at
    }

    GARMENTS {
        int id PK
        int brand_id FK
        string sku
        string name
        string description
        string fit
        string material
        string size
        string color
        float price
        boolean is_processed
        json available_sizes
        json available_colors
        datetime created_at
        datetime updated_at
    }

    GARMENT_ASSETS {
        int id PK
        int garment_id FK "UNIQUE"
        string ai_generated_image_url
        string thumbnail_url
        string status
        json metadata_json
        datetime created_at
        datetime updated_at
    }

    GARMENT_IMAGES {
        int id PK
        int garment_id FK
        string image_url
        string image_type
        int sort_order
        datetime created_at
        datetime updated_at
    }

    PROCESSING_JOBS {
        int id PK
        int brand_id FK
        string status
        int total_items
        int processed_items
        json error_log
        datetime created_at
        datetime updated_at
    }

    CARTS {
        int id PK
        int user_id FK "UNIQUE"
        datetime created_at
        datetime updated_at
    }

    CART_ITEMS {
        int id PK
        int cart_id FK
        int garment_id FK
        int quantity
        string size
        string color
        datetime created_at
        datetime updated_at
    }

    ORDERS {
        int id PK
        int user_id FK
        float total_amount
        string status
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int garment_id FK "NULLABLE (SET NULL)"
        float price
        int quantity
        string size
        string color
        datetime created_at
        datetime updated_at
    }

    ROLES ||--o{ USERS : "asigna rol"
    MARKETPLACES ||--o{ BRANDS : "aloja"
    MARKETPLACES ||--o{ USERS : "administrado por"
    BRANDS ||--o{ USERS : "administrada por"
    USERS ||--o{ AVATARS : "posee (1:N, máx 10)"
    BRANDS ||--o{ GARMENTS : "publica"
    BRANDS ||--o{ PROCESSING_JOBS : "ejecuta lotes"
    GARMENTS ||--o| GARMENT_ASSETS : "tiene gemelo 3D"
    GARMENTS ||--o{ GARMENT_IMAGES : "tiene galería"
    USERS ||--o| CARTS : "tiene carrito activo"
    CARTS ||--o{ CART_ITEMS : "contiene líneas"
    GARMENTS ||--o{ CART_ITEMS : "referenciada en"
    USERS ||--o{ ORDERS : "realiza compras"
    ORDERS ||--o{ ORDER_ITEMS : "contiene ítems"
    GARMENTS o|--o{ ORDER_ITEMS : "snapshot histórico"
```

---

## Decisiones Clave de Diseño Relacional
1. **Relación `1:N` entre `USERS` y `AVATARS`:** Un usuario puede gestionar hasta 10 avatares distintos (con migración automática transparente en `app/domain/schema_upgrades.py`).
2. **Separación `GARMENTS` / `GARMENT_ASSETS` / `GARMENT_IMAGES`:** Desacopla los datos comerciales del producto respecto del descriptor paramétrico 3D (`metadata_json`) y la galería de vistas (`FRONT`, `SIDE`, `BACK`), con borrado en cascada (`cascade="all, delete-orphan"`).
3. **Variantes en `CART_ITEMS` y `ORDER_ITEMS` (`size` y `color`):** Cada línea del carrito y de la orden almacena el talle y el color elegidos.
4. **Integridad Histórica en Eliminación de Prendas:** Al eliminar una prenda (`DELETE /api/v1/catalog/garments/{id}`), se eliminan los `CART_ITEMS` activos que la referencian, mientras que los `ORDER_ITEMS` históricos preservan su registro contable (`price`, `quantity`, `size`, `color`) poniendo `garment_id = NULL` (`ondelete="SET NULL"`).
