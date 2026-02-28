import asyncio
from src.models.state import GameState, Phase
from src.store.game_store import store
from src.agents.npc import NPCAgent
from src.agents.gm import GameMasterAgent
from src.agents.client import GeminiClient
from src.api.websockets import manager, EventType

class PhaseEngine:
    """Manages progression and logic execution of the game phase state machine."""
    def __init__(self, game_id: str, mock_mode: bool = True):
        self.game_id = game_id
        self.client = GeminiClient(mock_mode=mock_mode)
        self.gm = GameMasterAgent(client=self.client)

    async def advance_phase(self) -> None:
        """Transitions to the next logical phase in a thread-safe manner."""
        state = store.get_game(self.game_id)
        if not state:
            return
            
        async with store.get_lock(self.game_id):
            if state.phase == Phase.SETUP:
                state.phase = Phase.INVESTIGATION
            elif state.phase == Phase.INVESTIGATION:
                state.phase = Phase.BROADCAST
            elif state.phase == Phase.BROADCAST:
                state.phase = Phase.VOTING
            elif state.phase == Phase.VOTING:
                state.phase = Phase.ELIMINATION
            elif state.phase == Phase.ELIMINATION:
                state.phase = Phase.SUMMARY
            elif state.phase == Phase.SUMMARY:
                state.round += 1
                state.phase = Phase.SETUP
                
            await manager.broadcast(self.game_id, EventType.PHASE_CHANGE, {"phase": state.phase.value})

    async def execute_phase(self) -> None:
        """Runs the active logic for the current phase."""
        state = store.get_game(self.game_id)
        if not state:
            return

        if state.phase == Phase.SETUP:
            narrative = await self.gm.generate_player_narrative(state)
            await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": narrative})
            await self.advance_phase()
            
        elif state.phase == Phase.INVESTIGATION:
            await asyncio.sleep(0.1) # Simulate time
            await self.advance_phase()
            
        elif state.phase == Phase.BROADCAST:
            for npc_data in state.npcs:
                # To prevent state mutation issues, we only pass in data
                npc = NPCAgent(npc_data, client=self.client)
                msg = await npc.generate_broadcast_message(state)
                await manager.broadcast(self.game_id, EventType.NEW_MESSAGE, {"sender": npc_data.name, "text": msg})
                
                # Intertwine Game Master verification periodically
                event = await self.gm.check_for_events(state)
                if event != "NO_EVENT":
                    await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": event})
                    
            await self.advance_phase()
            
        elif state.phase == Phase.VOTING:
            for npc_data in state.npcs:
                npc = NPCAgent(npc_data, client=self.client)
                vote = await npc.generate_vote(state)
                await manager.broadcast(self.game_id, EventType.VOTE, {"sender": npc_data.name, "vote": vote})
            await self.advance_phase()
            
        elif state.phase == Phase.ELIMINATION:
            await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": "System Elimination Verified."})
            await self.advance_phase()
            
        elif state.phase == Phase.SUMMARY:
            summary = await self.gm.generate_post_round_summary(state, "Unknown")
            await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": summary})
            await self.advance_phase()
