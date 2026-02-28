"use client";

import { useGame } from "@/context/GameContext";

const OUTCOME_CONFIG = {
  player_win: {
    label: "CONTAINMENT SUCCESSFUL",
    color: "var(--color-terminal-green)",
    borderColor: "border-[var(--color-terminal-green)]",
    textColor: "text-[var(--color-terminal-green)]",
    icon: "◈",
    description: "You identified and eliminated all infected individuals. The safehouse is secure.",
  },
  player_voted_out: {
    label: "ELIMINATED BY VOTE",
    color: "var(--color-terminal-red)",
    borderColor: "border-[var(--color-terminal-red)]",
    textColor: "text-[var(--color-terminal-red)]",
    icon: "✕",
    description: "The group turned against you. The infection spreads unchecked.",
  },
  time_expired: {
    label: "OUTBREAK UNCONTAINED",
    color: "var(--color-terminal-amber)",
    borderColor: "border-[var(--color-terminal-amber)]",
    textColor: "text-[var(--color-terminal-amber)]",
    icon: "⚠",
    description: "Too many rounds passed without eliminating the infected. The safehouse is lost.",
  },
};

export default function GameOverOverlay({ onRestart }: { onRestart: () => void }) {
  const { gameOverData } = useGame();

  if (!gameOverData) return null;

  const config = OUTCOME_CONFIG[gameOverData.outcome] || OUTCOME_CONFIG.time_expired;
  const infectedList = gameOverData.all_infected || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div
        className={`relative w-full max-w-xl border ${config.borderColor} bg-[#020402] p-8`}
      >
        {/* Outcome header */}
        <div className="text-center mb-8">
          <div className={`text-5xl mb-4 ${config.textColor}`}>{config.icon}</div>
          <h1 className={`text-2xl font-bold tracking-[0.3em] uppercase font-mono ${config.textColor}`}>
            {config.label}
          </h1>
          <p className="text-gray-400 text-sm mt-3 font-mono leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Stats */}
        <div className="border border-[#1a2b1f] p-4 mb-6 grid grid-cols-2 gap-3 text-xs font-mono">
          <div>
            <span className="text-[#3b5240] uppercase tracking-widest">Rounds Survived</span>
            <div className="text-white text-lg mt-1">
              {gameOverData.rounds_survived} / {gameOverData.round_limit}
            </div>
          </div>
          <div>
            <span className="text-[#3b5240] uppercase tracking-widest">Infected Count</span>
            <div className="text-white text-lg mt-1">{infectedList.length}</div>
          </div>
        </div>

        {/* Infected reveal */}
        {infectedList.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-[#3b5240] uppercase tracking-widest mb-3">
              — Infected Individuals —
            </div>
            <div className="space-y-2">
              {infectedList.map((npc) => (
                <div
                  key={npc.name}
                  className={`flex items-center justify-between border p-3 font-mono ${
                    npc.is_eliminated
                      ? "border-[var(--color-terminal-green)]/40 bg-[#0a1c0d]"
                      : "border-[var(--color-terminal-red)]/40 bg-[#1a0a0a]"
                  }`}
                >
                  <div>
                    <div className="text-white text-sm font-bold">{npc.name}</div>
                    <div className="text-[#3b5240] text-xs">{npc.occupation}</div>
                  </div>
                  <div
                    className={`text-xs uppercase tracking-widest px-2 py-1 border ${
                      npc.is_eliminated
                        ? "border-[var(--color-terminal-green)] text-[var(--color-terminal-green)]"
                        : "border-[var(--color-terminal-red)] text-[var(--color-terminal-red)]"
                    }`}
                  >
                    {npc.is_eliminated ? "Eliminated" : "Still Alive"}
                  </div>
                </div>
              ))}
            </div>

            {/* Outcome explanation */}
            <div className="mt-3 text-xs text-gray-500 font-mono">
              {gameOverData.outcome === "player_win" &&
                `${infectedList.map((n) => n.name).join(" and ")} ${infectedList.length === 1 ? "was" : "were"} infected. You successfully identified and eliminated ${infectedList.length === 1 ? "them" : "all of them"}.`}
              {gameOverData.outcome === "time_expired" &&
                `${infectedList
                  .filter((n) => !n.is_eliminated)
                  .map((n) => n.name)
                  .join(" and ")} ${infectedList.filter((n) => !n.is_eliminated).length === 1 ? "remains" : "remain"} infected and undetected.`}
              {gameOverData.outcome === "player_voted_out" &&
                `The group voted you out. The infected — ${infectedList.map((n) => n.name).join(", ")} — ${infectedList.length === 1 ? "continues" : "continue"} to spread the outbreak.`}
            </div>
          </div>
        )}

        {/* Restart button */}
        <button
          onClick={onRestart}
          className="w-full border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] py-3 text-sm uppercase tracking-widest font-bold font-mono hover:bg-[var(--color-terminal-green)] hover:text-black transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
