import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";

export const metadata: Metadata = {
  title: "OUTBREAK | Term Link Secure",
  description: "Terminal interface for OUTBREAK safe house",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[var(--color-terminal-bg)] text-[var(--color-terminal-green)] font-mono selection:bg-[var(--color-terminal-green)] selection:text-[var(--color-terminal-bg)]">
        <GameProvider>
          <div className="scanlines pointer-events-none" aria-hidden="true" />
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
