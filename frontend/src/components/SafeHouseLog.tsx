import React from "react";

export default function SafeHouseLog() {
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
                {/* Placeholder log items for the mockup */}
                <div className="text-xs">
                    <span className="opacity-50">21:03:12</span>
                    <span className="text-white ml-2">SYSTEM ONLINE. MONITORING ACTIVE.</span>
                </div>

                <div className="text-xs text-[var(--color-terminal-amber)] font-bold mt-6 mb-2">
                    &gt;&gt; ROUND 03 INITIATED. PHASE: INTERROGATION
                </div>

                <div className="text-sm">
                    <span className="text-[var(--color-terminal-green)]">[Marcus]</span>
                    <span className="ml-2 text-gray-300">I heard something in the east wing. Did anyone else hear that?</span>
                </div>

                <div className="text-sm">
                    <span className="text-[var(--color-terminal-green)]">[Elena]</span>
                    <span className="ml-2 text-gray-300">I was in the medical bay. The door was locked.</span>
                </div>

                <div className="text-xs text-[var(--color-terminal-amber)] font-bold border border-[var(--color-terminal-amber)] p-2 mt-4">
                    MOTION SENSOR TRIGGERED — SECTOR 7-B
                </div>
            </div>
        </div>
    );
}
