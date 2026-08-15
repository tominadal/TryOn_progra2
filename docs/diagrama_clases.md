# Diagrama de Clases UML: Modelos de Dominio

Este diagrama describe las clases principales de TryOnHub y cómo interactúan, siguiendo las convenciones UML recomendadas en clase (usando **atributos** para tipos de datos primitivos y **asociaciones** para relaciones significativas entre clases).

```mermaid
classDiagram
    class User {
        +Integer id
        +String email
        -String hashed_password
        +String full_name
        +Boolean is_active
        +Datetime created_at
        +Datetime updated_at
        +login() Token
        +logout() void
    }

    class Role {
        +Integer id
        +String name
        +String description
    }

    class Avatar {
        +Integer id
        +String skin_color
        +Float height_cm
        +Float weight_kg
        +String gender
        +String body_type
        +Float muscle_definition
        +String hair_color
        +String hair_style
        +Boolean glasses
        +saveAnatomy() void
    }

    class Garment {
        +Integer id
        +String sku
        +String name
        +String fit
        +String size
        +String color
        +Float price
        +Boolean is_processed
        +processWithAI() void
    }

    class GarmentAsset {
        +Integer id
        +String ai_generated_image_url
        +String metadata_json
    }

    class Brand {
        +Integer id
        +String name
        +String description
        +uploadGarment() Garment
    }

    class CartItem {
        +Integer id
        +Integer quantity
        +String size
        +String color
        +calculateSubtotal() Float
    }

    %% Asociaciones
    User "1" --> "1" Role : tiene
    User "1" --> "0..1" Avatar : posee
    User "1" --> "*" CartItem : agrega
    User "1" --> "0..1" Brand : administra (si es marca)
    
    Brand "1" --> "*" Garment : vende
    
    Garment "1" --> "0..1" GarmentAsset : contiene 3D
    Garment "1" --> "*" CartItem : pertenece a
```

### Justificación de Diseño (Patrón UML)
*   **Atributos vs Asociaciones**: Tal como sugiere la buena práctica de UML, los datos primitivos (como `skin_color` o `price`) están modelados como *Atributos* internos de las clases, mientras que las relaciones complejas y de dominio importante (como el vínculo entre un `User` y su `Avatar`, o una `Brand` y sus `Garment`) están modeladas como *Asociaciones* (flechas).
*   **Encapsulamiento**: Campos sensibles como la contraseña (`hashed_password`) se modelan con visibilidad privada (`-`).
