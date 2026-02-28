import asyncio
import json
from enum import Enum
from typing import Dict, List, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

ws_router = APIRouter()


class EventType(str, Enum):
    NEW_MESSAGE = "new_message"
    GM_EVENT = "gm_event"
    PHASE_CHANGE = "phase_change"
    NPC_TYPING = "npc_typing"
    PLAYER_MESSAGE = "player_message"
    VOTE = "vote"
    NPC_PRIVATE_RESPONSE = "npc_private_response"
    ELIMINATION_REVEAL = "elimination_reveal"
    GAME_OVER = "game_over"


class ConnectionManager:
    """Manages active WebSockets and handles real-time broadcasts per game session."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, game_id: str, websocket: WebSocket):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)

    def disconnect(self, game_id: str, websocket: WebSocket):
        if game_id in self.active_connections:
            if websocket in self.active_connections[game_id]:
                self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

    async def broadcast(self, game_id: str, event_type: EventType, data: Any):
        if game_id in self.active_connections:
            payload = json.dumps({"type": event_type.value, "data": data})
            for connection in list(self.active_connections.get(game_id, [])):
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass


manager = ConnectionManager()

# Track active PhaseEngine instances per game
active_engines: Dict[str, Any] = {}


@ws_router.websocket("/ws/{game_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, client_id: str):
    await manager.connect(game_id, websocket)

    # Start the phase engine on the first client connection
    if len(manager.active_connections.get(game_id, [])) == 1:
        from src.engine.phase_manager import PhaseEngine
        engine = PhaseEngine(game_id, mock_mode=False)
        active_engines[game_id] = engine
        asyncio.create_task(engine.execute_phase())

    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
                event_type = event.get("type")
                event_data = event.get("data", {})

                engine = active_engines.get(game_id)

                if event_type == "private_message" and engine:
                    npc_id = event_data.get("npc_id")
                    text = event_data.get("text")
                    if npc_id and text:
                        asyncio.create_task(
                            engine.handle_private_message(npc_id, text, websocket)
                        )

                elif event_type == "player_vote" and engine:
                    target = event_data.get("target")
                    if target:
                        asyncio.create_task(engine.handle_player_vote(target))

                elif event_type == "advance_phase" and engine:
                    asyncio.create_task(engine.handle_advance_phase())

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(game_id, websocket)
