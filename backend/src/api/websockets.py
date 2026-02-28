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
    PLAYER_MESSAGE = "player_message" # Inbound from client
    VOTE = "vote"                     # Inbound from client

class ConnectionManager:
    """Manages active WebSockets and handles real-time broadcasts per game session."""
    def __init__(self):
        # game_id -> list of active WebSocket connections
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
            for connection in self.active_connections[game_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass

manager = ConnectionManager()

@ws_router.websocket("/ws/{game_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, client_id: str):
    await manager.connect(game_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
                
                # Route player_message to all OTHER clients only (sender already sees it optimistically)
                if event.get("type") == EventType.PLAYER_MESSAGE.value:
                    payload = json.dumps({"type": EventType.NEW_MESSAGE.value, "data": {**event.get("data", {}), "sender": client_id}})
                    for connection in manager.active_connections.get(game_id, []):
                        if connection is not websocket:
                            try:
                                await connection.send_text(payload)
                            except Exception:
                                pass
            except json.JSONDecodeError:
                # Ignore malformed JSON
                pass
    except WebSocketDisconnect:
        manager.disconnect(game_id, websocket)
