from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.api.websockets import ws_router
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
    """Endpoint to intialize a new game session state."""
    # TODO: Implement game creation logic and state store initialization
    return {"game_id": "temp_game_id_1234"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
