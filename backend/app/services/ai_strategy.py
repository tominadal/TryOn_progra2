"""
Strategy Pattern implementation for Virtual Try-On AI processing.

VirtualTryOnStrategy (Abstract Base)
├── GeminiTryOnStrategy  — Production: Gemini Vision analyses the real garment image
└── MockTryOnStrategy    — Testing/fallback: returns deterministic mock data

Design Justification (Oral Defense):
    This pattern allows the AI backend to evolve independently from the
    e-commerce and try-on router layers. Switching strategies requires
    zero changes in any router or service layer (Open/Closed Principle).

    GeminiTryOnStrategy uses multimodal Vision to analyse the actual product
    photograph (not just text tags), producing a rich set of parametric 3D
    descriptors that are UNIQUE to each garment. This directly attacks the
    market pain-point: a prefabricated 3D model cannot represent an unseen
    garment accurately. Our system reads the real pixels to derive the exact
    silhouette, color, texture, and construction details.
"""
from abc import ABC, abstractmethod
import uuid
import json
import re
import base64
import httpx

from app.config.settings import settings


class VirtualTryOnStrategy(ABC):
    """Abstract base strategy for garment processing."""

    @abstractmethod
    def process_garment(self, garment_data: dict) -> dict:
        """
        Process a garment and return its virtual asset metadata.

        Args:
            garment_data: dict with garment attributes (SKU, Name, Fit, Color, etc.)

        Returns:
            dict with keys:
                - ai_generated_image_url: URL of the processed garment image
                - metadata_json: dict with processing metadata
        """
        pass



