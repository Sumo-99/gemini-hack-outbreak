from src.models.state import GameState, NPC
from src.agents.client import GeminiClient
from src.agents.context import ContextBuilder


class NPCAgent:
    """Represents a single NPC agent logic wrapper."""

    def __init__(self, npc_state: NPC, client: GeminiClient = None):
        self.npc = npc_state
        self.client = client or GeminiClient(mock_mode=True)

    async def generate_broadcast_message(self, state: GameState) -> str:
        """Generates a message for the broadcast chat phase."""
        prompt = ContextBuilder.build_npc_broadcast_prompt(self.npc, state)
        response = await self.client.generate_response(
            prompt,
            fallback=f"{self.npc.name} says nothing, staring at the floor."
        )
        return response

    async def generate_private_response(self, player_message: str, state: GameState) -> str:
        """Generates a private response to a direct player message."""
        prompt = ContextBuilder.build_npc_private_prompt(self.npc, state, player_message)
        response = await self.client.generate_response(
            prompt,
            fallback=f"{self.npc.name} looks at you for a long moment, then looks away without answering."
        )
        return response

    async def generate_vote(self, state: GameState) -> tuple[str, str]:
        """Generates a vote. Returns (target_name, reason)."""
        prompt = ContextBuilder.build_npc_vote_prompt(self.npc, state)
        response = await self.client.generate_response(
            prompt,
            fallback=f"VOTE: {state.player.name} | REASON: Insufficient information to determine otherwise"
        )
        return self._parse_vote(response, state)

    def _parse_vote(self, response: str, state: GameState) -> tuple[str, str]:
        """Parse 'VOTE: Name | REASON: text' format."""
        target = "abstain"
        reason = "No clear reason"

        if "VOTE:" not in response:
            return target, reason

        try:
            after_vote = response.split("VOTE:", 1)[1].strip()
            if "|" in after_vote and "REASON:" in after_vote:
                vote_part, reason_part = after_vote.split("|", 1)
                target = vote_part.strip()
                reason = reason_part.replace("REASON:", "").strip()
            else:
                target = after_vote.split("|")[0].strip()
        except Exception:
            pass

        return target, reason
