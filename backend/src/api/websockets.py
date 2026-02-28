from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

ws_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps gameId to a list of active websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, game_id: str):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)
        print(f"Client connected to game {game_id}")

    def disconnect(self, websocket: WebSocket, game_id: str):
        if game_id in self.active_connections:
            self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
            print(f"Client disconnected from game {game_id}")

    async def broadcast_to_game(self, game_id: str, message: dict):
        if game_id in self.active_connections:
            # Broadcast the JSON message to all clients on this game session
            text_data = json.dumps(message)
            for connection in self.active_connections[game_id]:
                try:
                    await connection.send_text(text_data)
                except Exception as e:
                    print(f"Failed sending to a websocket: {e}")

manager = ConnectionManager()

@ws_router.websocket("/ws/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    """
    WebSocket endpoint for real-time game interaction.
    """
    await manager.connect(websocket, game_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Parse incoming event (e.g. chat message, vote, player action)
            try:
                event = json.loads(data)
                print(f"Received event on game {game_id}:", event)
                
                # TODO: Route event to the PhaseEngine to process the action
                
            except json.JSONDecodeError:
                print("Invalid JSON received.")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id)
