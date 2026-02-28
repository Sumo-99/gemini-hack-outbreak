import asyncio
from typing import Dict, Optional
from src.models.game_state import GameState

class GameSession:
    """
    Wraps a GameState with an asyncio.Lock to ensure thread-safe 
    mutations during concurrent websocket broadcasts and AI generations.
    """
    def __init__(self, state: GameState):
        self.state = state
        self.lock = asyncio.Lock()

class GameStore:
    """
    Singleton in-memory store for all active OUTBREAK game sessions.
    """
    def __init__(self):
        self._games: Dict[str, GameSession] = {}

    def create_game(self, state: GameState) -> GameSession:
        if state.gameId in self._games:
            raise ValueError(f"Game with ID {state.gameId} already exists.")
        session = GameSession(state)
        self._games[state.gameId] = session
        return session

    def get_game(self, game_id: str) -> Optional[GameSession]:
        return self._games.get(game_id)

    def delete_game(self, game_id: str):
        if game_id in self._games:
            del self._games[game_id]

# Global singleton instance
store = GameStore()
