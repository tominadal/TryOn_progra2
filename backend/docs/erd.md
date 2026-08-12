# TryOnHub — Diagrama de Entidad-Relación (DER)

> Generado automáticamente. Refleja el esquema completo de base de datos del MVP.

```mermaid
erDiagram

    %% ── Organización ──────────────────────────────────────────────────────
    MARKETPLACES {
        int     id          PK
        string  name
        string  domain      UK
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    BRANDS {
        int     id              PK
        string  name
        string  description
        int     marketplace_id  FK
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    %% ── Usuarios & Roles ─────────────────────────────────────────────────
    ROLES {
        int    id           PK
        string name         UK
        string description
    }

    USERS {
        int     id                PK
        string  email             UK
        string  hashed_password
        string  full_name
        boolean is_active
        int     role_id           FK
        int     brand_id          FK "nullable"
        int     marketplace_id    FK "nullable"
        datetime created_at
        datetime updated_at
    }

    %% ── Catálogo ─────────────────────────────────────────────────────────
    GARMENTS {
        int     id               PK
        string  sku              "indexed"
        string  name
        string  description
        int     brand_id         FK
        string  fit
        string  material
        float   price
        json    available_sizes  "e.g. ['28','30','32','34']"
        json    available_colors "e.g. [{name,hex},...]"
        string  size             "legacy default"
        string  color            "legacy default"
        string  image_url
        boolean is_processed
        datetime created_at
        datetime updated_at
    }

    GARMENT_IMAGES {
        int    id           PK
        int    garment_id   FK
        string image_url
        string image_type   "FRONT | SIDE | BACK"
        int    sort_order
    }

    GARMENT_ASSETS {
        int    id                       PK
        int    garment_id               FK UK
        string status                   "COMPLETED | FAILED | PROCESSING"
        string ai_generated_image_url
        string thumbnail_url
        json   metadata_json
    }

    PROCESSING_JOBS {
        int      id              PK
        int      brand_id        FK
        enum     status          "UPLOADED|VALIDATING|PROCESSING|GENERATING_ASSET|READY|FAILED"
        int      total_items
        int      processed_items
        json     error_log
        datetime created_at
        datetime updated_at
    }

    %% ── Avatar (Experiencia) ─────────────────────────────────────────────
    AVATARS {
        int     id                PK
        int     user_id           FK UK
        float   height_cm
        float   weight_kg
        string  body_type         "Delgado|Normal|Atlético|Robusto"
        float   muscle_definition "0.0 – 1.0"
        string  skin_color
        string  hair_color
        string  hair_style        "Calvo|Corto|Largo|Recogido"
        string  beard_style       "Ninguna|Esbozo|Corta|Larga"
        string  beard_color
        string  eyebrow_style     "Fino|Normal|Grueso"
        int     glasses           "0=false 1=true"
        string  hat_style         "Ninguno|Gorra|Sombrero|Headband"
        string  shirt_color
        string  shirt_style       "Basic|V-Neck|Polo"
        string  shoes_color
        boolean tattoo_left_arm
        string  gender            "Hombre|Mujer"
        string  base_photo_url
        string  avatar_3d_url
        datetime created_at
        datetime updated_at
    }

    %% ── E-Commerce ───────────────────────────────────────────────────────
    CARTS {
        int      id         PK
        int      user_id    FK UK
        datetime created_at
        datetime updated_at
    }

    CART_ITEMS {
        int id          PK
        int cart_id     FK
        int garment_id  FK
        int quantity
    }

    ORDERS {
        int      id           PK
        int      user_id      FK
        float    total_amount
        enum     status       "PENDING|COMPLETED|CANCELLED"
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEMS {
        int   id          PK
        int   order_id    FK
        int   garment_id  FK
        float price
        int   quantity
    }

    %% ── Relaciones ───────────────────────────────────────────────────────

    MARKETPLACES    ||--o{ BRANDS          : "tiene"
    MARKETPLACES    ||--o{ USERS           : "pertenece a"

    BRANDS          ||--o{ USERS           : "gestiona"
    BRANDS          ||--o{ GARMENTS        : "publica"
    BRANDS          ||--o{ PROCESSING_JOBS : "genera"

    ROLES           ||--o{ USERS           : "asigna"

    USERS           ||--o| AVATARS         : "posee (1:1)"
    USERS           ||--o| CARTS           : "tiene (1:1)"
    USERS           ||--o{ ORDERS          : "realiza"

    GARMENTS        ||--o| GARMENT_ASSETS  : "procesado como (1:1)"
    GARMENTS        ||--o{ GARMENT_IMAGES  : "tiene (1:N)"
    GARMENTS        ||--o{ CART_ITEMS      : "incluido en"
    GARMENTS        ||--o{ ORDER_ITEMS     : "incluido en"

    CARTS           ||--o{ CART_ITEMS      : "contiene"
    ORDERS          ||--o{ ORDER_ITEMS     : "contiene"
```

## Descripción de Relaciones Clave

| Relación | Cardinalidad | Descripción |
|---|---|---|
| Marketplace → Brand | 1:N | Un mall agrupa múltiples marcas (multi-tenancy B2B) |
| Brand → Garment | 1:N | Una marca publica múltiples prendas |
| Garment → GarmentImage | 1:N | Un jean tiene múltiples fotos (FRONT/SIDE/BACK) |
| Garment → GarmentAsset | 1:1 | Cada prenda tiene UN asset IA generado |
| User → Avatar | 1:1 | Cada usuario tiene UN gemelo digital |
| User → Cart | 1:1 | Cada usuario tiene UN carrito activo |
| Cart → CartItem | 1:N | Un carrito contiene múltiples ítems |
| Order → OrderItem | 1:N | Una orden contiene múltiples líneas |

## Patrones de Diseño Implementados

- **Repository Pattern**: `GarmentRepository`, `GarmentImageRepository`, `AvatarRepository`, `UserRepository`, `OrganizationRepository` — abstraen el acceso a datos
- **Strategy Pattern**: `VirtualTryOnStrategy` (abstract) → `GeminiTryOnStrategy` + `MockTryOnStrategy` — intercambiables sin modificar routers
- **Multi-Tenant**: Toda entidad de catálogo lleva `brand_id` → `marketplace_id` para aislamiento lógico B2B2C
