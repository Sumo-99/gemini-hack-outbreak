import pytest
import asyncio
from src.models.state import GameState, Phase, Config
from src.store.game_store import GameStore

def test_game_state_defaults():
    state = GameState(game_id="test_1")
    assert state.game_id == "test_1"
    assert state.round == 1
    assert state.phase == Phase.SETUP
    assert state.config.infected_count == 1
    assert state.player.name == ""

@pytest.mark.asyncio
async def test_game_store_concurrency():
    store = GameStore()
    state = GameState(game_id="test_concurrent")
    store.create_game("test_concurrent", state)

    lock = store.get_lock("test_concurrent")
    game = store.get_game("test_concurrent")

    assert lock is not None
    assert game is not None

    async def worker(worker_id: int):
        async with lock:
            # Simulate read-modify-write which without a lock would cause race conditions
            current_round = game.round
            await asyncio.sleep(0.01) # Yield to event loop to force race condition if unstructured
            game.round = current_round + 1

    # Run 100 workers concurrently
    await asyncio.gather(*(worker(i) for i in range(100)))

    # Since we used the lock, it should be precisely 1 + 100 = 101
    assert game.round == 101

    store.delete_game("test_concurrent")
    assert store.get_game("test_concurrent") is None
