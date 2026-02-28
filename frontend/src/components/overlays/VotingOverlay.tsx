import React, { useState } from "react";
import { useGame } from "@/context/GameContext";

export default function VotingOverlay({ onClose }: { onClose: () => void }) {
    const { gameState, sendVote } = useGame();
    const [step, setStep] = useState<"nominate" | "tally">("nominate");
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

    // Filter out ALIVE NPCs for voting
    const activeNPCs = gameState.npcs?.filter(npc => !npc.is_eliminated) || [];

    const handleConfirmVote = () => {
        if (selectedTarget) {
            sendVote(selectedTarget);
            setStep("tally");

            // Auto close after 5 seconds to go back to the game
            setTimeout(() => {
                onClose();
            }, 5000);
        }
    };

    const renderNominate = () => (
        <>
            <div className="flex items-center justify-between mb-8">
                <div className="text-[#3b5240] text-sm uppercase tracking-widest">
                    Designate Subject For Elimination
                </div>
                <div className="text-[var(--color-terminal-amber)] text-sm tracking-widest uppercase animate-pulse">
                    Awaiting Input_
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-16">
                {activeNPCs.map((s) => {
                    const isSelected = selectedTarget === s.name;
                    return (
                        <button
                            key={s.id || s.name}
                            onClick={() => setSelectedTarget(s.name)}
                            className={`p-5 flex flex-col items-start border text-left transition-colors relative ${isSelected ? "border-[#6495cb] bg-[#0a1016]" : "border-[#1a2b1f] hover:border-[#2a3b2f] bg-transparent"
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute top-4 right-4 border border-[var(--color-terminal-red)] text-[var(--color-terminal-red)] px-2 py-0.5 text-xs tracking-widest cursor-default">
                                    MARKED
                                </div>
                            )}
                            <div className="text-[#3b5240] text-xs mb-2 font-mono">{s.id || "UNKNOWN"}</div>
                            <div className={`text-gray-200 text-xl tracking-widest font-mono uppercase mb-6`}>{s.name}</div>

                            <div className="w-full flex justify-between text-xs text-[#3b5240] mb-1">
                                <span>TENSION</span>
                                <span className={s.pulse > 90 ? "text-[#e53e3e]" : "text-[#4ade80]"}>{s.pulse}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#121415] mb-6">
                                <div className={`h-full ${s.pulse > 90 ? "bg-[#e53e3e]" : "bg-[#4ade80]"}`} style={{ width: `${s.pulse}%` }} />
                            </div>

                            <div className="w-full justify-between items-center text-xs flex font-mono text-gray-400">
                                <span><span className="text-[#3b5240]">HR:</span> {s.pulse > 90 ? "ELEVATED" : "NORMAL"}</span>
                                <span><span className="text-[#3b5240]">TRUST:</span> {(s.trust || "UNKNOWN").toUpperCase()}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-between items-end border-t border-[#1a2b1f] pt-8">
                <div className="text-sm font-mono tracking-widest text-[#3b5240] uppercase">
                    {selectedTarget ? (
                        <>Target: <span className="text-[var(--color-terminal-red)]">{selectedTarget}</span></>
                    ) : (
                        "No Target Designated"
                    )}
                </div>

                <button
                    disabled={!selectedTarget}
                    onClick={handleConfirmVote}
                    className={`border px-8 py-3 text-sm tracking-[0.2em] font-mono transition-colors focus:outline-none ${selectedTarget
                        ? "border-[var(--color-terminal-red)] text-[var(--color-terminal-red)] hover:bg-[var(--color-terminal-red)]/10"
                        : "border-[#1a2b1f] text-[#3b5240] cursor-not-allowed opacity-50"
                        }`}
                >
                    CONFIRM ELIMINATION
                </button>
            </div>
        </>
    );

    const renderTally = () => (
        <div className="animate-in fade-in duration-1000 flex flex-col items-center py-10">
            <div className="text-[var(--color-terminal-amber)] text-xl uppercase mb-4 tracking-widest font-mono animate-pulse">
                Vote Registered
            </div>

            <div className="text-gray-400 text-sm font-mono text-center max-w-md">
                Your ballot has been submitted to the central AI tally system.
                <br /><br />
                Awaiting remaining consensus...
                Check the SafeHouse Log for the final GM execution report.
            </div>

            <div className="mt-12 flex justify-center border border-[#1a2b1f] w-full max-w-sm">
                <button
                    onClick={onClose}
                    className="w-full px-8 py-4 tracking-[0.3em] font-mono text-[#4ade80] hover:bg-[#4ade80]/10 transition-colors uppercase"
                >
                    Return to Terminal
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040604]/95 p-4 select-none">
            {/* Scanline overlay base application */}
            <div className="absolute inset-0 scanlines pointer-events-none" />

            <div className="relative w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar border border-[#1a2b1f] bg-[#020402]">

                {/* Header */}
                <div className="flex justify-between items-start border-b border-[#1a2b1f] pb-3 mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#00ff41] text-lg font-mono tracking-[0.3em] uppercase">
                            Vote Sequence — Round {(gameState.round || 1).toString().padStart(2, '0')}
                        </h1>
                        <span className="text-[#3b5240] text-xs font-mono tracking-widest uppercase">
                            Protocol: Majority Elimination
                        </span>
                    </div>
                    <button onClick={onClose} className="text-[#3b5240] hover:text-white text-xs font-mono tracking-widest focus:outline-none transition-colors">
                        [ABORT]
                    </button>
                </div>

                {/* Content */}
                {step === "nominate" ? renderNominate() : renderTally()}

            </div>
        </div>
    );
}
