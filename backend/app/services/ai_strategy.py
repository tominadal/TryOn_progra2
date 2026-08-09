from abc import ABC, abstractmethod
import google.generativeai as genai
from app.config.settings import settings
import json
import uuid

class VirtualTryOnStrategy(ABC):
    @abstractmethod
    def process_garment(self, garment_data: dict) -> dict:
        """
        Process a garment and return asset metadata (e.g., ai_generated_image_url)
        """
        pass

class GeminiTryOnStrategy(VirtualTryOnStrategy):
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def process_garment(self, garment_data: dict) -> dict:
        prompt = f"""
        Act as an expert AI fashion stylist. You are processing a catalog entry for a Virtual Try-On system.
        Garment Data: {json.dumps(garment_data)}
        
        Generate a synthetic response describing how this garment would fit on a standard 3D avatar.
        Since you cannot generate an actual image file via text-generation endpoint directly to my file system, 
        return a JSON-like structure in your text with your fashion analysis.
        """
        
        try:
            response = self.model.generate_content(prompt)
            asset_url = f"https://mock-storage.com/asset_{uuid.uuid4().hex[:8]}.png"
            return {
                "ai_generated_image_url": asset_url,
                "metadata_json": {"llm_response": response.text, "source": "gemini"}
            }
        except Exception as e:
            print(f"Gemini error: {e}")
            asset_url = f"https://mock-storage.com/asset_{uuid.uuid4().hex[:8]}.png"
            return {
                "ai_generated_image_url": asset_url,
                "metadata_json": {"error": str(e), "source": "gemini_fallback"}
            }

class MockTryOnStrategy(VirtualTryOnStrategy):
    def process_garment(self, garment_data: dict) -> dict:
        asset_url = f"https://mock-storage.com/mock_{uuid.uuid4().hex[:8]}.png"
        return {
            "ai_generated_image_url": asset_url,
            "metadata_json": {"source": "mock"}
        }
