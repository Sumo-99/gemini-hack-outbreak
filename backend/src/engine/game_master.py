from src.models.state import GameState, Phase
from src.agents.client import GeminiClient
import asyncio
from src.api.websockets import manager, EventType

class GameMasterAgent:
    """The central intelligence coordinating the game."""
    def __init__(self, client: GeminiClient = None):
        self.client = client or GeminiClient(mock_mode=False)

    async def generate_pre_round_narrative(self, state: GameState) -> str:
        """Function 1: Generates atmospheric intro for the player."""
        history_text = "\n[CONVERSATION HISTORY]\n"
        for msg in state.conversations.broadcast:
            history_text += f"[{msg.get('senderId', 'System')}]: {msg.get('content')}\n"

        prompt = (
            "You are the Game Master of OUTBREAK.\n"
            f"Current Round: {state.round}\n"
            f"{history_text}\n"
            "Write a short (3-5 sentence) first-person narrative for the PLAYER CHARACTER "
            "describing something specific they witnessed or noticed since the last round. "
            "Be extremely atmospheric, grounded in the facts established, and subtly imply danger."
        )
        
        response = await self.client.generate_response(prompt, fallback=">> You slept fitfully. The tension in the safe house is palpable.")
        return response

    async def generate_world_event(self, state: GameState) -> str:
        """Function 2: Fires periodic dynamic events based on conversation."""
        history_text = "\n[CONVERSATION HISTORY]\n"
        for msg in state.conversations.broadcast:
            history_text += f"[{msg.get('senderId', 'System')}]: {msg.get('content')}\n"

        prompt = (
            "You are the Game Master of OUTBREAK. Read the full conversation history below.\n"
            "Generate a subtle 'World Event' to inject paranoia and tension into the group.\n"
            "This event should be circumstantial and point suspicion at someone (or multiple people) without being overtly obvious.\n"
            "Examples of good events:\n"
            "- DISCOVERY: Someone finds tampered medical supplies, missing tools, or hidden notes.\n"
            "- ENVIRONMENTAL: Power flickers, a lockdown door seals, or an alarm briefly trips in a specific sector.\n"
            "- BEHAVIORAL: A system logs unauthorized terminal access at a strange hour, pointing to someone's occupation.\n"
            "Generate ONE world event now (1-2 sentences). Never directly name the infected agent, but ground it in the characters' established occupations, locations, or secrets so players can deduce who it points to.\n"
            f"{history_text}"
        )
        
        response = await self.client.generate_response(prompt, fallback="SYSTEM ALERT: A brief power fluctuation was detected in the lower levels.")
        return response

    async def generate_post_round_summary(self, state: GameState, eliminated: str) -> str:
        """Function 3: Generates atmospheric summary after elimination."""
        prompt = (
            "You are the Game Master of OUTBREAK. Read the elimination result.\n"
            f"Result: {eliminated} was eliminated by majority vote.\n"
            "Write a 2-3 sentence atmospheric summary of the emotional reaction in the safe house to this elimination. "
            "Do not reveal if they were infected or innocent. Focus on the tension."
        )
        response = await self.client.generate_response(prompt, fallback=f">> The group stands in silence over {eliminated}'s departure.")
        return response
