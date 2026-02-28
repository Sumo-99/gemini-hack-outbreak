import asyncio
import json
import time
import logging
from typing import Optional

from src.models.state import GameState, Phase
from src.store.game_store import store
from src.agents.npc import NPCAgent
from src.agents.gm import GameMasterAgent
from src.agents.client import GeminiClient
from src.api.websockets import manager, EventType

logger = logging.getLogger(__name__)


class PhaseEngine:
    """Manages progression and logic execution of the game phase state machine."""

    def __init__(self, game_id: str, mock_mode: bool = False):
        self.game_id = game_id
        self.client = GeminiClient(mock_mode=mock_mode)
        self.gm = GameMasterAgent(client=self.client)
        self._advance_event = asyncio.Event()
        self._vote_event = asyncio.Event()
        self._player_vote_target: Optional[str] = None
        self._eliminated_name: Optional[str] = None

    def _get_state(self) -> Optional[GameState]:
        return store.get_game(self.game_id)

    async def _set_phase(self, phase: Phase) -> None:
        state = self._get_state()
        if state:
            state.phase = phase
            await manager.broadcast(self.game_id, EventType.PHASE_CHANGE, {"phase": phase.value})

    # -------------------------------------------------------------------------
    # Public event handlers (called from websocket router)
    # -------------------------------------------------------------------------

    async def handle_private_message(self, npc_id: str, text: str, ws) -> None:
        """Handle a private message from the player to an NPC. Responds only to that WS."""
        state = self._get_state()
        if not state:
            return

        npc_data = next((n for n in state.npcs if n.id == npc_id), None)
        if not npc_data or npc_data.is_eliminated:
            return

        # Store player message in private conversation history
        player_msg = {
            "senderId": state.player.name,
            "content": text,
            "round": state.round,
            "timestamp": time.time(),
        }
        if npc_id not in state.conversations.private:
            state.conversations.private[npc_id] = []
        state.conversations.private[npc_id].append(player_msg)

        # Generate NPC response
        npc_agent = NPCAgent(npc_data, client=self.client)
        response = await npc_agent.generate_private_response(text, state)

        # Store NPC response
        npc_msg = {
            "senderId": npc_id,
            "content": response,
            "round": state.round,
            "timestamp": time.time(),
        }
        state.conversations.private[npc_id].append(npc_msg)

        # Send only to this websocket
        payload = json.dumps({
            "type": EventType.NPC_PRIVATE_RESPONSE.value,
            "data": {
                "npc_id": npc_id,
                "npc_name": npc_data.name,
                "text": response,
            },
        })
        try:
            await ws.send_text(payload)
        except Exception as e:
            logger.error(f"Failed to send private response: {e}")

    async def handle_player_vote(self, target: str) -> None:
        """Record the player's vote and signal the voting phase."""
        self._player_vote_target = target
        self._vote_event.set()

    async def handle_advance_phase(self) -> None:
        """Signal that the player wants to advance from the investigation phase."""
        self._advance_event.set()

    # -------------------------------------------------------------------------
    # Phase runners
    # -------------------------------------------------------------------------

    async def _run_setup(self) -> None:
        state = self._get_state()
        if not state:
            return

        narrative = await self.gm.generate_player_narrative(state)

        state.safe_house_log.append({
            "senderId": "GM",
            "content": narrative,
            "round": state.round,
            "timestamp": time.time(),
        })

        await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": narrative})
        await self._set_phase(Phase.INVESTIGATION)

    async def _run_investigation(self) -> None:
        """Wait for the player to signal end of investigation."""
        self._advance_event.clear()
        await self._advance_event.wait()
        await self._set_phase(Phase.BROADCAST)

    async def _run_broadcast(self) -> None:
        state = self._get_state()
        if not state:
            return

        alive_npcs = [n for n in state.npcs if not n.is_eliminated]

        for npc_data in alive_npcs:
            # Signal NPC is typing
            await manager.broadcast(
                self.game_id,
                EventType.NPC_TYPING,
                {"npc_id": npc_data.id, "npc_name": npc_data.name},
            )

            npc_agent = NPCAgent(npc_data, client=self.client)
            msg = await npc_agent.generate_broadcast_message(state)

            # Store in broadcast log and safe house log
            msg_record = {
                "senderId": npc_data.id,
                "content": msg,
                "round": state.round,
                "timestamp": time.time(),
            }
            state.conversations.broadcast.append(msg_record)
            state.safe_house_log.append({
                **msg_record,
                "senderId": npc_data.name,
            })

            await manager.broadcast(self.game_id, EventType.NEW_MESSAGE, {
                "sender": npc_data.name,
                "npc_id": npc_data.id,
                "text": msg,
            })

            # GM event check after each NPC speaks
            event = await self.gm.check_for_events(state, npc_data.name, msg)
            if event and event.strip() != "NO_EVENT":
                state.safe_house_log.append({
                    "senderId": "GM",
                    "content": event,
                    "round": state.round,
                    "timestamp": time.time(),
                })
                await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": event})

            await asyncio.sleep(1.5)

        await self._set_phase(Phase.VOTING)

    async def _run_voting(self) -> None:
        state = self._get_state()
        if not state:
            return

        # Wait for player to submit their vote
        self._vote_event.clear()
        await self._vote_event.wait()

        player_target = self._player_vote_target

        # Collect all NPC votes in parallel
        alive_npcs = [n for n in state.npcs if not n.is_eliminated]

        async def get_npc_vote(npc_data):
            npc_agent = NPCAgent(npc_data, client=self.client)
            target, reason = await npc_agent.generate_vote(state)
            return npc_data.name, target, reason

        npc_vote_results = await asyncio.gather(*[get_npc_vote(n) for n in alive_npcs])

        # Tally votes
        vote_tally: dict[str, int] = {}

        # Player vote
        if player_target:
            normalized = self._normalize_vote_target(player_target, state)
            vote_tally[normalized] = vote_tally.get(normalized, 0) + 1
            await manager.broadcast(self.game_id, EventType.VOTE, {
                "sender": state.player.name,
                "target": normalized,
                "reason": "Player's vote",
            })
            await asyncio.sleep(0.5)

        # NPC votes revealed one by one
        for voter_name, target, reason in npc_vote_results:
            normalized = self._normalize_vote_target(target, state)
            vote_tally[normalized] = vote_tally.get(normalized, 0) + 1
            await manager.broadcast(self.game_id, EventType.VOTE, {
                "sender": voter_name,
                "target": normalized,
                "reason": reason,
            })
            await asyncio.sleep(0.5)

        # Determine eliminated character (plurality)
        if vote_tally:
            eliminated_name = max(vote_tally, key=lambda k: vote_tally[k])
        else:
            eliminated_name = "abstain"

        self._eliminated_name = eliminated_name

        await manager.broadcast(self.game_id, EventType.ELIMINATION_REVEAL, {
            "eliminated_name": eliminated_name,
            "vote_tally": vote_tally,
        })

        state.safe_house_log.append({
            "senderId": "GM",
            "content": f">> VOTE COMPLETE. {eliminated_name} has been selected for elimination.",
            "round": state.round,
            "timestamp": time.time(),
        })

        await self._set_phase(Phase.ELIMINATION)

    def _normalize_vote_target(self, target: str, state: GameState) -> str:
        """Match a vote target string to an actual survivor name."""
        if not target or target.lower() == "abstain":
            return "abstain"

        target_lower = target.lower().strip()

        # Check player
        if state.player.name.lower() in target_lower or target_lower in state.player.name.lower():
            return state.player.name

        # Check NPCs
        for npc in state.npcs:
            if not npc.is_eliminated:
                if npc.name.lower() in target_lower or target_lower in npc.name.lower():
                    return npc.name

        return target

    async def _run_elimination(self) -> None:
        state = self._get_state()
        if not state:
            return

        eliminated_name = self._eliminated_name
        was_infected = False

        if eliminated_name and eliminated_name != "abstain":
            if eliminated_name == state.player.name:
                state.player.is_eliminated = True
                state.outcome = "player_voted_out"
            else:
                for npc in state.npcs:
                    if npc.name == eliminated_name:
                        npc.is_eliminated = True
                        was_infected = npc.is_infected
                        break

        await manager.broadcast(self.game_id, EventType.GM_EVENT, {
            "text": f">> ELIMINATION CONFIRMED: {eliminated_name} has been removed from the safehouse."
        })

        await asyncio.sleep(1.0)

        await manager.broadcast(self.game_id, EventType.GM_EVENT, {
            "text": f">> INFECTION STATUS: {eliminated_name} was {'INFECTED' if was_infected else 'CLEAN'}."
        })

        # Check win/loss conditions
        alive_npcs = [n for n in state.npcs if not n.is_eliminated]
        infected_alive = [n for n in alive_npcs if n.is_infected]

        if state.player.is_eliminated:
            state.outcome = "player_voted_out"
        elif len(infected_alive) == 0:
            state.outcome = "player_win"
        elif state.round >= state.config.round_limit:
            state.outcome = "time_expired"

        await self._set_phase(Phase.SUMMARY)

    async def _run_summary(self) -> None:
        state = self._get_state()
        if not state:
            return

        eliminated_name = self._eliminated_name or "Unknown"
        summary = await self.gm.generate_post_round_summary(state, eliminated_name)

        state.safe_house_log.append({
            "senderId": "GM",
            "content": summary,
            "round": state.round,
            "timestamp": time.time(),
        })

        await manager.broadcast(self.game_id, EventType.GM_EVENT, {"text": summary})

        if state.outcome:
            await asyncio.sleep(2.0)
            # Build full reveal: show all infected NPCs
            all_infected = [
                {"name": n.name, "occupation": n.occupation, "is_eliminated": n.is_eliminated}
                for n in state.npcs if n.is_infected
            ]
            await manager.broadcast(self.game_id, EventType.GAME_OVER, {
                "outcome": state.outcome,
                "round": state.round,
                "eliminated_this_round": self._eliminated_name,
                "all_infected": all_infected,
                "rounds_survived": state.round,
                "round_limit": state.config.round_limit,
            })
            await self._set_phase(Phase.END)
        else:
            # Advance to next round
            state.round += 1
            await asyncio.sleep(2.0)
            await self._set_phase(Phase.SETUP)

    # -------------------------------------------------------------------------
    # Main loop
    # -------------------------------------------------------------------------

    async def execute_phase(self) -> None:
        """Main game loop — runs until the game ends."""
        while True:
            state = self._get_state()
            if not state:
                break

            phase = state.phase

            if phase == Phase.SETUP:
                await self._run_setup()
            elif phase == Phase.INVESTIGATION:
                await self._run_investigation()
            elif phase == Phase.BROADCAST:
                await self._run_broadcast()
            elif phase == Phase.VOTING:
                await self._run_voting()
            elif phase == Phase.ELIMINATION:
                await self._run_elimination()
            elif phase == Phase.SUMMARY:
                await self._run_summary()
            elif phase == Phase.END:
                logger.info(f"Game {self.game_id} has ended.")
                break
            else:
                # Unknown phase — bail
                break
