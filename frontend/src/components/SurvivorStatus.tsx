import React from "react";

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
                <SurvivorCard
                    name="Marcus"
                    status="ALIVE"
                    pulse={82}
                    pulseColor="bg-yellow-500"
                    hrStatus="ELEVATED"
                    trust="UNKNOWN"
                />
                <SurvivorCard
                    name="Dax"
                    status="TERMINATED"
                    pulse={0}
                    pulseColor="bg-[var(--color-terminal-red)]"
                    hrStatus="FLATLINE"
                    trust="LOW"
                />
                <SurvivorCard
                    name="Elena"
                    status="ALIVE"
                    pulse={45}
                    pulseColor="bg-[var(--color-terminal-green)]"
                    hrStatus="LOW"
                    trust="MODERATE"
                />
            </div>

            <div className="p-4 border-t border-[var(--color-terminal-dim)] space-y-4">
                <div className="text-xs text-gray-400 flex flex-col gap-1">
                    <div className="flex justify-between"><span>ROUND:</span> <span className="text-[var(--color-terminal-amber)]">03</span></div>
                    <div className="flex justify-between"><span>REMAINING:</span> <span>02</span></div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-[var(--color-terminal-dim)] text-[var(--color-terminal-amber)]">
                        <span>PHASE:</span> <span>INTERROGATION</span>
                    </div>
                </div>

                <button
                    onClick={onInitiateVote}
                    className="w-full border border-[var(--color-terminal-dim)] text-gray-400 py-3 text-sm tracking-widest hover:border-[var(--color-terminal-amber)] hover:text-[var(--color-terminal-amber)] transition-colors uppercase font-bold"
                >
                    Initiate Vote
                </button>
            </div>
        </div>
    );
}
