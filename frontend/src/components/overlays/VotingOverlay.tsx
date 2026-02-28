import React, { useState } from "react";

type SurvivorData = {
    id: string;
    name: string;
    color: string;
    tension: number;
    tensionColor: string;
    hr: string;
    trust: string;
};

const SURVIVORS: SurvivorData[] = [
    { id: "SUB-0217", name: "MARCUS", color: "text-[#4ab1b5]", tension: 62, tensionColor: "bg-[#e5a91f]", hr: "NORMAL", trust: "MODERATE" },
    { id: "SUB-0438", name: "LENA", color: "text-[#d66b44]", tension: 74, tensionColor: "bg-[#e53e3e]", hr: "ELEVATED", trust: "LOW" },
    { id: "SUB-0651", name: "ORIN", color: "text-[#8d7db5]", tension: 55, tensionColor: "bg-[#e5a91f]", hr: "NORMAL", trust: "HIGH" },
    { id: "SUB-0892", name: "VERA", color: "text-[#6495cb]", tension: 48, tensionColor: "bg-[#4ade80]", hr: "LOW", trust: "MODERATE" }
];

export default function VotingOverlay({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<"nominate" | "tally">("nominate");
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

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
                {SURVIVORS.map((s) => {
                    const isSelected = selectedTarget === s.name;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setSelectedTarget(s.name)}
                            className={`p-5 flex flex-col items-start border text-left transition-colors relative ${isSelected ? "border-[#6495cb] bg-[#0a1016]" : "border-[#1a2b1f] hover:border-[#2a3b2f] bg-transparent"
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute top-4 right-4 border border-[var(--color-terminal-red)] text-[var(--color-terminal-red)] px-2 py-0.5 text-xs tracking-widest cursor-default">
                                    MARKED
                                </div>
                            )}
                            <div className="text-[#3b5240] text-xs mb-2 font-mono">{s.id}</div>
                            <div className={`${s.color} text-xl tracking-widest font-mono uppercase mb-6`}>{s.name}</div>

                            <div className="w-full flex justify-between text-xs text-[#3b5240] mb-1">
                                <span>TENSION</span>
                                <span className={s.tensionColor.replace('bg-', 'text-')}>{s.tension}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#121415] mb-6">
                                <div className={`h-full ${s.tensionColor}`} style={{ width: `${s.tension}%` }} />
                            </div>

                            <div className="w-full justify-between items-center text-xs flex font-mono text-gray-400">
                                <span><span className="text-[#3b5240]">HR:</span> {s.hr}</span>
                                <span><span className="text-[#3b5240]">TRUST:</span> {s.trust}</span>
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
                    onClick={() => setStep("tally")}
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
        <div className="animate-in fade-in duration-1000">
            <div className="text-[#3b5240] text-sm uppercase mb-4 tracking-widest font-mono">Decrypted Ballot Record</div>

            <div className="border border-[#1a2b1f] p-6 mb-8 font-mono text-sm leading-relaxed tracking-wider bg-[#020402]">
                <div className="text-[#4ade80]">001 YOU   → <span className="text-[var(--color-terminal-red)]">{selectedTarget}</span></div>
                <div className="text-[#6495cb]">002 MARCUS → <span className="text-[#d66b44]">LENA</span></div>
                <div className="text-[#d66b44]">003 LENA   → <span className="text-[#4ab1b5]">MARCUS</span></div>
                <div className="text-[#8d7db5]">004 ORIN   → <span className="text-[#d66b44]">LENA</span></div>
                <div className="text-[#4ade80]">005 VERA   → <span className="text-[#d66b44]">LENA</span></div>
            </div>

            <div className="text-[#3b5240] text-sm uppercase mb-4 tracking-widest font-mono">Vote Tally</div>
            <div className="space-y-4 mb-10 text-sm font-mono">
                <div className="flex items-center gap-4">
                    <span className="w-16 text-[#4ab1b5]">MARCUS</span>
                    <div className="flex-1 bg-[#121415] h-3"><div className="h-full w-1/5 bg-[#4ade80]"></div></div>
                    <span className="text-gray-400">1</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="w-16 text-[#d66b44]">LENA</span>
                    <div className="flex-1 bg-[#121415] h-3"><div className="h-full w-3/5 bg-[var(--color-terminal-red)]"></div></div>
                    <span className="text-gray-400">3</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="w-16 text-[#8d7db5]">ORIN</span>
                    <div className="flex-1 bg-[#121415] h-3"></div>
                    <span className="text-gray-400">—</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="w-16 text-[#6495cb]">VERA</span>
                    <div className="flex-1 bg-[#121415] h-3"><div className="h-full w-1/5 bg-[#4ade80]"></div></div>
                    <span className="text-gray-400">1</span>
                </div>
            </div>

            <div className="space-y-4 text-sm font-mono tracking-widest border-t border-[var(--color-terminal-dim)] pt-8">
                <div className="text-[var(--color-terminal-red)] font-bold">
                    &gt;&gt; MAJORITY DECISION: LENA [3/5]
                </div>
                <div className="text-[var(--color-terminal-red)] font-bold">
                    &gt;&gt; SUBJECT LENA — STATUS CHANGED: TERMINATED
                </div>
                <div className="text-gray-400">
                    RECORD SEALED. BALLOT ARCHIVED. NO APPEAL PERMITTED.
                </div>
            </div>

            <div className="mt-12 flex justify-center border border-[#1a2b1f] w-full">
                <button
                    onClick={onClose}
                    className="w-full px-8 py-4 tracking-[0.3em] font-mono text-[#4ade80] hover:bg-[#4ade80]/10 transition-colors uppercase"
                >
                    Acknowledge & Continue
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
                            Vote Sequence — Round 03
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
