from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from src.api.websockets import ws_router
from src.models.state import GameState
from src.store.game_store import store
import uuid
import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="OUTBREAK Game Engine API")

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

@app.post("/api/game/create")
async def create_game():
    """Creates a new game session and stores it in memory."""
    game_id = str(uuid.uuid4())[:8]
    state = GameState(game_id=game_id)
    store.create_game(game_id, state)
    return {"game_id": game_id}

@app.post("/api/game/{game_id}/start")
async def start_game(game_id: str, background_tasks: BackgroundTasks):
    """Kicks off the phase engine for an existing game session."""
    from src.engine.phase_manager import PhaseEngine
    if not store.get_game(game_id):
        raise HTTPException(status_code=404, detail="Game not found")
    engine = PhaseEngine(game_id, mock_mode=True)
    background_tasks.add_task(engine.execute_phase)
    return {"status": "started", "game_id": game_id}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
