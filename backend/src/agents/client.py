import os
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, RetryError
import asyncio
import logging

logger = logging.getLogger(__name__)

class GeminiClient:
    """Wrapper around google-generativeai to handle rate limits, retries, and fallbacks."""
    def __init__(self, model_name="gemini-1.5-pro", mock_mode=False):
        api_key = os.getenv("GEMINI_API_KEY")
        if not mock_mode and api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.mock_mode = mock_mode

    async def generate_response(self, prompt: str, fallback: str = "...") -> str:
        if self.mock_mode:
            logger.info("MOCK_MODE: Generating mock response without API call.")
            return fallback

        try:
            # We run it in a thread so it doesn't block the event loop if the SDK is sync
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

client = GeminiClient()
