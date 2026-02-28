"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";

export default function VotingOverlay({ onClose }: { onClose: () => void }) {
  const { gameState, systemLogs, sendVote, eliminationResult } = useGame();
  const [step, setStep] = useState<"nominate" | "tally">("nominate");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [tallyStartIndex, setTallyStartIndex] = useState(0);

  const activeNPCs = gameState.npcs?.filter((npc) => !npc.is_eliminated) || [];

  // Live log entries that came in after we started tallying
  const tallyLogs = systemLogs.slice(tallyStartIndex);

  // Has the elimination result arrived?
  const resultReady = !!eliminationResult;

  // Auto-close once user clicks "Continue" — only after result is ready
  const handleConfirmVote = () => {
    if (!selectedTarget) return;
    setTallyStartIndex(systemLogs.length); // capture current log length
    sendVote(selectedTarget);
    setStep("tally");
  };

  // ── Nominate screen ─────────────────────────────────────────────────────────
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
              className={`p-5 flex flex-col items-start border text-left transition-colors relative ${
                isSelected
                  ? "border-[#6495cb] bg-[#0a1016]"
                  : "border-[#1a2b1f] hover:border-[#2a3b2f] bg-transparent"
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 border border-[var(--color-terminal-red)] text-[var(--color-terminal-red)] px-2 py-0.5 text-xs tracking-widest">
                  MARKED
                </div>
              )}
              <div className="text-[#3b5240] text-xs mb-2 font-mono">{s.id || "UNKNOWN"}</div>
              <div className="text-gray-200 text-xl tracking-widest font-mono uppercase mb-6">
                {s.name}
              </div>
              <div className="w-full flex justify-between text-xs text-[#3b5240] mb-1">
                <span>TENSION</span>
                <span className={s.pulse > 90 ? "text-[#e53e3e]" : "text-[#4ade80]"}>
                  {s.pulse}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#121415] mb-6">
                <div
                  className={`h-full ${s.pulse > 90 ? "bg-[#e53e3e]" : "bg-[#4ade80]"}`}
                  style={{ width: `${s.pulse}%` }}
                />
              </div>
              <div className="w-full justify-between items-center text-xs flex font-mono text-gray-400">
                <span>
                  <span className="text-[#3b5240]">HR:</span>{" "}
                  {s.pulse > 90 ? "ELEVATED" : "NORMAL"}
                </span>
                <span>
                  <span className="text-[#3b5240]">TRUST:</span>{" "}
                  {(s.trust || "UNKNOWN").toUpperCase()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-end border-t border-[#1a2b1f] pt-8">
        <div className="text-sm font-mono tracking-widest text-[#3b5240] uppercase">
          {selectedTarget ? (
            <>
              Target:{" "}
              <span className="text-[var(--color-terminal-red)]">{selectedTarget}</span>
            </>
          ) : (
            "No Target Designated"
          )}
        </div>
        <button
          disabled={!selectedTarget}
          onClick={handleConfirmVote}
          className={`border px-8 py-3 text-sm tracking-[0.2em] font-mono transition-colors focus:outline-none ${
            selectedTarget
              ? "border-[var(--color-terminal-red)] text-[var(--color-terminal-red)] hover:bg-[var(--color-terminal-red)]/10"
              : "border-[#1a2b1f] text-[#3b5240] cursor-not-allowed opacity-50"
          }`}
        >
          CONFIRM ELIMINATION
        </button>
      </div>
    </>
  );

  // ── Tally screen ─────────────────────────────────────────────────────────────
  const renderTally = () => (
    <div className="flex flex-col gap-4">
      {/* Live vote feed */}
      <div className="text-[var(--color-terminal-amber)] text-sm uppercase tracking-widest mb-2 animate-pulse">
        {resultReady ? "Vote Tallied" : "Collecting Votes..."}
      </div>

      <div className="space-y-2 min-h-[120px]">
        {tallyLogs.length === 0 ? (
          <div className="text-[#3b5240] text-xs font-mono animate-pulse">
            Awaiting consensus...
          </div>
        ) : (
          tallyLogs.map((log) => (
            <div
              key={log.id}
              className={`text-xs font-mono border-l-2 pl-3 py-1 ${
                log.sender === "VOTE"
                  ? "border-[var(--color-terminal-amber)] text-[var(--color-terminal-amber)]"
                  : log.type === "gm_event"
                  ? "border-[var(--color-terminal-green)] text-gray-300"
                  : "border-[#3b5240] text-gray-400"
              }`}
            >
              {log.sender === "VOTE" ? `VOTE: ${log.text}` : log.text}
            </div>
          ))
        )}
      </div>

      {/* Elimination result */}
      {resultReady && eliminationResult && (
        <div className="border border-[var(--color-terminal-red)] p-4 mt-4">
          <div className="text-[var(--color-terminal-red)] text-lg font-mono uppercase tracking-widest mb-2">
            ⚠ ELIMINATED
          </div>
          <div className="text-white text-2xl font-bold tracking-widest mb-3">
            {eliminationResult.eliminated_name}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400">
            {Object.entries(eliminationResult.vote_tally).map(([name, count]) => (
              <span
                key={name}
                className={`border px-2 py-1 ${
                  name === eliminationResult.eliminated_name
                    ? "border-[var(--color-terminal-red)] text-[var(--color-terminal-red)]"
                    : "border-[#3b5240] text-[#3b5240]"
                }`}
              >
                {name}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Continue button — only after result arrives */}
      <div className="flex justify-center mt-4 border-t border-[#1a2b1f] pt-4">
        {resultReady ? (
          <button
            onClick={onClose}
            className="border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] px-10 py-3 font-mono tracking-widest uppercase hover:bg-[var(--color-terminal-green)]/10 transition-colors"
          >
            Continue →
          </button>
        ) : (
          <div className="text-[#3b5240] text-xs font-mono tracking-widest animate-pulse">
            Processing...
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040604]/95 p-4 select-none">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar border border-[#1a2b1f] bg-[#020402]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#1a2b1f] pb-3 mb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#00ff41] text-lg font-mono tracking-[0.3em] uppercase">
              Vote Sequence — Round {(gameState.round || 1).toString().padStart(2, "0")}
            </h1>
            <span className="text-[#3b5240] text-xs font-mono tracking-widest uppercase">
              Protocol: Majority Elimination
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#3b5240] hover:text-white text-xs font-mono tracking-widest focus:outline-none transition-colors"
          >
            [ABORT]
          </button>
        </div>

        {step === "nominate" ? renderNominate() : renderTally()}
      </div>
    </div>
  );
}
