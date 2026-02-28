from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.api.websockets import ws_router
import os
import uvicorn
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from src.store.game_store import store
from src.models.state import GameState, NPC, Player

# Load environment variables explicitly from the parent directory
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize demo game on startup for fast frontend iteration
    from src.models.state import Phase
    state = GameState(game_id="demo_game_001", phase=Phase.BROADCAST)
    state.npcs = [
        NPC(id="SUB-0217", name="MARCUS", age=34, occupation="Engineer", personality="Pragmatic", secret="Stole supplies"),
        NPC(id="SUB-0438", name="LENA", age=28, occupation="Medic", personality="Anxious", secret="Lied about credentials"),
        NPC(id="SUB-0651", name="ORIN", age=45, occupation="Security", personality="Aggressive", secret="Infected", is_infected=True),
        NPC(id="SUB-0892", name="VERA", age=31, occupation="Biologist", personality="Analytical", secret="Knows the virus origin")
    ]
    store.create_game("demo_game_001", state)
    yield

app = FastAPI(title="OUTBREAK Game Engine API", lifespan=lifespan)

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the WebSocket router
app.include_router(ws_router)

@app.get("/")
async def root():
    return {"status": "ok", "message": "OUTBREAK Game Engine is running."}

@app.get("/api/game/{game_id}")
async def get_game(game_id: str):
    """Fetch the current state of a game."""
    state = store.get_game(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")
    return state

from src.models.state import Phase
from src.api.websockets import manager

@app.post("/api/game/{game_id}/advance_phase")
async def advance_phase(game_id: str, target_phase: str):
    """Admin endpoint to forcefully advance the phase for testing."""
    state = store.get_game(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")
        
    try:
        new_phase = Phase(target_phase.lower())
        state.phase = new_phase
        await manager.broadcast(game_id, "phase_change", {"phase": new_phase.value})
        await manager.broadcast(game_id, "game_state", state.dict())
        return {"status": "success", "phase": new_phase.value}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid phase")

from src.store.game_store import store
from src.models.state import GameState, NPC, Player
import uuid

@app.post("/api/game/create")
async def create_game():
    """Endpoint to intialize a new game session state."""
    game_id = f"game_{uuid.uuid4().hex[:8]}"
    from src.models.state import Phase
    state = GameState(game_id=game_id, phase=Phase.BROADCAST)
    
    # Add mockup NPCs
    state.npcs = [
        NPC(id="SUB-0217", name="MARCUS", age=34, occupation="Engineer", personality="Pragmatic", secret="Stole supplies"),
        NPC(id="SUB-0438", name="LENA", age=28, occupation="Medic", personality="Anxious", secret="Lied about credentials"),
        NPC(id="SUB-0651", name="ORIN", age=45, occupation="Security", personality="Aggressive", secret="Infected", is_infected=True),
        NPC(id="SUB-0892", name="VERA", age=31, occupation="Biologist", personality="Analytical", secret="Knows the virus origin")
    ]
    
    store.create_game(game_id, state)
    return {"game_id": game_id}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
