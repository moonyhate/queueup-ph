"use client";

import { FormEvent, useState } from "react";
import { unlockPin } from "@/lib/pin";

export default function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        unlockPin();
        onUnlock();
      } else {
        setError("Wrong PIN. Try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-line rounded-card bg-white p-8 shadow-xl"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-waiting mb-1">
          Organizer access
        </p>
        <h1 className="font-display text-4xl leading-none mb-6">
          Enter session PIN
        </h1>
        <input
          autoFocus
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="----"
          className="tap-target w-full border-2 border-ink rounded-card px-4 text-2xl font-mono tracking-widest mb-3 bg-surface"
        />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={checking || pin.length === 0}
          className="tap-target w-full bg-ink text-surface font-display text-2xl rounded-card disabled:opacity-40"
        >
          {checking ? "Checking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
