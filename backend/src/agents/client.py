import os
import json
import re
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
import asyncio
import logging

logger = logging.getLogger(__name__)

class GeminiClient:
    """Wrapper around google-generativeai to handle rate limits, retries, and fallbacks."""
    def __init__(self, model_name="gemini-2.5-flash", mock_mode=False):
        api_key = os.getenv("GEMINI_API_KEY")
        if not mock_mode and api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.mock_mode = mock_mode

    async def generate_response(self, prompt: str, fallback: str = "...") -> str:
        if self.mock_mode:
            logger.info("MOCK_MODE: Returning fallback response.")
            return fallback

        try:
            def _generate():
                response = self.model.generate_content(prompt)
                return response.text

            response_text = await asyncio.to_thread(_generate)
            return response_text
        except ResourceExhausted:
            logger.warning("Gemini rate limit exceeded. Using fallback.")
            return fallback
        except Exception as e:
            logger.error(f"Gemini generation error: {e}. Using fallback.")
            return fallback

    async def generate_json(self, prompt: str, fallback: dict = None) -> dict:
        """Generate a JSON response, stripping markdown fences if present."""
        if fallback is None:
            fallback = {}

        if self.mock_mode:
            logger.info("MOCK_MODE: Returning fallback JSON.")
            return fallback

        try:
            def _generate():
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json"
                    )
                )
                return response.text

            text = await asyncio.to_thread(_generate)

            # Strip markdown fences if present
            text = text.strip()
            if text.startswith("```"):
                text = re.sub(r'^```[a-z]*\n?', '', text)
                text = re.sub(r'```\s*$', '', text).strip()

            return json.loads(text)
        except json.JSONDecodeError:
            # Try raw parse one more time
            try:
                return json.loads(text)
            except Exception:
                logger.error("Failed to parse JSON response from Gemini")
                return fallback
        except Exception as e:
            logger.error(f"generate_json error: {e}. Using fallback.")
            return fallback

client = GeminiClient()
