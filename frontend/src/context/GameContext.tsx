"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Message = {
  id: string;
  sender: string;
  text: string;
  type: "broadcast" | "private" | "gm_event";
};

export type NPCState = {
  id: string;
  name: string;
  occupation: string;
  age: number;
  pulse: number;
  trust: "high" | "neutral" | "low";
  is_eliminated: boolean;
};

type GameState = {
  gameId: string;
  round: number;
  phase: string;
  npcs: NPCState[];
};

type WorldGenData = {
  setting: string;
  opening_narrative: string;
  npcs: { id: string; name: string; occupation: string; age: number }[];
} | null;

export type EliminationResult = {
  eliminated_name: string;
  vote_tally: Record<string, number>;
} | null;

export type GameOverPayload = {
  outcome: "player_win" | "player_voted_out" | "time_expired";
  round: number;
  eliminated_this_round: string;
  all_infected: { name: string; occupation: string; is_eliminated: boolean }[];
  rounds_survived: number;
  round_limit: number;
};
export type GameOverData = GameOverPayload | null;

type GameContextType = {
  gameState: GameState;
  messages: Message[];
  systemLogs: Message[];
  privateMessages: Record<string, Message[]>;
  isConnected: boolean;
  gameStarted: boolean;
  worldGenData: WorldGenData;
  selectedNpcId: string | null;
  setSelectedNpcId: (id: string | null) => void;
  eliminationResult: EliminationResult;
  gameOverData: GameOverData;
  initializeGame: (data: {
    game_id: string;
    opening_narrative: string;
    setting: string;
    npcs: { id: string; name: string; occupation: string; age: number }[];
  }) => void;
  sendMessage: (text: string) => void;
  sendVote: (targetName: string) => void;
  sendPrivateMessage: (npcId: string, text: string) => void;
  advancePhase: () => void;
  connect: (gameId: string, clientId: string) => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultGameState: GameState = {
  gameId: "",
  round: 1,
  phase: "setup",
  npcs: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemLogs, setSystemLogs] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Record<string, Message[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [worldGenData, setWorldGenData] = useState<WorldGenData>(null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [eliminationResult, setEliminationResult] = useState<EliminationResult>(null);
  const [gameOverData, setGameOverData] = useState<GameOverData>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ── WebSocket connection ───────────────────────────────────────────────────

  const connect = useCallback((gameId: string, clientId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${gameId}/${clientId}`);

    ws.onopen = () => {
      setIsConnected(true);
      setGameState((prev) => ({ ...prev, gameId }));
    };

    ws.onmessage = (event) => {
      try {
        handleServerEvent(JSON.parse(event.data));
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onclose = () => setIsConnected(false);

    wsRef.current = ws;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Server event handler ──────────────────────────────────────────────────

  const handleServerEvent = (payload: { type: string; data: Record<string, unknown> }) => {
    const { type, data } = payload;

    if (type === "new_message") {
      const msg: Message = {
        id: Math.random().toString(36),
        sender: (data.sender as string) || "Unknown",
        text: (data.text as string) || "",
        type: "broadcast",
      };
      setMessages((prev) => [...prev, msg]);
      // Broadcast messages also appear in the safe house log
      setSystemLogs((prev) => [...prev, msg]);

    } else if (type === "gm_event") {
      setSystemLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          sender: "SYSTEM",
          text: (data.text as string) || "",
          type: "gm_event",
        },
      ]);

    } else if (type === "phase_change") {
      const phase = data.phase as string;
      setGameState((prev) => ({ ...prev, phase }));
      setSystemLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          sender: "SYSTEM",
          text: `>> PHASE: ${phase.toUpperCase()}`,
          type: "gm_event",
        },
      ]);

    } else if (type === "vote") {
      const reason = data.reason ? ` | ${data.reason}` : "";
      setSystemLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          sender: "VOTE",
          text: `${data.sender} → ${data.target}${reason}`,
          type: "gm_event",
        },
      ]);

    } else if (type === "npc_private_response") {
      const npcId = data.npc_id as string;
      const msg: Message = {
        id: Math.random().toString(36),
        sender: (data.npc_name as string) || npcId,
        text: (data.text as string) || "",
        type: "private",
      };
      setPrivateMessages((prev) => ({
        ...prev,
        [npcId]: [...(prev[npcId] || []), msg],
      }));

    } else if (type === "elimination_reveal") {
      const eliminatedName = data.eliminated_name as string;
      const voteTally = (data.vote_tally as Record<string, number>) || {};
      setEliminationResult({ eliminated_name: eliminatedName, vote_tally: voteTally });
      setSystemLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          sender: "SYSTEM",
          text: `>> ELIMINATED: ${eliminatedName}`,
          type: "gm_event",
        },
      ]);
      if (eliminatedName) {
        setGameState((prev) => ({
          ...prev,
          npcs: prev.npcs.map((npc) =>
            npc.name === eliminatedName ? { ...npc, is_eliminated: true } : npc
          ),
        }));
      }

    } else if (type === "game_over") {
      setGameOverData({
        outcome: data.outcome as GameOverPayload["outcome"],
        round: data.round as number,
        eliminated_this_round: data.eliminated_this_round as string,
        all_infected: data.all_infected as GameOverPayload["all_infected"],
        rounds_survived: data.rounds_survived as number,
        round_limit: data.round_limit as number,
      });
      setSystemLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          sender: "SYSTEM",
          text: `>> GAME OVER: ${(data.outcome as string || "").toUpperCase()}`,
          type: "gm_event",
        },
      ]);
      setGameState((prev) => ({ ...prev, phase: "end" }));
    }
  };

  // ── Game initializer (called after API returns) ────────────────────────────

  const initializeGame = useCallback(
    (data: {
      game_id: string;
      opening_narrative: string;
      setting: string;
      npcs: { id: string; name: string; occupation: string; age: number }[];
    }) => {
      setWorldGenData({
        setting: data.setting,
        opening_narrative: data.opening_narrative,
        npcs: data.npcs,
      });

      setGameState({
        gameId: data.game_id,
        round: 1,
        phase: "setup",
        npcs: data.npcs.map((n) => ({
          id: n.id,
          name: n.name,
          occupation: n.occupation,
          age: n.age,
          pulse: 70,
          trust: "neutral",
          is_eliminated: false,
        })),
      });

      setGameStarted(true);

      // Connect WebSocket
      const clientId = "player_" + Math.random().toString(36).substring(2, 9);
      connect(data.game_id, clientId);
    },
    [connect]
  );

  // ── Outbound WS actions ───────────────────────────────────────────────────

  const sendMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "player_message", data: { text } }));
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(36), sender: "YOU", text, type: "broadcast" },
      ]);
    }
  };

  const sendPrivateMessage = (npcId: string, text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "private_message", data: { npc_id: npcId, text } })
      );
      // Optimistic local update
      const playerMsg: Message = {
        id: Math.random().toString(36),
        sender: "YOU",
        text,
        type: "private",
      };
      setPrivateMessages((prev) => ({
        ...prev,
        [npcId]: [...(prev[npcId] || []), playerMsg],
      }));
    }
  };

  const sendVote = (targetName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "player_vote", data: { target: targetName } })
      );
    }
  };

  const advancePhase = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "advance_phase", data: {} }));
    }
  };

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <GameContext.Provider
      value={{
        gameState,
        messages,
        systemLogs,
        privateMessages,
        isConnected,
        gameStarted,
        worldGenData,
        selectedNpcId,
        setSelectedNpcId,
        eliminationResult,
        gameOverData,
        initializeGame,
        sendMessage,
        sendVote,
        sendPrivateMessage,
        advancePhase,
        connect,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
