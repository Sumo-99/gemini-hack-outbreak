"use client";

import { useState } from "react";
import SafeHouseLog from "../components/SafeHouseLog";
import CameraFeeds from "../components/CameraFeeds";
import PrivateChat from "../components/PrivateChat";
import SurvivorStatus from "../components/SurvivorStatus";
import VotingOverlay from "../components/overlays/VotingOverlay";

export default function Home() {
  const [showVoting, setShowVoting] = useState(false);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[var(--color-terminal-bg)] text-[var(--color-terminal-green)] flex relative">
      <div className="flex-1 grid grid-cols-[300px_1fr_300px] h-full">
        {/* Left Panel: Broadcast & System Events */}
        <section className="h-full overflow-hidden">
          <SafeHouseLog />
        </section>

        {/* Center Panel: Camera Feeds & Investigation Chat */}
        <section className="h-full flex flex-col overflow-hidden relative">
          <CameraFeeds />
          <div className="flex-1 overflow-hidden">
            <PrivateChat />
          </div>
        </section>

        {/* Right Panel: Survivor Status & Core Loop State */}
        <section className="h-full overflow-hidden border-l border-[var(--color-terminal-dim)]">
          <SurvivorStatus onInitiateVote={() => setShowVoting(true)} />
        </section>
      </div>

      {showVoting && <VotingOverlay onClose={() => setShowVoting(false)} />}
    </main>
  );
}
