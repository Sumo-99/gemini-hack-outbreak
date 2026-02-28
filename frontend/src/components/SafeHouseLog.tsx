"use client";
import React from "react";
import { useGame } from "@/context/GameContext";

export default function SafeHouseLog() {
    const { systemLogs, messages } = useGame();

    // Interleave messages by timestamp (simulated by array index initially for demo)
    const combinedLog = [...systemLogs, ...messages].slice(-50); // Keep last 50

    return (
        <div className="flex flex-col h-full border-r border-[var(--color-terminal-dim)] bg-[var(--color-terminal-bg)]">
            <div className="p-4 border-b border-[var(--color-terminal-dim)]">
                <h2 className="text-[var(--color-terminal-amber)] font-bold mb-2">&gt;&gt; SYSTEM LOG _</h2>
                <div className="flex justify-between text-xs text-gray-500">
                    <span>MONITORING: ACTIVE</span>
                    <span>UPTIME: 99.9%</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {combinedLog.length === 0 && (
                    <div className="text-xs">
                        <span className="opacity-50">21:03:12</span>
                        <span className="text-white ml-2">SYSTEM ONLINE. AWAITING FEED.</span>
                    </div>
                )}

                {combinedLog.map((log) => {
                    if (log.type === "gm_event") {
                        return (
                            <div key={log.id} className="text-xs text-[var(--color-terminal-amber)] font-bold border border-[var(--color-terminal-amber)] p-2 mt-4">
                                {log.text}
                            </div>
                        )
                    }

                    return (
                        <div key={log.id} className="text-sm">
                            <span className="text-[var(--color-terminal-green)]">[{log.sender}]</span>
                            <span className="ml-2 text-gray-300">{log.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
