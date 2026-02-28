import React from "react";

export default function CameraFeeds() {
    return (
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-[var(--color-terminal-dim)] min-h-[250px] relative">
            {/* Feed 1 */}
            <div className="relative border border-[var(--color-terminal-dim)] bg-black/50 overflow-hidden flex flex-col justify-end">
                {/* Background placeholder scanline tint */}
                <div className="absolute inset-0 bg-[#00FF41] opacity-[0.03] pointer-events-none" />

                <div className="relative z-10 p-2 text-xs flex justify-between items-center bg-black/60 border-t border-[var(--color-terminal-dim)]">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-gray-400">REC</span>
                    </div>
                    <span className="text-[var(--color-terminal-amber)]">CAM_FEED_ACTIVE</span>
                </div>
            </div>

            {/* Feed 2 */}
            <div className="relative border border-[var(--color-terminal-dim)] bg-black/50 overflow-hidden flex flex-col justify-end">
                <div className="absolute inset-0 bg-[#00FF41] opacity-[0.03] pointer-events-none" />

                <div className="relative z-10 p-2 text-xs flex justify-between items-center bg-black/60 border-t border-[var(--color-terminal-dim)]">
                    <span className="text-gray-500">OFFLINE</span>
                    <span className="text-[var(--color-terminal-amber)]">STILL_CAPTURE_02</span>
                </div>
            </div>
        </div>
    );
}