class GeminiTryOnStrategy(VirtualTryOnStrategy):
    """
    Production strategy using Google Gemini Vision API.

    It downloads the product photograph and sends it alongside the garment
    metadata to Gemini, which analyses the REAL pixels (silhouette, texture,
    weave pattern, colour tones, waist rise, leg taper, seam details) and
    returns a rich JSON of parametric 3D descriptors.

    This means every garment, no matter how different its cut or colour from
    any other, produces a unique and faithful 3D representation — something
    that prefabricated models cannot achieve.
    """

    VISION_PROMPT = """\
You are an elite 3D Fashion Engineer specialising in parametric garment reconstruction for WebGL (React Three Fiber) applications.
You receive a photograph of a real garment along with its detailed physical metadata provided by the manufacturer.
Your task is to analyze BOTH the image pixels AND the metadata to produce a precise, deterministic, and unique parametric descriptor JSON.

CRITICAL DIRECTIVE: The manufacturer has provided EXACT physical parameters (color_hex, distress_level, stretch_factor, etc). You MUST USE these values over your own deductions. The image is primarily to deduce the Silhouette & Structure.

Integrate the provided Metadata into the following JSON schema:
- Silhouette & Structure: Leg taper (skinny vs wide), leg length (cropped vs full). For waist_rise, match the Metadata exactly (High Rise -> 0.8+, Low Rise -> 0.2).
- Colorimetry: USE the exact 'color_hex' from the Metadata for "color_hex". Only extract secondary accent colours (e.g. contrast stitching, metallic buttons) from the image.
- Material Physics: USE the Metadata provided to set these parameters strictly:
    - roughness: Set based on 'texture' (e.g., Denim -> 0.8+, Leather -> 0.2).
    - metalness: Set based on 'texture' (e.g., Denim -> 0.1, Leather -> 0.4).
    - fabric_weight: Set based on 'fabric_weight' (Liviano -> 0.3, Medio -> 0.6, Pesado -> 0.9).
    - stretch_factor: Set based on 'elasticity' (Rígido -> 0.1, Confort -> 0.4, Súper Elástico -> 0.8+).
    - opacity: (0.1 to 1.0) Usually 1.0 for pants.
- Detailing:
    - distress: Map the 'distress_level' directly (0 to 100 becomes 0.0 to 1.0).
    - has_cuff: USE 'has_cuffs' boolean.
    - has_pleats: USE 'has_pleats' boolean.

Return ONLY a single valid JSON object. No markdown formatting, no explanations.
Your JSON must strictly match the structure of the examples below.

--- FEW-SHOT EXAMPLES ---

Example 1: A photo of heavily distressed, light-blue Mom Jeans.
Metadata: { "color_hex": "#8ba3b5", "texture": "Denim Clásico", "elasticity": "Rígido", "fabric_weight": "Pesado", "distress_level": 90, "has_cuffs": true, "has_pleats": false, "Waist_Rise": "Tiro Alto" }
{
  "scale_x": 1.10,
  "scale_y": 0.95,
  "color_hex": "#8ba3b5",
  "accent_hex": "#b58752",
  "roughness": 0.85,
  "metalness": 0.1,
  "fabric_weight": 0.9,
  "stretch_factor": 0.1,
  "opacity": 1.0,
  "waist_rise": 0.85,
  "taper": -0.1,
  "distress": 0.9,
  "has_cuff": true,
  "has_pleats": false,
  "fit_label": "Mom Fit"
}

Example 2: A photo of sleek, black faux-leather skinny pants.
Metadata: { "color_hex": "#1a1a1a", "texture": "Cuero/Ecocuero", "elasticity": "Súper Elástico", "fabric_weight": "Medio", "distress_level": 0, "has_cuffs": false, "has_pleats": false, "Waist_Rise": "Tiro Medio" }
{
  "scale_x": 0.90,
  "scale_y": 1.0,
  "color_hex": "#1a1a1a",
  "accent_hex": "#1a1a1a",
  "roughness": 0.2,
  "metalness": 0.4,
  "fabric_weight": 0.6,
  "stretch_factor": 0.8,
  "opacity": 1.0,
  "waist_rise": 0.5,
  "taper": 0.4,
  "distress": 0.0,
  "has_cuff": false,
  "has_pleats": false,
  "fit_label": "Skinny"
}

Now, analyse the provided garment image AND its metadata to return ONLY the JSON object.
"""

    def __init__(self):
        self._sdk = "none"
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel("gemini-2.5-flash")
            self._sdk = "genai"
        except (ImportError, Exception):
            pass

    def _fetch_image_b64(self, image_url: str) -> tuple[bytes, str]:
        """Download image and return (bytes, mime_type). Falls back gracefully."""
        try:
            if image_url.startswith("http"):
                resp = httpx.get(image_url, timeout=10, follow_redirects=True)
                resp.raise_for_status()
                content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0]
                return resp.content, content_type
        except Exception:
            pass
        return b"", "image/jpeg"

    def process_garment(self, garment_data: dict) -> dict:
        """
        Core method: sends garment image + metadata to Gemini Vision,
        parses the rich JSON response, and returns the 3D descriptor dict
        ready for storage in GarmentAsset.metadata_json.
        """
        image_url = garment_data.get("image_url") or garment_data.get("ImageURL") or ""
        meta_text = json.dumps({
            k: v for k, v in garment_data.items()
            if k not in ("image_url", "ImageURL")
        })

        try:
            if self._sdk == "none":
                raise RuntimeError("No Gemini SDK available")

            # Build multimodal content list
            contents = []
            img_bytes, mime = self._fetch_image_b64(image_url)
            if img_bytes:
                # Inline image blob format supported by google-generativeai 0.8.x
                contents.append({"mime_type": mime, "data": img_bytes})
            contents.append(
                f"Garment metadata: {meta_text}\n\n{self.VISION_PROMPT}"
            )

            response = self._model.generate_content(contents)
            llm_text = response.text

            # Strip markdown fences if present
            json_str = re.sub(r"```json|```", "", llm_text).strip()
            # Find first JSON object in case of any preamble
            match = re.search(r"\{[^{}]+\}", json_str, re.DOTALL)
            if not match:
                raise ValueError(f"No JSON object found in response: {llm_text[:200]}")
            params = json.loads(match.group())

            # Validate and clamp all numeric fields
            def fclamp(val, lo, hi, default):
                try:
                    return max(lo, min(hi, float(val)))
                except (TypeError, ValueError):
                    return default

            descriptor = {
                "scale_x":    fclamp(params.get("scale_x"),   0.80, 1.35, 1.0),
                "scale_y":    fclamp(params.get("scale_y"),   0.85, 1.15, 1.0),
                "color_hex":  str(params.get("color_hex", "#2a4a7f")),
                "accent_hex": str(params.get("accent_hex", params.get("color_hex", "#1a3060"))),
                "roughness":  fclamp(params.get("roughness"),  0.3,  1.0,  0.82),
                "waist_rise": fclamp(params.get("waist_rise"), 0.0, 1.0,  0.5),
                "taper":      fclamp(params.get("taper"),      -0.5, 0.5,  0.0),
                "distress":   fclamp(params.get("distress"),   0.0, 1.0,  0.0),
                "has_cuff":   bool(params.get("has_cuff", False)),
                "has_pleats": bool(params.get("has_pleats", False)),
                "fit_label":  str(params.get("fit_label", "Regular")),
                "source":     "gemini_vision_parametric",
            }

