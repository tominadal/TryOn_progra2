from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GarmentCreate(BaseModel):
    name: str
    price: float
    fit: str = "Regular"
    color: str = "Blue"
    color_hex: str = "#1e3a8a"
    sizes: List[str] = ["S", "M", "L", "XL"]
    image_url: str = "/products/jean_classic.png"
    generate_3d: bool = True
    material: Optional[str] = None
    waist_rise: Optional[str] = None
    description: Optional[str] = None
    texture: Optional[str] = None
    elasticity: Optional[str] = None
    fabric_weight: Optional[str] = None
    distress_level: Optional[int] = 0
    has_cuffs: Optional[bool] = False
    has_pleats: Optional[bool] = False


class GarmentUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    fit: Optional[str] = None
    color: Optional[str] = None
    color_hex: Optional[str] = None
    sizes: Optional[List[str]] = None
    image_url: Optional[str] = None
    material: Optional[str] = None
    waist_rise: Optional[str] = None
    description: Optional[str] = None
    texture: Optional[str] = None
    elasticity: Optional[str] = None
    fabric_weight: Optional[str] = None
    distress_level: Optional[int] = None
    has_cuffs: Optional[bool] = None
    has_pleats: Optional[bool] = None
    regenerate_3d: bool = False


def build_parametric_metadata(
    *,
    fit: str = "Regular",
    color_hex: str = "#1e3a8a",
    waist_rise_label: str = "Tiro Medio",
    texture: str = "Denim Clásico",
    elasticity: str = "Rígido",
    fabric_weight: str = "Medio",
    distress_level: int = 0,
    has_cuffs: bool = False,
    has_pleats: bool = False,
    existing_meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calcula de forma determinística el descriptor paramétrico 3D para WebGL
    a partir de las propiedades físicas y de corte de la prenda.
    """
    base = dict(existing_meta or {})
    rise_lower = (waist_rise_label or "Tiro Medio").lower()
    waist_rise_val = (
        0.85 if "alto" in rise_lower else (0.2 if "bajo" in rise_lower else 0.5)
    )
    fit_lower = (fit or "Regular").lower()
    fit_presets = {
        "skinny":  (0.90, 1.00, 0.40),
        "slim":    (0.94, 1.00, 0.25),
        "regular": (1.00, 1.00, 0.00),
        "straight": (1.00, 1.00, 0.00),
        "mom":     (1.10, 0.98, 0.10),
        "wide":    (1.20, 1.03, -0.35),
        "relaxed": (1.15, 1.00, -0.15),
        "flared":  (1.05, 1.05, -0.40),
        "bermuda": (1.05, 0.88, 0.05),
        "skirt":   (1.08, 0.85, -0.20),
    }
    scale_x, scale_y, taper = next(
        (vals for key, vals in fit_presets.items() if key in fit_lower),
        (1.0, 1.0, 0.0),
    )
    distress_raw = max(0, min(100, int(distress_level or 0)))

    base.update({
        "scale_x": scale_x,
        "scale_y": scale_y,
        "color_hex": color_hex or "#1e3a8a",
        "accent_hex": color_hex or "#1e3a8a",
        "roughness": 0.82,
        "metalness": 0.05,
        "waist_rise": waist_rise_val,
        "waist_rise_label": waist_rise_label or "Tiro Medio",
        "taper": taper,
        "texture": texture or "Denim Clásico",
        "elasticity": elasticity or "Rígido",
        "fabric_weight": fabric_weight or "Medio",
        "fit_label": fit or "Regular",
        "has_cuff": bool(has_cuffs),
        "has_cuffs": bool(has_cuffs),
        "has_pleats": bool(has_pleats),
        "distress": round(distress_raw / 100.0, 2),
        "distress_level": distress_raw,
        "source": base.get("source") or "manual_parametric",
    })
    return base

