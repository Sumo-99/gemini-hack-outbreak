import random
import uuid
import os
import logging

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.api.websockets import ws_router
from src.models.state import Config, GameState, NPC, Player, WorldGenState
from src.store.game_store import store
from src.agents.gm import GameMasterAgent
from src.agents.client import GeminiClient

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OUTBREAK Game Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)


class PlayerSetupRequest(BaseModel):
    name: str
    age: int
    occupation: str
    trait: str
    secret: str
    infected_count: int = 1
    difficulty: str = "normal"
    round_limit: int = 5


@app.get("/")
async def root():
    return {"status": "ok", "message": "OUTBREAK Game Engine is running."}


@app.post("/api/game/create")
async def create_game(request: PlayerSetupRequest):
    """Creates a new game session: runs world generation, builds NPC roster, returns setup data."""
    game_id = str(uuid.uuid4())[:8]

    player = Player(
        name=request.name,
        age=request.age,
        occupation=request.occupation,
        trait=request.trait,
        secret=request.secret,
    )

    config = Config(
        infected_count=request.infected_count,
        difficulty=request.difficulty,
        round_limit=request.round_limit,
    )

    # World generation — synchronous in the HTTP request (~5s with real Gemini)
    gemini = GeminiClient()
    gm = GameMasterAgent(client=gemini)
    world_data = await gm.generate_world(player, config)

    # Build NPC objects from generated profiles
    raw_npcs = world_data.get("npcs", [])
    infected_count = min(request.infected_count, len(raw_npcs))
    infected_indices = set(
        random.sample(range(len(raw_npcs)), infected_count)
    ) if raw_npcs else set()

    npcs = []
    for i, npc_data in enumerate(raw_npcs):
        npc = NPC(
            id=f"npc_{i}",
            name=npc_data.get("name", f"Survivor {i}"),
            age=int(npc_data.get("age", 30)),
            occupation=npc_data.get("occupation", "Unknown"),
            personality=npc_data.get("personality", ""),
            secret=npc_data.get("secret", ""),
            speech_pattern=npc_data.get("speech_pattern", ""),
            backstory=npc_data.get("backstory", ""),
            is_infected=(i in infected_indices),
        )
        npcs.append(npc)

    world_gen = WorldGenState(
        setting=world_data.get("setting", ""),
        opening_narrative=world_data.get("opening_narrative", ""),
    )

    state = GameState(
        game_id=game_id,
        player=player,
        npcs=npcs,
        config=config,
        world_gen=world_gen,
    )

    store.create_game(game_id, state)
    logger.info(f"Game {game_id} created. Infected indices: {infected_indices}")

    return {
        "game_id": game_id,
        "opening_narrative": world_gen.opening_narrative,
        "setting": world_gen.setting,
        "npcs": [
            {"id": n.id, "name": n.name, "occupation": n.occupation, "age": n.age}
            for n in npcs
        ],
    }


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
