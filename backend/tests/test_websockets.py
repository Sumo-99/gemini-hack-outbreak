import pytest
from fastapi.testclient import TestClient
from src.main import app
import json

client = TestClient(app)

def test_websocket_broadcast():
    with client.websocket_connect("/ws/test_game/client1") as ws1:
        with client.websocket_connect("/ws/test_game/client2") as ws2:
            # Client 1 sends a valid format message
            payload = json.dumps({"type": "player_message", "data": {"text": "hello"}})
            ws1.send_text(payload)

            # Both clients should receive the broadcast 'new_message'
            data1 = ws1.receive_text()
            data2 = ws2.receive_text()

            event1 = json.loads(data1)
            event2 = json.loads(data2)

            assert event1["type"] == "new_message", "Event type mismatch for client 1"
            assert event2["type"] == "new_message", "Event type mismatch for client 2"
            assert event1["data"]["text"] == "hello", "Payload data mismatch for client 1"
            assert event2["data"]["text"] == "hello", "Payload data mismatch for client 2"

def test_websocket_disconnect():
    with client.websocket_connect("/ws/test_disconnect/client1") as ws1:
        pass  # It will disconnect when out of context
    
    # Send another message with a new client to ensure no errors when other client goes away
    with client.websocket_connect("/ws/test_disconnect/client2") as ws2:
        payload = json.dumps({"type": "player_message", "data": {"text": "alone"}})
        ws2.send_text(payload)
        data = ws2.receive_text()
        event = json.loads(data)
        assert event["type"] == "new_message"
