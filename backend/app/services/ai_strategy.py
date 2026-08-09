"""
Strategy Pattern implementation for Virtual Try-On AI processing.

VirtualTryOnStrategy (Abstract Base)
├── GeminiTryOnStrategy  — Production: calls Google Gemini API
└── MockTryOnStrategy    — Testing/fallback: returns deterministic mock data

Design Justification (Oral Defense):
    This pattern allows the AI backend to evolve independently from the
    e-commerce and try-on router layers. Switching from Gemini 2D to a
    proprietary 3D model requires zero changes in any router or service.
"""
from abc import ABC, abstractmethod
import uuid
import json

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
    Production strategy using Google Gemini API to analyse garment attributes
    and generate a standardized virtual asset description.
    """

    def __init__(self):
        try:
            # Try the new google-genai SDK first
            import google.genai as genai
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self._sdk = "new"
        except ImportError:
            try:
                # Fallback to deprecated google-generativeai (still installed)
                import google.generativeai as genai_legacy
                genai_legacy.configure(api_key=settings.GEMINI_API_KEY)
                self._legacy_model = genai_legacy.GenerativeModel("gemini-2.0-flash")
                self._sdk = "legacy"
            except ImportError:
                self._sdk = "none"

    def process_garment(self, garment_data: dict) -> dict:
        prompt = (
            "Act as an expert AI fashion stylist. You are processing a catalog entry "
            "for a Virtual Try-On system.\n"
            f"Garment Data: {json.dumps(garment_data)}\n\n"
            "Analyse this garment and return a brief JSON with: "
            "{fit_description, style_tags, recommended_body_types, virtual_rendering_notes}."
        )

        try:
            if self._sdk == "new":
                import google.genai as genai
                response = self._client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                llm_text = response.text
            elif self._sdk == "legacy":
                response = self._legacy_model.generate_content(prompt)
                llm_text = response.text
            else:
                raise RuntimeError("No Gemini SDK available")

            asset_url = f"https://mock-storage.com/asset_{uuid.uuid4().hex[:8]}.png"
            return {
                "ai_generated_image_url": asset_url,
                "metadata_json": {"llm_response": llm_text, "source": "gemini"},
            }

        except Exception as e:
            # Graceful degradation: log and return mock asset
            print(f"[WARN] Gemini processing failed for garment: {e}")
            asset_url = f"https://mock-storage.com/fallback_{uuid.uuid4().hex[:8]}.png"
            return {
                "ai_generated_image_url": asset_url,
                "metadata_json": {"error": str(e), "source": "gemini_fallback"},
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
