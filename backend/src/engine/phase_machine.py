from src.models.state import GameState, Phase
from src.agents.npc import NPCAgent
from src.agents.client import GeminiClient
from src.api.websockets import EventType
import asyncio

class PhaseMachine:
    """Handles transitions between phases and triggers necessary agent actions."""
    
    @staticmethod
    async def process_voting(state: GameState, player_vote: str, manager, game_id: str):
        """Orchestrates the voting phase, tallying, and transitioning to elimination."""
        # 1. State changes to VOTING if not already
        if state.phase != Phase.VOTING:
            state.phase = Phase.VOTING
            # Let clients know phase changed
            await manager.broadcast(game_id, EventType.PHASE_CHANGE, {"phase": state.phase.value})
        
        votes = {}
        votes[player_vote] = 1
        
        state.safe_house_log.append({
            "type": "gm_event", 
            "content": f">> VOTE REGISTERED [YOU]: Targeted {player_vote.upper()}"
        })
        await manager.broadcast(game_id, EventType.GM_EVENT, {"text": f">> VOTE REGISTERED [YOU]: Targeted {player_vote.upper()}"})

        # 2. Trigger alive NPCs to cast their votes
        alive_npcs = [npc for npc in state.npcs if not npc.is_eliminated]
        real_client = GeminiClient(mock_mode=False)
        
        for npc_data in alive_npcs:
            npc = NPCAgent(npc_data, client=real_client)
            await manager.broadcast(game_id, EventType.GM_EVENT, {"text": f">> AWAITING VOTE: {npc_data.name}..."})
            
            # small delay
            await asyncio.sleep(1.5)
            
            try:
                raw_vote = await npc.generate_vote(state)
                # Parse vote
                # Expected format "VOTE: [Name]"
                target = raw_vote.replace("VOTE:", "").strip().upper()
                
                # Verify target exists, else abstain or default
                valid_names = [n.name.upper() for n in state.npcs] + ["YOU", "PLAYER"]
                if target not in valid_names:
                    target = "ABSTAIN"
                
                if target in votes:
                    votes[target] += 1
                else:
                    votes[target] = 1
                    
                msg = f">> VOTE REGISTERED [{npc_data.name}]: Targeted {target}"
                state.safe_house_log.append({"type": "gm_event", "content": msg})
                await manager.broadcast(game_id, EventType.GM_EVENT, {"text": msg})
                
            except Exception as e:
                print(f"Error getting vote for {npc_data.name}: {e}")
                
        # 3. Tally Votes
        await asyncio.sleep(1.0)
        await manager.broadcast(game_id, EventType.GM_EVENT, {"text": ">> TALLYING VOTES..."})
        
        eliminated_target = None
        highest_votes = 0
        for t, count in votes.items():
            if count > highest_votes and t != "ABSTAIN":
                highest_votes = count
                eliminated_target = t
                
        await asyncio.sleep(1.0)
        if eliminated_target:
            msg = f">> MAJORITY REACHED. TARGET FOR ELIMINATION: {eliminated_target}"
            state.safe_house_log.append({"type": "gm_event", "content": msg})
            await manager.broadcast(game_id, EventType.GM_EVENT, {"text": msg})
            
            # Apply elimination
            for npc in state.npcs:
                if npc.name.upper() == eliminated_target:
                    npc.is_eliminated = True
                    npc.pulse = 0
                    npc.trust = "TERMINATED"
            
            # Post-round Summary
            from src.engine.game_master import GameMasterAgent
            gm = GameMasterAgent()
            summary = await gm.generate_post_round_summary(state, eliminated_target)
            state.safe_house_log.append({"type": "gm_event", "content": summary})
            await manager.broadcast(game_id, EventType.GM_EVENT, {"text": summary})
        else:
            msg = ">> NO MAJORITY REACHED. NO ELIMINATION OCCURRED."
            state.safe_house_log.append({"type": "gm_event", "content": msg})
            await manager.broadcast(game_id, EventType.GM_EVENT, {"text": msg})

        # Send updated game state up to frontend to sync elimination pulse/status
        await manager.broadcast(game_id, EventType.GAME_STATE, state.dict())

        # Move back to Broadcast phase and next round
        await asyncio.sleep(2.0)
        state.round += 1
        
        # Pre-round narrative for the player
        if 'gm' not in locals():
            from src.engine.game_master import GameMasterAgent
            gm = GameMasterAgent()
        
        pre_round = await gm.generate_pre_round_narrative(state)
        # We send this directly to the user
        state.safe_house_log.append({"type": "gm_event", "content": f">> PRIVATE NARRATIVE INJECTION:\n{pre_round}"})
        await manager.broadcast(game_id, EventType.GM_EVENT, {"text": f">> PRIVATE NARRATIVE INJECTION:\n{pre_round}"})

        state.phase = Phase.BROADCAST
        
        await manager.broadcast(game_id, EventType.PHASE_CHANGE, {"phase": state.phase.value})
        await manager.broadcast(game_id, EventType.GM_EVENT, {"text": f">> INITIATING ROUND {state.round}... COMM CHANNELS OPEN."})
        await manager.broadcast(game_id, EventType.GAME_STATE, state.dict())
