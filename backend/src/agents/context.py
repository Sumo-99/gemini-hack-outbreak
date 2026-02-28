from src.models.state import GameState, NPC, Phase

class ContextBuilder:
    """Utility to dynamically construct prompts based on the current GameState."""

    @staticmethod
    def build_npc_prompt(npc: NPC, state: GameState) -> str:
        """Builds strict prompt for an NPC."""
        
        system_prompt = f"You are {npc.name}, {npc.age} years old. Occupation: {npc.occupation}.\n"
        system_prompt += f"Personality: {npc.personality}\n"
        system_prompt += f"Secret: {npc.secret}\n"
        
        system_prompt += f"\nYou are {'INFECTED' if npc.is_infected else 'HEALTHY'}.\n"
        
        if npc.is_infected:
            system_prompt += f"Your current infection stage is {npc.infection_stage}.\n"
            system_prompt += "Goal: Deflect suspicion and survive.\n"
        else:
            system_prompt += "Goal: Find out who is infected and vote them out.\n"
            
        system_prompt += f"\nPlayer's behavior profile: {state.player.behavior_profile.dict()}\n"

        history_text = "\n[CONVERSATION HISTORY]\n"
        for msg in state.conversations.broadcast:
            history_text += f"[{msg.get('senderId', 'System')}]: {msg.get('content')}\n"
            
        return f"{system_prompt}\n{history_text}\nNow, generating response based on current phase: {state.phase.value}."

    @staticmethod
    def build_gm_narrative_prompt(state: GameState) -> str:
        """Builds prompt for the GM to generate pre-round narratives."""
        history_text = "\n[CONVERSATION HISTORY]\n"
        for msg in state.conversations.broadcast:
            history_text += f"[{msg.get('senderId', 'System')}]: {msg.get('content')}\n"

        prompt = (
            "You are the Game Master of OUTBREAK.\n"
            f"Current Round: {state.round}\n"
            f"{history_text}\n"
            "Write a short (3-5 sentence) first-person narrative for the PLAYER CHARACTER "
            "describing something specific they witnessed or noticed since the last round."
        )
        return prompt
