"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

type Message = {
  id: string;
  sender: string;
  text: string;
  type: "broadcast" | "private" | "gm_event";
};

type NPCState = {
  id: string;
  name: string;
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

type GameContextType = {
  gameState: GameState;
  messages: Message[];
  systemLogs: Message[];
  isConnected: boolean;
  sendMessage: (text: string) => void;
  sendVote: (targetName: string) => void;
  connect: (gameId: string, clientId: string) => void;
};

const defaultState: GameState = {
  gameId: "",
  round: 1,
  phase: "setup",
  npcs: [], // Populated by backend soon
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(defaultState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemLogs, setSystemLogs] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((gameId: string, clientId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `ws://localhost:8000/ws/${gameId}/${clientId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to OUTBREAK Engine");
      setIsConnected(true);
      setGameState((prev) => ({ ...prev, gameId }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleServerEvent(payload);
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from OUTBREAK Engine");
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, []);

  const handleServerEvent = (payload: any) => {
    const { type, data } = payload;
    
    if (type === "new_message") {
      setMessages((prev) => [...prev, {
        id: Math.random().toString(),
        sender: data.sender || "Unknown",
        text: data.text,
        type: "broadcast"
      }]);
    } else if (type === "gm_event") {
      setSystemLogs((prev) => [...prev, {
        id: Math.random().toString(),
        sender: "SYSTEM",
        text: data.text,
        type: "gm_event"
      }]);
    } else if (type === "phase_change") {
        setGameState((prev) => ({
            ...prev,
            phase: data.phase
        }))
        setSystemLogs((prev) => [...prev, {
            id: Math.random().toString(),
            sender: "SYSTEM",
            text: `>> PHASE TRANSITION: ${data.phase.toUpperCase()}`,
            type: "gm_event"
        }]);
    } else if (type === "vote") {
        setSystemLogs((prev) => [...prev, {
            id: Math.random().toString(),
            sender: "SYSTEM",
            text: `>> VOTE CAST: ${data.sender} → ${data.vote}`,
            type: "gm_event"
        }]);
    }
  };

  const sendMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "player_message",
        data: { text }
      }));
      // Optimistically add to local chat
      setMessages((prev) => [...prev, {
        id: Math.random().toString(),
        sender: "YOU",
        text,
        type: "broadcast"
      }]);
    }
  };

  const sendVote = (targetName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "vote",
        data: { target: targetName }
      }));
    }
  };

  return (
    <GameContext.Provider value={{
      gameState,
      messages,
      systemLogs,
      isConnected,
      sendMessage,
      sendVote,
      connect
    }}>
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
