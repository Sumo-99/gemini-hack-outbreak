"use client";

import { useState } from "react";

interface SetupFormProps {
  onGameCreated: (data: {
    game_id: string;
    opening_narrative: string;
    setting: string;
    npcs: { id: string; name: string; occupation: string; age: number }[];
  }) => void;
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1 uppercase tracking-widest">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border border-[var(--color-terminal-dim)] text-[var(--color-terminal-green)] placeholder-gray-700 p-3 text-sm outline-none focus:border-[var(--color-terminal-green)] transition-colors"
      />
    </div>
  );
}

export default function SetupForm({ onGameCreated }: SetupFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [trait, setTrait] = useState("");
  const [secret, setSecret] = useState("");
  const [infectedCount, setInfectedCount] = useState(1);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [roundLimit, setRoundLimit] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !occupation || !trait || !secret) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          occupation,
          trait,
          secret,
          infected_count: infectedCount,
          difficulty,
          round_limit: roundLimit,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      onGameCreated(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize game.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-terminal-bg)] text-[var(--color-terminal-green)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--color-terminal-amber)] text-xl tracking-widest animate-pulse mb-4 uppercase">
            Generating World...
          </div>
          <div className="text-xs text-gray-500 tracking-widest">
            Constructing scenario. Estimated time: 5–10 seconds.
          </div>
          <div className="mt-8 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block w-2 h-2 bg-[var(--color-terminal-green)] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-terminal-bg)] text-[var(--color-terminal-green)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg border border-[var(--color-terminal-dim)] p-8">
        {/* Header */}
        <div className="mb-8 border-b border-[var(--color-terminal-dim)] pb-4">
          <div className="text-xs text-gray-500 mb-1 tracking-widest">
            OUTBREAK // SURVIVOR REGISTRY
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase text-[var(--color-terminal-amber)]">
            Identity Protocol
          </h1>
          <p className="text-xs text-gray-500 mt-2">
            Establish survivor profile before accessing safehouse network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Designation"
              placeholder="Full name"
              value={name}
              onChange={setName}
            />
            <Field
              label="Age"
              placeholder="e.g. 34"
              value={age}
              onChange={setAge}
              type="number"
            />
          </div>

          <Field
            label="Occupation"
            placeholder="e.g. Field Medic, Engineer, Teacher..."
            value={occupation}
            onChange={setOccupation}
          />

          <Field
            label="Personality Trait"
            placeholder="e.g. Paranoid, Loyal, Calculating..."
            value={trait}
            onChange={setTrait}
          />

          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-widest">
              Your Secret
            </label>
            <textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Something you're hiding from the others..."
              rows={2}
              className="w-full bg-black border border-[var(--color-terminal-dim)] text-[var(--color-terminal-green)] placeholder-gray-700 p-3 text-sm outline-none focus:border-[var(--color-terminal-green)] transition-colors resize-none"
            />
          </div>

          {/* Advanced config */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-500 hover:text-gray-300 uppercase tracking-widest transition-colors"
            >
              {showAdvanced ? "▼" : "▶"} Scenario Config
            </button>
            {showAdvanced && (
              <div className="mt-3 border border-[var(--color-terminal-dim)] p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase tracking-widest">
                      Infected
                    </label>
                    <select
                      value={infectedCount}
                      onChange={(e) => setInfectedCount(parseInt(e.target.value))}
                      className="w-full bg-black border border-[var(--color-terminal-dim)] text-[var(--color-terminal-green)] p-2 text-sm outline-none"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase tracking-widest">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as "easy" | "normal" | "hard")}
                      className="w-full bg-black border border-[var(--color-terminal-dim)] text-[var(--color-terminal-green)] p-2 text-sm outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase tracking-widest">
                      Rounds
                    </label>
                    <select
                      value={roundLimit}
                      onChange={(e) => setRoundLimit(parseInt(e.target.value))}
                      className="w-full bg-black border border-[var(--color-terminal-dim)] text-[var(--color-terminal-green)] p-2 text-sm outline-none"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={7}>7</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-[var(--color-terminal-red)] text-xs border border-[var(--color-terminal-red)] p-2">
              ERROR: {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full border border-[var(--color-terminal-green)] text-[var(--color-terminal-green)] py-3 text-sm uppercase tracking-widest font-bold hover:bg-[var(--color-terminal-green)] hover:text-black transition-colors mt-2"
          >
            Initialize Survivor
          </button>
        </form>
      </div>
    </div>
  );
}
