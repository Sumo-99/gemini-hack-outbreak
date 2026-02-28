import React from "react";
import { useGame } from "@/context/GameContext";

function SurvivorCard({ name, status, pulse, pulseColor, hrStatus, trust }: any) {
    return (
        <div className="border border-[var(--color-terminal-dim)] p-3 mb-3 bg-[#0a0a0a]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-lg uppercase tracking-wider font-bold text-gray-200">{name}</span>
                <span className={`text-xs font-bold ${status === 'TERMINATED' ? 'text-[var(--color-terminal-red)]' : 'text-[var(--color-terminal-green)]'}`}>
                    {status}
                </span>
            </div>

            {status === 'ALIVE' && (
                <>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 bg-black border border-[var(--color-terminal-dim)] overflow-hidden">
                            <div
                                className={`h-full ${pulseColor}`}
                                style={{ width: `${pulse}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono text-gray-400 min-w-[30px] text-right">{pulse}</span>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span>HR: {hrStatus}</span>
                        <span>TRUST: {trust}</span>
                    </div>
                </>
            )}
        </div>
    );
}

export default function SurvivorStatus({ onInitiateVote }: { onInitiateVote?: () => void }) {
    const { gameState } = useGame();

    // Fallback UI if backend isn't connected yet
    const npcs = gameState.npcs.length > 0 ? gameState.npcs : [];

    return (
        <div className="flex flex-col h-full border-l border-[var(--color-terminal-dim)] bg-[var(--color-terminal-bg)]">
            <div className="p-4 border-b border-[var(--color-terminal-dim)]">
                <h2 className="text-gray-300 tracking-widest font-bold uppercase">Survivor Status</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <SurvivorCard
                    name="You"
                    status="ALIVE"
                    pulse={68}
                    pulseColor="bg-[var(--color-terminal-green)]"
                    hrStatus="NORMAL"
                    trust="HIGH"
                />

                {npcs.map(npc => (
                    <SurvivorCard
                        key={npc.id || npc.name}
                        name={npc.name}
                        status={npc.is_eliminated ? "TERMINATED" : "ALIVE"}
                        pulse={npc.is_eliminated ? 0 : (npc.pulse || 75)}
                        pulseColor={npc.is_eliminated ? "bg-[var(--color-terminal-red)]" : "bg-yellow-500"}
                        hrStatus={npc.pulse && npc.pulse > 90 ? "ELEVATED" : "NORMAL"}
                        trust={(npc.trust || "UNKNOWN").toUpperCase()}
                    />
                ))}
            </div>

            <div className="p-4 border-t border-[var(--color-terminal-dim)] space-y-4">
                <div className="text-xs text-gray-400 flex flex-col gap-1">
                    <div className="flex justify-between"><span>ROUND:</span> <span className="text-[var(--color-terminal-amber)]">{(gameState.round || 1).toString().padStart(2, '0')}</span></div>
                    <div className="flex justify-between"><span>REMAINING:</span> <span>{npcs.filter(n => !n.is_eliminated).length + 1}</span></div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-[var(--color-terminal-dim)] text-[var(--color-terminal-amber)] uppercase">
                        <span>PHASE:</span> <span>{gameState.phase || "SETUP"}</span>
                    </div>
                </div>

                <button
                    onClick={onInitiateVote}
                    disabled={gameState.phase !== "broadcast"}
                    className={`w-full border py-3 text-sm tracking-widest uppercase font-bold transition-colors ${gameState.phase === "broadcast"
                        ? "border-[var(--color-terminal-dim)] text-gray-400 hover:border-[var(--color-terminal-amber)] hover:text-[var(--color-terminal-amber)]"
                        : "border-[#1a1a1a] text-[#333] cursor-not-allowed"
                        }`}
                >
                    {gameState.phase === "broadcast" ? "Initiate Vote" : "Voting Offline"}
                </button>
            </div>
        </div>
    );
}
