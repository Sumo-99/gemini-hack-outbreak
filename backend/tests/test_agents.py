import pytest
from src.models.state import GameState, NPC, Player
from src.agents.client import GeminiClient
from src.agents.npc import NPCAgent
from src.agents.gm import GameMasterAgent
from src.agents.context import ContextBuilder

@pytest.fixture
def mock_game_state():
    npc1 = NPC(id="n1", name="Marcus", age=30, occupation="Doctor", personality="Calm", secret="Stole meds")
    return GameState(
        game_id="test_ai",
        player=Player(name="Player"),
        npcs=[npc1],
        round=1
    )

@pytest.mark.asyncio
async def test_gemini_client_mock_mode():
    client = GeminiClient(mock_mode=True)
    response = await client.generate_response("Say hi", fallback="Hello fallback")
    assert response == "Hello fallback"

def test_context_builder(mock_game_state):
    npc = mock_game_state.npcs[0]
    prompt = ContextBuilder.build_npc_prompt(npc, mock_game_state)
    assert "You are Marcus" in prompt
    assert "Stole meds" in prompt

@pytest.mark.asyncio
async def test_npc_agent(mock_game_state):
    client = GeminiClient(mock_mode=True)
    npc_agent = NPCAgent(mock_game_state.npcs[0], client=client)
    
    # In mock mode, it uses fallback
    msg = await npc_agent.generate_broadcast_message(mock_game_state)
    assert msg == "[Marcus is quiet]"
    
    vote = await npc_agent.generate_vote(mock_game_state)
    assert "VOTE: abstain" in vote

@pytest.mark.asyncio
async def test_gm_agent(mock_game_state):
    client = GeminiClient(mock_mode=True)
    gm_agent = GameMasterAgent(client=client)
    
    narrative = await gm_agent.generate_player_narrative(mock_game_state)
    assert narrative == "You hear footsteps in the hall."
    
    event = await gm_agent.check_for_events(mock_game_state)
    assert event == "NO_EVENT"
