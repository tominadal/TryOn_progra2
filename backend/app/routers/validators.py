"""
Validadores de dominio para el modulo de catalogo.

Separar estas funciones de catalog.py aplica el principio de
Single Responsibility: catalog.py orquesta el flujo HTTP, mientras
que este modulo es responsable exclusivamente de la logica de
validacion de entradas de usuario.

Principios SOLID que ilustra:
    - SRP (Single Responsibility Principle):
        Cada modulo tiene UNA razon para cambiar. Si el formato de imagen
        soportado cambia, solo se edita validators.py, no catalog.py.
    - OCP (Open/Closed Principle):
        Para soportar SVG u otros formatos, se extiende _IMAGE_SIGNATURES
        sin modificar las funciones de validacion existentes.
"""
import io
import pandas as pd

# ─── Constantes de validacion de imagen ──────────────────────────────────────

# Firmas de bytes magicos conocidas (magic bytes) para validar imagenes
# en el servidor, independientemente del Content-Type declarado por el cliente.
# Esto derrota ataques de tipo "falsified Content-Type header".
_IMAGE_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
    (b"RIFF", "webp"),   # verificacion extra: bytes[8:12] == b"WEBP"
]

# Columnas minimas requeridas en el Excel de catalogo
REQUIRED_CATALOG_COLUMNS: frozenset[str] = frozenset({"SKU", "Name", "Fit", "Size", "Color", "Price"})


# ─── Funciones de validacion ──────────────────────────────────────────────────

def is_valid_image(content: bytes) -> bool:
    """
    Verifica si el contenido binario corresponde a una imagen valida
    comparando sus primeros bytes contra firmas conocidas (magic bytes).

    La validacion por magic bytes es mas segura que confiar en la extension
    del archivo o el Content-Type HTTP, que pueden ser falsificados por el cliente.

    Args:
        content: contenido binario del archivo a verificar.

    Returns:
        True si los bytes coinciden con una firma de imagen conocida.
        False en caso contrario.
    """
    for sig, _ in _IMAGE_SIGNATURES:
        if content[: len(sig)] == sig:
            # Verificacion adicional para WEBP: RIFF????WEBP
            if sig == b"RIFF":
                return len(content) >= 12 and content[8:12] == b"WEBP"
            return True
    return False


def validate_excel_columns(df: pd.DataFrame) -> None:
    """
    Valida que el DataFrame contenga todas las columnas requeridas del catalogo.

    Lanza ValueError con detalle de las columnas faltantes para que
    el router pueda transformarla en una respuesta HTTP 400 informativa.

    Args:
        df: DataFrame leido del archivo Excel subido por la marca.

    Raises:
        ValueError: si faltan columnas requeridas. El mensaje incluye los nombres
                    de las columnas ausentes en orden alfabetico.
    """
    missing = REQUIRED_CATALOG_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")


def parse_price(raw_price) -> float:
    """
    Convierte un valor de precio a float con validacion de rango.

    Acepta strings, enteros y floats. Valores negativos o no numericos
    son tratados como 0.0 para no bloquear la ingesta de catalogos
    con celdas de precio vacias o mal formateadas.

    Args:
        raw_price: valor crudo de la celda de precio del Excel.

    Returns:
        float >= 0.0 representando el precio. Retorna 0.0 si el valor
        no es convertible o es negativo.
    """
    try:
        price = float(raw_price)
        return price if price >= 0 else 0.0
    except (TypeError, ValueError):
        return 0.0
