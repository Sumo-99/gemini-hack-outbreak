from src.models.state import GameState
from src.agents.client import GeminiClient
from src.agents.context import ContextBuilder
import logging

logger = logging.getLogger(__name__)

class GameMasterAgent:
    """Logic wrapper for the Game Master."""
    def __init__(self, client: GeminiClient = None):
        self.client = client or GeminiClient(mock_mode=True)

    async def generate_player_narrative(self, state: GameState) -> str:
        prompt = ContextBuilder.build_gm_narrative_prompt(state)
        response = await self.client.generate_response(prompt, fallback="You hear footsteps in the hall.")
        return response

    async def check_for_events(self, state: GameState) -> str:
        """Monitors for contradiction events to broadcast."""
        # A simple mocked event checking context
        prompt = (
            "You are the Game Master. Read the history and decide if an event should fire.\n"
            "If YES, write the event. If NO, reply with NO_EVENT."
        )
        response = await self.client.generate_response(prompt, fallback="NO_EVENT")
        return response

    async def generate_post_round_summary(self, state: GameState, eliminated: str) -> str:
        prompt = f"Write a 2-3 sentence summary about the end of the round where {eliminated} was eliminated."
        response = await self.client.generate_response(prompt, fallback=f"Round ends. {eliminated} is gone.")
        return response
