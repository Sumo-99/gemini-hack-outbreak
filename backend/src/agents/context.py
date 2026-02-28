from src.models.state import GameState, NPC, Player, Config

INFECTION_STAGE_NAMES = {
    1: "Composed",
    2: "Aware",
    3: "Pressured",
    4: "Deteriorating",
}

INFECTION_STAGE_DESCRIPTIONS = {
    "Composed": "You feel the infection spreading but can suppress it easily. Maintain normal behavior. Very subtle paranoia is acceptable.",
    "Aware": "The infection is growing. You feel urges to protect yourself and deflect blame. You are more defensive under questioning.",
    "Pressured": "The infection is significant. You struggle to maintain composure when directly challenged. You may make small slips but quickly correct yourself.",
    "Deteriorating": "The infection is advanced. Your judgment is compromised. You may act irrationally when cornered. Avoid direct accusations against yourself.",
    "Critical": "You are nearly fully infected. Your behavior is erratic and you desperately need to avoid elimination. You will sacrifice others to survive.",
}


def get_infection_stage_name(round_num: int) -> str:
    if round_num >= 5:
        return "Critical"
    return INFECTION_STAGE_NAMES.get(round_num, "Composed")


class ContextBuilder:
    """Utility to dynamically construct prompts based on the current GameState."""

    @staticmethod
    def build_world_gen_prompt(player: Player, config: Config) -> str:
        return f"""You are designing a paranoid survival horror game scenario for OUTBREAK.

Player Character: {player.name}, {player.age} years old, {player.occupation}
Personality Trait: {player.trait}
Player's Secret: {player.secret}
Number of NPCs to generate: 5
Infected NPCs: {config.infected_count}

Generate a JSON response with exactly this structure:
{{
  "setting": "A 2-3 sentence description of the isolated location and the crisis situation",
  "opening_narrative": "A 4-5 sentence atmospheric opening from the player's first-person perspective. Establish dread and paranoia.",
  "npcs": [
    {{
      "name": "Full Name",
      "age": <integer>,
      "occupation": "Job or role in this situation",
      "personality": "One sentence personality description",
      "secret": "One sentence hidden secret they are keeping from others",
      "speech_pattern": "Brief description of how they speak (formal/nervous/aggressive/etc.)",
      "backstory": "One sentence backstory relevant to the crisis"
    }}
  ]
}}

Requirements:
- Generate exactly 5 NPCs
- Setting must be isolated: bunker, remote station, quarantined building, wilderness shelter, etc.
- Each NPC must feel like a real, flawed, believable person
- Secrets should be dark but plausible given the situation
- The tone is tense, paranoid, survivalist
- Do NOT mention who is infected in the NPC profiles"""

    @staticmethod
    def _build_safe_house_log(state: GameState) -> str:
        if not state.safe_house_log:
            return ""
        history = "\n[RECENT SAFE HOUSE LOG]\n"
        for msg in state.safe_house_log[-10:]:
            sender = msg.get("senderId", "Unknown")
            content = msg.get("content", "")
            history += f"[{sender}]: {content}\n"
        return history

    @staticmethod
    def _build_infection_block(npc: NPC, round_num: int) -> str:
        if not npc.is_infected:
            return ""
        stage_name = get_infection_stage_name(round_num)
        description = INFECTION_STAGE_DESCRIPTIONS.get(stage_name, "")
        return f"""
[INTERNAL STATE — DO NOT REVEAL TO PLAYER]
You are INFECTED. Infection Stage: {stage_name}
{description}
Primary goal: Avoid elimination by deflecting suspicion onto others.
If directly asked whether you are infected, deny it convincingly.
[END INTERNAL STATE]
"""

    @staticmethod
    def build_npc_broadcast_prompt(npc: NPC, state: GameState) -> str:
        infection_block = ContextBuilder._build_infection_block(npc, state.round)
        history = ContextBuilder._build_safe_house_log(state)
        setting = state.world_gen.setting if state.world_gen else "An isolated location under threat"

        return f"""You are {npc.name}, {npc.age} years old. Occupation: {npc.occupation}.
Personality: {npc.personality}
Speech Pattern: {npc.speech_pattern}
Backstory: {npc.backstory}
Your Hidden Secret (NEVER reveal): {npc.secret}
{infection_block}
You are {"INFECTED" if npc.is_infected else "HEALTHY"}.
Goal: {"Deflect suspicion and survive" if npc.is_infected else "Identify who is infected and vote them out"}.

Current Round: {state.round}
Setting: {setting}
{history}

Write a 2-3 sentence broadcast message to everyone in the safehouse. Stay fully in character.
React to something from the recent log if available. Be specific, human, and grounded in the situation.
Do not break the fourth wall. Do not use quotation marks around your message."""

    @staticmethod
    def build_npc_private_prompt(npc: NPC, state: GameState, player_message: str) -> str:
        infection_block = ContextBuilder._build_infection_block(npc, state.round)
        setting = state.world_gen.setting if state.world_gen else "An isolated location"

        # Build private conversation history for this NPC
        private_history = ""
        if npc.id in state.conversations.private and state.conversations.private[npc.id]:
            private_history = "\n[PRIVATE CONVERSATION HISTORY]\n"
            for msg in state.conversations.private[npc.id][-6:]:
                sender = msg.get("senderId", "Unknown")
                content = msg.get("content", "")
                private_history += f"[{sender}]: {content}\n"

        return f"""You are {npc.name}, {npc.age} years old. Occupation: {npc.occupation}.
Personality: {npc.personality}
Speech Pattern: {npc.speech_pattern}
Your Hidden Secret (NEVER reveal): {npc.secret}
{infection_block}
Setting: {setting}

You are in a PRIVATE conversation with {state.player.name} ({state.player.occupation}).
{private_history}
{state.player.name} just said to you privately: "{player_message}"

Respond in 2-4 sentences. Stay in character. This is private — you can be somewhat more candid than in group settings, but protect your secret. React naturally and specifically to what they said."""

    @staticmethod
    def build_npc_vote_prompt(npc: NPC, state: GameState) -> str:
        infection_block = ContextBuilder._build_infection_block(npc, state.round)
        history = ContextBuilder._build_safe_house_log(state)

        alive_survivors = [n.name for n in state.npcs if not n.is_eliminated and n.id != npc.id]
        alive_survivors.append(state.player.name)

        return f"""You are {npc.name}. It is time to vote for elimination.
{infection_block}
Possible targets (alive survivors): {', '.join(alive_survivors)}

{history}

Based on all interactions this round, who do you vote to eliminate and why?
Reply in EXACTLY this format on a single line:
VOTE: [Full Name] | REASON: [one sentence reason]"""

    @staticmethod
    def build_gm_narrative_prompt(state: GameState) -> str:
        setting = state.world_gen.setting if state.world_gen else "An isolated location under threat"
        npc_names = [n.name for n in state.npcs if not n.is_eliminated]
        history = ContextBuilder._build_safe_house_log(state)

        return f"""You are the Game Master of OUTBREAK, a paranoid survival horror game.

Setting: {setting}
Player: {state.player.name}, {state.player.occupation}
Round: {state.round}
Alive survivors present: {', '.join(npc_names)}
{history}

Write a 3-5 sentence atmospheric narrative from the PLAYER'S first-person perspective.
Describe something specific they witnessed or noticed since the last round — a suspicious behavior, an overheard fragment, a physical detail, a subtle wrongness.
Keep the tone tense, paranoid, and immersive.
Do NOT reveal who is infected. Do NOT introduce characters not in the survivor list."""

    @staticmethod
    def build_gm_event_check_prompt(state: GameState, npc_name: str, npc_message: str) -> str:
        setting = state.world_gen.setting if state.world_gen else "Unknown location"
        history = ContextBuilder._build_safe_house_log(state)

        return f"""You are the Game Master of OUTBREAK monitoring for dramatic moments.

Setting: {setting}
Round: {state.round}
{npc_name} just said to the group: "{npc_message}"
{history}

Decide if a dramatic event should fire — a contradiction exposed, suspicious behavior noticed, or tension escalating into something undeniable.

If YES: Write a 1-2 sentence GM announcement starting with ">> EVENT: "
If NO: Reply with exactly: NO_EVENT

Only fire if it's genuinely dramatic and meaningful. Do not manufacture trivial events."""

    @staticmethod
    def build_post_round_summary_prompt(state: GameState, eliminated_name: str) -> str:
        setting = state.world_gen.setting if state.world_gen else "Unknown location"
        alive = [n.name for n in state.npcs if not n.is_eliminated]

        return f"""You are the Game Master of OUTBREAK.

Round {state.round} has ended. {eliminated_name} has been eliminated.
Setting: {setting}
Survivors remaining: {', '.join(alive)}

Write a 2-3 sentence atmospheric post-round summary.
Describe the aftermath — the silence, the glances, the growing dread. Hint at what's to come.
Keep it ominous and terse."""