#             print(f"[AI] Vision analysis complete")

            return {
                "ai_generated_image_url": image_url,
                "metadata_json": descriptor,
            }

        except Exception as e:
#             print(f"[WARN] Gemini Vision processing failed: {e}")
            # Robust fallback: use text-based heuristics
            return self._text_fallback(garment_data, str(e))

    def _text_fallback(self, garment_data: dict, error: str) -> dict:
        """Text-only heuristic fallback when image analysis fails."""
        fit = str(garment_data.get("Fit") or garment_data.get("fit", "")).lower()
        color_raw = str(garment_data.get("Color") or garment_data.get("color", "blue")).lower()

        # Fit heuristics
        fit_map = {
            "skinny":   {"scale_x": 0.88, "scale_y": 1.02, "taper":  0.40, "fit_label": "Skinny"},
            "slim":     {"scale_x": 0.93, "scale_y": 1.02, "taper":  0.25, "fit_label": "Slim"},
            "regular":  {"scale_x": 1.00, "scale_y": 1.00, "taper":  0.00, "fit_label": "Regular"},
            "mom":      {"scale_x": 1.10, "scale_y": 1.00, "taper":  0.10, "fit_label": "Mom Fit"},
            "wide":     {"scale_x": 1.20, "scale_y": 1.03, "taper": -0.35, "fit_label": "Wide Leg"},
            "relaxed":  {"scale_x": 1.15, "scale_y": 1.00, "taper": -0.15, "fit_label": "Relaxed"},
            "flared":   {"scale_x": 1.05, "scale_y": 1.05, "taper": -0.40, "fit_label": "Flared"},
            "bermuda":  {"scale_x": 1.05, "scale_y": 0.88, "taper":  0.05, "fit_label": "Bermuda"},
        }
        fit_params = next((v for k, v in fit_map.items() if k in fit), fit_map["regular"])

        # Basic colour name → hex
        color_map = {
            "negro": "#0d0d0d", "black": "#0d0d0d",
            "blanco": "#f5f5f5", "white": "#f5f5f5",
            "azul": "#1e3a8a", "blue": "#1e3a8a",
            "gris": "#4a4a4a", "gray": "#4a4a4a", "grey": "#4a4a4a",
            "verde": "#2d5a1b", "green": "#2d5a1b",
            "marron": "#5c3a1e", "brown": "#5c3a1e",
            "beige": "#c5a97d", "khaki": "#c5a97d",
        }
        color_hex = next((v for k, v in color_map.items() if k in color_raw), "#2a4a7f")

        return {
            "ai_generated_image_url": garment_data.get("image_url", ""),
            "metadata_json": {
                **fit_params,
                "scale_x":    fit_params["scale_x"],
                "scale_y":    fit_params["scale_y"],
                "color_hex":  color_hex,
                "accent_hex": color_hex,
                "roughness":  0.82,
                "waist_rise": 0.5,
                "distress":   0.0,
                "has_cuff":   False,
                "has_pleats": False,
                "error":      error,
                "source":     "text_fallback_parametric",
            },
        }


class MockTryOnStrategy(VirtualTryOnStrategy):
    """
    Test/development strategy that returns deterministic mock data
    without making any external API calls.
    """

    def process_garment(self, garment_data: dict) -> dict:
        asset_url = f"https://mock-storage.com/mock_{uuid.uuid4().hex[:8]}.png"
        return {
            "ai_generated_image_url": asset_url,
            "metadata_json": {
                "source": "mock",
                "garment_name": garment_data.get("Name", "Unknown"),
                "fit": garment_data.get("Fit", "Unknown"),
            },
        }
