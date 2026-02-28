import json
import asyncio
import random
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
    GAME_STATE = "game_state"

class ConnectionManager:
    """Manages active WebSockets and handles real-time broadcasts per game session."""
    def __init__(self):
        # game_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, game_id: str, websocket: WebSocket):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        if websocket not in self.active_connections[game_id]:
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
background_tasks = set()

from src.store.game_store import store
from src.agents.npc import NPCAgent

from src.agents.client import GeminiClient

@ws_router.websocket("/ws/{game_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, client_id: str):
    await manager.connect(game_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
                
                # Fetch state
                state = store.get_game(game_id)
                
                if event.get("type") == EventType.PLAYER_MESSAGE.value:
                    msg_text = event.get("data", {}).get("text", "")
                    
                    if state:
                        # 1. Log player message
                        state.conversations.broadcast.append({
                            "type": "broadcast", 
                            "senderId": "YOU", 
                            "content": msg_text
                        })
                        
                    # 2. Broadcast to other clients (though it's a single player game, good practice)
                    await manager.broadcast(game_id, EventType.NEW_MESSAGE, {"sender": "YOU", "text": msg_text})

                    # 3. Trigger all alive AI NPCs to respond and GM to monitor
                    from src.models.state import Phase
                    if state and len(state.npcs) > 0 and state.phase == Phase.BROADCAST:
                        async def npc_respond(npc_data):
                            try:
                                if npc_data.is_eliminated:
                                    return
                                    
                                real_client = GeminiClient(mock_mode=False)
                                npc = NPCAgent(npc_data, client=real_client)
                                
                                # Tell UI this NPC is typing
                                await manager.broadcast(game_id, EventType.NPC_TYPING, {"npc": npc_data.name})
                                
                                # Add a small organic delay
                                await asyncio.sleep(random.uniform(0.5, 2.5))
                                
                                # Generate response
                                response = await npc.generate_broadcast_message(state)
                                
                                # Log it atomically
                                state.conversations.broadcast.append({
                                    "type": "broadcast",
                                    "senderId": npc_data.name,
                                    "content": response
                                })
                                
                                # Broadcast the NPC response back to the player
                                await manager.broadcast(game_id, EventType.NEW_MESSAGE, {"sender": npc_data.name, "text": response})
                            except Exception as e:
                                import traceback
                                err_str = f"Error in NPC task for {npc_data.name}: {e}\n{traceback.format_exc()}\n"
                                print(err_str)
                                with open("backend_errors.log", "a") as f:
                                    f.write(err_str)
                                    
                        async def gm_monitor():
                            try:
                                from src.engine.game_master import GameMasterAgent
                                gm = GameMasterAgent()
                                event_text = await gm.generate_world_event(state)
                                if event_text and "NO_EVENT" not in event_text:
                                    state.safe_house_log.append({"type": "gm_event", "content": f">> WORLD EVENT:\n{event_text}"})
                                    await manager.broadcast(game_id, EventType.GM_EVENT, {"text": f">> WORLD EVENT:\n{event_text}"})
                            except Exception as e:
                                print(f"GM error: {e}")
                            
                        # Launch all NPC tasks concurrently as a background job
                        tasks = [npc_respond(npc) for npc in state.npcs]
                        
                        # Let the GM cast a new world event every 5 messages to inject paranoia
                        if len(state.conversations.broadcast) % 5 == 0:
                            tasks.append(gm_monitor())
                            
                        future = asyncio.gather(*tasks)
                        background_tasks.add(future)
                        future.add_done_callback(background_tasks.discard)
                
                elif event.get("type") == EventType.VOTE.value:
                    target_name = event.get("data", {}).get("target", "")
                    if state:
                        from src.engine.phase_machine import PhaseMachine
                        task = asyncio.create_task(PhaseMachine.process_voting(state, target_name, manager, game_id))
                        background_tasks.add(task)
                        task.add_done_callback(background_tasks.discard)
                        
            except json.JSONDecodeError:
                # Ignore malformed JSON
                pass
            except Exception as e:
                import traceback
                err = f"CRITICAL WS ERROR: {e}\n{traceback.format_exc()}"
                print(err)
                with open("backend_errors.log", "a") as f:
                    f.write(err + "\n")
    except WebSocketDisconnect:
        manager.disconnect(game_id, websocket)
