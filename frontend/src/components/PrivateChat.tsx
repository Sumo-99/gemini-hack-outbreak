"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGame } from "@/context/GameContext";

export default function PrivateChat() {
  const {
    gameState,
    privateMessages,
    selectedNpcId,
    setSelectedNpcId,
    sendPrivateMessage,
    advancePhase,
  } = useGame();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeNpcs = gameState.npcs.filter((n) => !n.is_eliminated);
  const currentMessages = selectedNpcId ? (privateMessages[selectedNpcId] || []) : [];
  const isInvestigation = gameState.phase === "investigation";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSend = () => {
    if (input.trim() && selectedNpcId) {
      sendPrivateMessage(selectedNpcId, input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-terminal-bg)]">
      {/* NPC Selector Row */}
      <div className="flex gap-2 p-3 border-b border-[var(--color-terminal-dim)] overflow-x-auto shrink-0">
        <div className="text-xs text-gray-600 self-center mr-1 shrink-0 tracking-widest uppercase">
          Chan:
        </div>
        {activeNpcs.length === 0 ? (
          <div className="text-xs text-gray-600 self-center">No survivors</div>
        ) : (
          activeNpcs.map((npc) => {
            const isSelected = selectedNpcId === npc.id;
            const hasUnread =
              (privateMessages[npc.id] || []).length > 0;
            return (
              <button
                key={npc.id}
                onClick={() => setSelectedNpcId(npc.id)}
                className={`shrink-0 px-3 py-1 text-xs border transition-colors uppercase tracking-wider ${
                  isSelected
                    ? "border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] bg-[var(--color-terminal-green)]/10"
                    : hasUnread
                    ? "border-[var(--color-terminal-amber)] text-[var(--color-terminal-amber)]"
                    : "border-[var(--color-terminal-dim)] text-gray-500 hover:border-gray-400 hover:text-gray-400"
                }`}
              >
                {npc.name.split(" ")[0]}
              </button>
            );
          })
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selectedNpcId ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-xs text-gray-600 uppercase tracking-widest">
              Secure Channel Idle
            </div>
            <div className="text-xs text-gray-700">
              Select a survivor above to open a private channel.
            </div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="text-center text-xs text-gray-600 mt-8 border-b border-[var(--color-terminal-dim)] pb-4 uppercase tracking-widest">
            Channel open — no messages yet
          </div>
        ) : (
          <>
            <div className="text-center text-xs text-gray-600 mb-4 border-b border-[var(--color-terminal-dim)] pb-2 uppercase tracking-widest">
              Secure Channel Established
            </div>
            {currentMessages.map((msg) => {
              const isYou = msg.sender === "YOU";
              return isYou ? (
                <div
                  key={msg.id}
                  className="flex flex-col gap-1 max-w-[85%] self-end items-end ml-auto"
                >
                  <span className="text-xs text-[var(--color-terminal-green)] font-bold uppercase">
                    You
                  </span>
                  <div className="bg-[#0a1c0d] border border-[var(--color-terminal-green)]/30 p-3 text-[var(--color-terminal-green)] text-sm">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="flex flex-col gap-1 max-w-[85%]"
                >
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    {msg.sender}
                  </span>
                  <div className="bg-[#121413] border border-[var(--color-terminal-dim)] p-3 text-gray-300 text-sm">
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input + End Investigation */}
      <div className="p-4 border-t border-[var(--color-terminal-dim)] bg-[#0a0a0a] shrink-0">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 border border-[var(--color-terminal-green)]/50 bg-black flex items-center px-3 focus-within:border-[var(--color-terminal-green)] transition-colors">
            <span className="text-[var(--color-terminal-green)] mr-2">&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedNpcId || !isInvestigation}
              className="w-full bg-transparent outline-none text-[var(--color-terminal-green)] placeholder-gray-600 py-2 text-sm disabled:opacity-40"
              placeholder={
                !selectedNpcId
                  ? "Select a survivor first..."
                  : !isInvestigation
                  ? "Investigation phase only..."
                  : "Enter message..."
              }
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedNpcId || !isInvestigation}
            className="border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] px-6 py-2 text-sm hover:bg-[var(--color-terminal-green)] hover:text-black transition-colors uppercase font-bold tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Transmit
          </button>
        </div>

        <button
          onClick={advancePhase}
          disabled={!isInvestigation}
          className={`w-full border py-2 text-xs tracking-widest uppercase font-bold transition-colors ${
            isInvestigation
              ? "border-[var(--color-terminal-amber)] text-[var(--color-terminal-amber)] hover:bg-[var(--color-terminal-amber)]/10"
              : "border-[#1a1a1a] text-[#333] cursor-not-allowed"
          }`}
        >
          {isInvestigation ? "End Investigation →" : "Investigation Offline"}
        </button>
      </div>
    </div>
  );
}
