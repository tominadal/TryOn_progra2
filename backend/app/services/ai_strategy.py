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
            import google.genai as genai
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self._sdk = "new"
        except ImportError:
            try:
                import google.generativeai as genai_legacy
                genai_legacy.configure(api_key=settings.GEMINI_API_KEY)
                self._legacy_model = genai_legacy.GenerativeModel("gemini-2.0-flash")
                self._sdk = "legacy"
            except ImportError:
                self._sdk = "none"

    def _generate_3d_pants_glb(self, scale_x: float, scale_y: float, color_hex: str, filename: str) -> str:
        """Generates a parametric 3D pants model using Trimesh."""
        import trimesh
        import numpy as np
        
        # Parse hex color to RGBA
        h = color_hex.lstrip('#')
        rgb = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        color = (*rgb, 255)
        
        # Create primitives
        leg1 = trimesh.creation.cylinder(radius=0.2 * scale_x, height=1.0 * scale_y)
        leg1.apply_translation([0.25, -0.5 * scale_y, 0])
        
        leg2 = trimesh.creation.cylinder(radius=0.2 * scale_x, height=1.0 * scale_y)
        leg2.apply_translation([-0.25, -0.5 * scale_y, 0])
        
        waist = trimesh.creation.box(extents=[0.9 * scale_x, 0.4 * scale_y, 0.45])
        waist.apply_translation([0, 0.2 * scale_y, 0])
        
        # Combine into a single mesh
        pants = trimesh.util.concatenate([leg1, leg2, waist])
        pants.visual.face_colors = color
        
        # Ensure uploads dir exists
        import os
        uploads_dir = os.path.join("static", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        filepath = os.path.join(uploads_dir, filename)
        pants.export(filepath)
        return f"{settings.BASE_URL}/static/uploads/{filename}"

    def process_garment(self, garment_data: dict) -> dict:
        prompt = (
            "Act as an expert AI 3D Modeler. You are processing a catalog entry "
            "for a Virtual Try-On system.\n"
            f"Garment Data: {json.dumps(garment_data)}\n\n"
            "Analyse this garment and return ONLY a valid JSON object with these precise mathematical properties for a 3D mesh:\n"
            '{"scale_x": <float between 0.8 (slim) and 1.3 (relaxed) based on fit>,'
            '"scale_y": <float between 0.9 (cropped) and 1.1 (long)>,'
            '"color_hex": "<hex color code representing the jeans, e.g. #000080 for navy>"}'
            "\nDo not include any markdown blocks or backticks, just the raw JSON."
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
                
            # Clean LLM output
            import re
            json_str = re.sub(r'```json|```', '', llm_text).strip()
            params = json.loads(json_str)
            
            scale_x = float(params.get("scale_x", 1.0))
            scale_y = float(params.get("scale_y", 1.0))
            color_hex = params.get("color_hex", "#1c3d72")
            
            # Generate the actual 3D .glb file!
            filename = f"garment_3d_{uuid.uuid4().hex[:8]}.glb"
            asset_url = self._generate_3d_pants_glb(scale_x, scale_y, color_hex, filename)
            
            return {
                "ai_generated_image_url": asset_url, # Now pointing to a .glb
                "thumbnail_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800",
                "metadata_json": {"llm_response": params, "source": "gemini_trimesh_3d"},
            }

        except Exception as e:
            print(f"[WARN] Gemini 3D processing failed for garment: {e}")
            # Fallback to a basic blue mesh
            filename = f"fallback_3d_{uuid.uuid4().hex[:8]}.glb"
            asset_url = self._generate_3d_pants_glb(1.0, 1.0, "#4a70a8", filename)
            return {
                "ai_generated_image_url": asset_url,
                "thumbnail_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800",
                "metadata_json": {"error": str(e), "source": "gemini_fallback_3d"},
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
