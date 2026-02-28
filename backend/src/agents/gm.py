import logging
from src.models.state import GameState, Player, Config
from src.agents.client import GeminiClient
from src.agents.context import ContextBuilder

logger = logging.getLogger(__name__)

_WORLD_FALLBACK = {
    "setting": "An abandoned research facility deep in the mountains. Power is failing. Three days since the outbreak began and the exits are sealed.",
    "opening_narrative": "The emergency lights cast everything in red. You can hear breathing that isn't yours. The temperature dropped overnight and no one will explain why. Three days since the quarantine began. You don't know who to trust anymore.",
    "npcs": [
        {
            "name": "Dr. Elena Marsh",
            "age": 42,
            "occupation": "Virologist",
            "personality": "Methodical, controlled, guarded under pressure",
            "secret": "She knew about the infection vector three days before anyone else",
            "speech_pattern": "Clinical and precise, minimal emotional expression",
            "backstory": "Lead researcher on the project that may have caused the outbreak"
        },
        {
            "name": "Marcus Webb",
            "age": 35,
            "occupation": "Security Chief",
            "personality": "Aggressive, territorial, quick to distrust",
            "secret": "He's been rationing the food supply unfairly in his favor",
            "speech_pattern": "Short clipped sentences, commanding tone",
            "backstory": "Ex-military with a history of violent incidents under pressure"
        },
        {
            "name": "Yuna Park",
            "age": 28,
            "occupation": "Systems Engineer",
            "personality": "Nervous, analytical, talks too fast when anxious",
            "secret": "She disabled the communications array on purpose",
            "speech_pattern": "Rapid speech, technical jargon, trails off mid-sentence",
            "backstory": "Was supposed to have left the facility the day before lockdown"
        },
        {
            "name": "Father Tomas",
            "age": 61,
            "occupation": "Chaplain",
            "personality": "Unnervingly calm, speaks in measured certainties",
            "secret": "He has already decided he won't leave this place alive",
            "speech_pattern": "Slow, deliberate, occasionally religious references",
            "backstory": "Volunteered to stay with the staff when evacuation was offered"
        },
        {
            "name": "Ria Santos",
            "age": 24,
            "occupation": "Lab Technician",
            "personality": "Desperate, impulsive, oscillates between panic and false calm",
            "secret": "She believes she has already been exposed and is hiding symptoms",
            "speech_pattern": "Emotional, unpredictable tone shifts, over-explains",
            "backstory": "Youngest person in the facility, never trained for crisis situations"
        }
    ]
}


class GameMasterAgent:
    """Logic wrapper for the Game Master."""

    def __init__(self, client: GeminiClient = None):
        self.client = client or GeminiClient(mock_mode=True)

    async def generate_world(self, player: Player, config: Config) -> dict:
        """Generate world setting, opening narrative, and NPC profiles."""
        prompt = ContextBuilder.build_world_gen_prompt(player, config)
        result = await self.client.generate_json(prompt, fallback=_WORLD_FALLBACK)
        return result

    async def generate_player_narrative(self, state: GameState) -> str:
        """Generate per-round atmospheric narrative from the player's perspective."""
        prompt = ContextBuilder.build_gm_narrative_prompt(state)
        response = await self.client.generate_response(
            prompt,
            fallback="The tension in the room is palpable. You watch every face carefully, looking for the telltale signs — a glance held too long, a pause before answering. Someone here is not what they seem."
        )
        return response

    async def check_for_events(self, state: GameState, npc_name: str, npc_message: str) -> str:
        """Check if a dramatic GM event should fire after an NPC speaks."""
        prompt = ContextBuilder.build_gm_event_check_prompt(state, npc_name, npc_message)
        response = await self.client.generate_response(prompt, fallback="NO_EVENT")
        return response

    async def generate_post_round_summary(self, state: GameState, eliminated_name: str) -> str:
        """Generate post-round atmospheric summary."""
        prompt = ContextBuilder.build_post_round_summary_prompt(state, eliminated_name)
        response = await self.client.generate_response(
            prompt,
            fallback=f"Round {state.round} ends. {eliminated_name} is gone. The survivors exchange looks but say nothing. The silence is worse than the screaming was."
        )
        return response
