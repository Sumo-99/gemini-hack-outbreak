import asyncio
from typing import Dict, Optional
from src.models.state import GameState

class GameStore:
    """In-memory store for game states with async locking to prevent race conditions."""
    def __init__(self):
        self._states: Dict[str, GameState] = {}
        self._locks: Dict[str, asyncio.Lock] = {}

    def create_game(self, game_id: str, state: GameState) -> None:
        self._states[game_id] = state
        self._locks[game_id] = asyncio.Lock()

    def get_game(self, game_id: str) -> Optional[GameState]:
        return self._states.get(game_id)

    def get_lock(self, game_id: str) -> Optional[asyncio.Lock]:
        return self._locks.get(game_id)

    def delete_game(self, game_id: str) -> None:
        if game_id in self._states:
            del self._states[game_id]
        if game_id in self._locks:
            del self._locks[game_id]

# Global singleton instance
store = GameStore()
