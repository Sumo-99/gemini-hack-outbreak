import React from "react";

export default function PrivateChat() {
    return (
        <div className="flex flex-col h-full bg-[var(--color-terminal-bg)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="text-center text-xs text-gray-500 mb-8 border-b border-[var(--color-terminal-dim)] pb-2">
                    SECURE CHANNEL ESTABLISHED _
                </div>

                {/* NPC Message */}
                <div className="flex flex-col gap-1 max-w-[85%]">
                    <span className="text-xs text-gray-500 font-bold uppercase">MSG_INBOUND [Marcus]</span>
                    <div className="bg-[#121413] border border-[var(--color-terminal-dim)] p-3 rounded-sm text-gray-300 text-sm">
                        I don&apos;t trust Dax. Did you see where he was during the lockdown sequence?
                    </div>
                </div>

                {/* Player Message */}
                <div className="flex flex-col gap-1 max-w-[85%] self-end items-end ml-auto">
                    <span className="text-xs text-[var(--color-terminal-green)] font-bold uppercase">YOU</span>
                    <div className="bg-[#0a1c0d] border border-[var(--color-terminal-green)]/30 p-3 rounded-sm text-[var(--color-terminal-green)] text-sm">
                        He said he was in the comms room. We need to verify that.
                    </div>
                </div>

            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--color-terminal-dim)] bg-[#0a0a0a]">
                <div className="text-xs text-gray-500 mb-2 animate-pulse">Marcus is typing_</div>
                <div className="flex gap-2">
                    <div className="flex-1 border border-[var(--color-terminal-green)]/50 bg-black flex items-center px-3 focus-within:border-[var(--color-terminal-green)] transition-colors">
                        <span className="text-[var(--color-terminal-green)] mr-2">&gt;</span>
                        <input
                            type="text"
                            className="w-full bg-transparent outline-none text-[var(--color-terminal-green)] placeholder-gray-600 py-2 text-sm"
                            placeholder="_ Enter command..."
                        />
                    </div>
                    <button className="border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] px-6 py-2 text-sm hover:bg-[var(--color-terminal-green)] hover:text-black transition-colors uppercase font-bold tracking-wider">
                        Transmit
                    </button>
                </div>
            </div>
        </div>
    );
}
