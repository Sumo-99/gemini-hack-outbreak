import pytest
import asyncio
from src.models.state import GameState, Phase, Player, NPC
from src.store.game_store import store
from src.engine.phase_manager import PhaseEngine

@pytest.mark.asyncio
async def test_e2e_simulation():
    # Setup initial game state
    game_id = "test_run"
    npc1 = NPC(id="1", name="Bot1", age=20, occupation="Worker", personality="Quiet", secret="None")
    state = GameState(game_id=game_id, npcs=[npc1], round=1)
    store.create_game(game_id, state)
    
    engine = PhaseEngine(game_id, mock_mode=True)
    
    # Simulate a full circle of phases leading to round 2
    assert state.phase == Phase.SETUP
    
    await engine.execute_phase()
    assert state.phase == Phase.INVESTIGATION
    
    await engine.execute_phase()
    assert state.phase == Phase.BROADCAST
    
    await engine.execute_phase()
    assert state.phase == Phase.VOTING
    
    await engine.execute_phase()
    assert state.phase == Phase.ELIMINATION
    
    await engine.execute_phase()
    assert state.phase == Phase.SUMMARY
    
    await engine.execute_phase()
    assert state.phase == Phase.SETUP
    assert state.round == 2

    # Cleanup
    store.delete_game(game_id)
