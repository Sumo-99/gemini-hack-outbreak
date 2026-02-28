"use client";

import { useState } from "react";
import SafeHouseLog from "../components/SafeHouseLog";
import CameraFeeds from "../components/CameraFeeds";
import PrivateChat from "../components/PrivateChat";
import SurvivorStatus from "../components/SurvivorStatus";
import VotingOverlay from "../components/overlays/VotingOverlay";
import SetupForm from "../components/SetupForm";
import GameOverOverlay from "../components/overlays/GameOverOverlay";
import { useGame } from "@/context/GameContext";

// ─── Opening Narrative ────────────────────────────────────────────────────────

function OpeningNarrative({
  narrative,
  setting,
  onContinue,
}: {
  narrative: string;
  setting: string;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-terminal-bg)] text-[var(--color-terminal-green)] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest">
          // Situation Briefing
        </div>
        {setting && (
          <div className="text-xs text-[var(--color-terminal-amber)] mb-4 tracking-widest uppercase">
            {setting}
          </div>
        )}
        <div className="text-gray-300 text-base leading-relaxed border border-[var(--color-terminal-dim)] p-6 mb-8 font-mono">
          {narrative}
        </div>
        <button
          onClick={onContinue}
          className="border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] px-8 py-3 text-sm uppercase tracking-widest font-bold hover:bg-[var(--color-terminal-green)] hover:text-black transition-colors"
        >
          Enter Safehouse
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [showVoting, setShowVoting] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);
  const { gameStarted, worldGenData, initializeGame, gameOverData } = useGame();

  const handleGameCreated = (data: {
    game_id: string;
    opening_narrative: string;
    setting: string;
    npcs: { id: string; name: string; occupation: string; age: number }[];
  }) => {
    initializeGame(data);
    setShowNarrative(true);
  };

  // ── Screen 1: Setup Form ──────────────────────────────────────────────────

  if (!gameStarted) {
    return <SetupForm onGameCreated={handleGameCreated} />;
  }

  // ── Screen 2: Opening Narrative ───────────────────────────────────────────

  if (showNarrative && worldGenData?.opening_narrative) {
    return (
      <OpeningNarrative
        narrative={worldGenData.opening_narrative}
        setting={worldGenData.setting}
        onContinue={() => setShowNarrative(false)}
      />
    );
  }

  // ── Screen 3: Main Game UI ────────────────────────────────────────────────

  return (
    <main className="h-screen w-screen overflow-hidden bg-[var(--color-terminal-bg)] text-[var(--color-terminal-green)] flex relative">
      <div className="flex-1 grid grid-cols-[300px_1fr_300px] h-full">
        {/* Left Panel: Safe House Log */}
        <section className="h-full overflow-hidden">
          <SafeHouseLog />
        </section>

        {/* Center Panel: Camera Feeds + Private Chat */}
        <section className="h-full flex flex-col overflow-hidden relative">
          <CameraFeeds />
          <div className="flex-1 overflow-hidden">
            <PrivateChat />
          </div>
        </section>

        {/* Right Panel: Survivor Status */}
        <section className="h-full overflow-hidden border-l border-[var(--color-terminal-dim)]">
          <SurvivorStatus onInitiateVote={() => setShowVoting(true)} />
        </section>
      </div>

      {showVoting && <VotingOverlay onClose={() => setShowVoting(false)} />}
      {gameOverData && (
        <GameOverOverlay onRestart={() => window.location.reload()} />
      )}
    </main>
  );
}
