from src.models.state import GameState, NPC
from src.agents.client import GeminiClient
from src.agents.context import ContextBuilder

class NPCAgent:
    """Represents a single NPC agent logic wrapper."""
    def __init__(self, npc_state: NPC, client: GeminiClient = None):
        self.npc = npc_state
        # For testing, we might want to dependency invert the client
        self.client = client or GeminiClient(mock_mode=True)

    async def generate_broadcast_message(self, state: GameState) -> str:
        """Generates a message for the broadcast chat phase."""
        prompt = ContextBuilder.build_npc_prompt(self.npc, state)
        prompt += "\n\nWrite your next response addressing the group in 2-3 sentences based on the context above."
        
        response = await self.client.generate_response(prompt, fallback=f"[{self.npc.name} is quiet]")
        return response

    async def generate_vote(self, state: GameState) -> str:
        """Generates a vote for the voting phase."""
        prompt = ContextBuilder.build_npc_prompt(self.npc, state)
        prompt += "\n\nIt is time to vote. Who do you suspect the most? Reply in the exact format: VOTE: [Name]"
        
        response = await self.client.generate_response(prompt, fallback=f"VOTE: abstain")
        return response
