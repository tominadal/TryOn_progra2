from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GarmentCreate(BaseModel):
    name: str
    price: float
    fit: str = "Regular"
    color: str = "Blue"
    color_hex: str = "#1e3a8a"
    colors: Optional[List[Dict[str, str]]] = None
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
    # Medidas de moldería base en centímetros (cm — Referencia Talle M / 32 US / 42 AR)
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None
    thigh_cm: Optional[float] = None
    inseam_cm: Optional[float] = None
    hem_width_cm: Optional[float] = None
    rise_cm: Optional[float] = None


class GarmentUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    fit: Optional[str] = None
    color: Optional[str] = None
    color_hex: Optional[str] = None
    colors: Optional[List[Dict[str, str]]] = None
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
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None
    thigh_cm: Optional[float] = None
    inseam_cm: Optional[float] = None
    hem_width_cm: Optional[float] = None
    rise_cm: Optional[float] = None
    regenerate_3d: bool = False


def get_default_garment_cm(fit: str = "Regular", waist_rise_label: str = "Tiro Medio") -> Dict[str, float]:
    """Retorna las medidas estándar de moldería en centímetros (cm) para el talle base M (32 US / 42 AR)."""
    f = (fit or "Regular").lower()
    r = (waist_rise_label or "Tiro Medio").lower()
    rise_cm = 29.0 if "alto" in r else (22.0 if "bajo" in r else 25.5)

    if "skinny" in f:
        return {"waist_cm": 80.0, "hip_cm": 96.0, "thigh_cm": 53.0, "inseam_cm": 77.0, "hem_width_cm": 15.0, "rise_cm": rise_cm}
    if "slim" in f:
        return {"waist_cm": 81.0, "hip_cm": 98.0, "thigh_cm": 56.0, "inseam_cm": 78.0, "hem_width_cm": 17.0, "rise_cm": rise_cm}
    if "mom" in f:
        return {"waist_cm": 78.0, "hip_cm": 103.0, "thigh_cm": 60.0, "inseam_cm": 74.0, "hem_width_cm": 17.5, "rise_cm": max(rise_cm, 28.5)}
    if "wide" in f or "baggy" in f:
        return {"waist_cm": 83.0, "hip_cm": 106.0, "thigh_cm": 66.0, "inseam_cm": 80.0, "hem_width_cm": 27.0, "rise_cm": max(rise_cm, 27.0)}
    if "relaxed" in f:
        return {"waist_cm": 84.0, "hip_cm": 104.0, "thigh_cm": 63.0, "inseam_cm": 79.0, "hem_width_cm": 22.5, "rise_cm": rise_cm}
    if "flare" in f:
        return {"waist_cm": 80.0, "hip_cm": 99.0, "thigh_cm": 55.0, "inseam_cm": 81.0, "hem_width_cm": 26.0, "rise_cm": max(rise_cm, 27.0)}
    if "bermuda" in f or "short" in f:
        return {"waist_cm": 82.0, "hip_cm": 102.0, "thigh_cm": 61.0, "inseam_cm": 24.0, "hem_width_cm": 25.0, "rise_cm": rise_cm}
    if "skirt" in f or "pollera" in f:
        return {"waist_cm": 78.0, "hip_cm": 101.0, "thigh_cm": 64.0, "inseam_cm": 44.0, "hem_width_cm": 52.0, "rise_cm": max(rise_cm, 27.0)}
    return {"waist_cm": 82.0, "hip_cm": 100.0, "thigh_cm": 58.0, "inseam_cm": 78.0, "hem_width_cm": 20.0, "rise_cm": rise_cm}


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
    waist_cm: Optional[float] = None,
    hip_cm: Optional[float] = None,
    thigh_cm: Optional[float] = None,
    inseam_cm: Optional[float] = None,
    hem_width_cm: Optional[float] = None,
    rise_cm: Optional[float] = None,
    existing_meta: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calcula de forma determinística el descriptor paramétrico 3D para WebGL
    a partir de las propiedades físicas, de corte y medidas en centímetros (cm).
    """
    base = dict(existing_meta or {})
    rise_lower = (waist_rise_label or "Tiro Medio").lower()
    waist_rise_val = (
        0.85 if "alto" in rise_lower else (0.2 if "bajo" in rise_lower else 0.5)
    )
    fit_lower = (fit or "Regular").lower()
    fit_presets = {
        "skinny":   (0.90, 1.00, 0.40),
        "slim":     (0.94, 1.00, 0.25),
        "regular":  (1.00, 1.00, 0.00),
        "straight": (1.00, 1.00, 0.00),
        "mom":      (1.10, 0.98, 0.10),
        "wide":     (1.20, 1.03, -0.35),
        "relaxed":  (1.15, 1.00, -0.15),
        "flared":   (1.05, 1.05, -0.40),
        "bermuda":  (1.05, 0.88, 0.05),
        "skirt":    (1.08, 0.85, -0.20),
    }
    scale_x, scale_y, taper = next(
        (vals for key, vals in fit_presets.items() if key in fit_lower),
        (1.0, 1.0, 0.0),
    )

    defaults_cm = get_default_garment_cm(fit, waist_rise_label)
    final_waist_cm = float(waist_cm if waist_cm is not None else defaults_cm["waist_cm"])
    final_hip_cm = float(hip_cm if hip_cm is not None else defaults_cm["hip_cm"])
    final_thigh_cm = float(thigh_cm if thigh_cm is not None else defaults_cm["thigh_cm"])
    final_inseam_cm = float(inseam_cm if inseam_cm is not None else defaults_cm["inseam_cm"])
    final_hem_cm = float(hem_width_cm if hem_width_cm is not None else defaults_cm["hem_width_cm"])
    final_rise_cm = float(rise_cm if rise_cm is not None else defaults_cm["rise_cm"])

    # Si se especifican medidas personalizadas en cm distintas a la base del fit, refinar scale_x, scale_y y taper
    if hip_cm is not None or thigh_cm is not None:
        hip_ratio = final_hip_cm / defaults_cm["hip_cm"]
        thigh_ratio = final_thigh_cm / defaults_cm["thigh_cm"]
        scale_x = round(scale_x * (0.55 * hip_ratio + 0.45 * thigh_ratio), 3)

    if inseam_cm is not None and defaults_cm["inseam_cm"] > 0:
        scale_y = round(scale_y * (final_inseam_cm / defaults_cm["inseam_cm"]), 3)

    if hem_width_cm is not None or thigh_cm is not None:
        default_diff = defaults_cm["thigh_cm"] - defaults_cm["hem_width_cm"] * 2.0
        actual_diff = final_thigh_cm - final_hem_cm * 2.0
        taper = round(max(-0.6, min(0.6, taper + (actual_diff - default_diff) / 40.0)), 3)

    distress_raw = max(0, min(100, int(distress_level or 0)))

    tex_lower = (texture or "Denim Clásico").lower()
    if "cuero" in tex_lower:
        roughness_val, metalness_val = 0.28, 0.35
    elif "gabardina" in tex_lower:
        roughness_val, metalness_val = 0.68, 0.04
    elif "lino" in tex_lower:
        roughness_val, metalness_val = 0.90, 0.02
    elif "corderoy" in tex_lower:
        roughness_val, metalness_val = 0.88, 0.03
    else:
        roughness_val, metalness_val = 0.82, 0.05

    base.update({
        "scale_x": scale_x,
        "scale_y": scale_y,
        "color_hex": color_hex or "#1e3a8a",
        "accent_hex": color_hex or "#1e3a8a",
        "roughness": roughness_val,
        "metalness": metalness_val,
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
        "waist_cm": round(final_waist_cm, 1),
        "hip_cm": round(final_hip_cm, 1),
        "thigh_cm": round(final_thigh_cm, 1),
        "inseam_cm": round(final_inseam_cm, 1),
        "hem_width_cm": round(final_hem_cm, 1),
        "rise_cm": round(final_rise_cm, 1),
        "source": base.get("source") or "manual_parametric",
    })
    return base
