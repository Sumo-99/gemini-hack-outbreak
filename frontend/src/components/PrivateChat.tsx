import React, { useState } from "react";
import { useGame } from "@/context/GameContext";

export default function PrivateChat() {
    const { messages, sendMessage, typingState } = useGame();
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-terminal-bg)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="text-center text-xs text-gray-500 mb-8 border-b border-[var(--color-terminal-dim)] pb-2">
                    SECURE CHANNEL ESTABLISHED _
                </div>

                {messages.map((msg) => {
                    const isSystem = msg.type === "gm_event";
                    if (isSystem) return null; // GM events go to SafeHouseLog

                    const isYou = msg.sender === "YOU" || msg.sender === "player";

                    if (isYou) {
                        return (
                            <div key={msg.id} className="flex flex-col gap-1 max-w-[85%] self-end items-end ml-auto">
                                <span className="text-xs text-[var(--color-terminal-green)] font-bold uppercase">YOU</span>
                                <div className="bg-[#0a1c0d] border border-[var(--color-terminal-green)]/30 p-3 rounded-sm text-[var(--color-terminal-green)] text-sm">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className="flex flex-col gap-1 max-w-[85%]">
                            <span className="text-xs text-gray-500 font-bold uppercase">MSG_INBOUND [{msg.sender}]</span>
                            <div className="bg-[#121413] border border-[var(--color-terminal-dim)] p-3 rounded-sm text-gray-300 text-sm">
                                {msg.text}
                            </div>
                        </div>
                    );
                })}

                {typingState && (
                    <div className="text-xs text-[var(--color-terminal-dim)] font-mono animate-pulse uppercase tracking-wider mt-4">
                        {typingState} IS GENERATING RESPONSE_
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--color-terminal-dim)] bg-[#0a0a0a]">
                <div className="flex gap-2">
                    <div className="flex-1 border border-[var(--color-terminal-green)]/50 bg-black flex items-center px-3 focus-within:border-[var(--color-terminal-green)] transition-colors">
                        <span className="text-[var(--color-terminal-green)] mr-2">&gt;</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent outline-none text-[var(--color-terminal-green)] placeholder-gray-600 py-2 text-sm"
                            placeholder="_ Enter command..."
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        className="border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] px-6 py-2 text-sm hover:bg-[var(--color-terminal-green)] hover:text-black transition-colors uppercase font-bold tracking-wider"
                    >
                        Transmit
                    </button>
                </div>
            </div>
        </div>
    );
}
