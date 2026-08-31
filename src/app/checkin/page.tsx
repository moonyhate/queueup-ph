"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Session, SkillLevel } from "@/lib/types";

const SKILLS: SkillLevel[] = ["Beginner", "Novice", "Intermediate", "Advanced"];

export default function CheckinPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      setSession(data?.[0] ?? null);
      setLoading(false);
    })();
  }, []);

  async function handleCheckin() {
    if (!session || !name.trim() || !skill) return;
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("players").insert({
      session_id: session.id,
      name: name.trim(),
      skill_level: skill,
      status: "waiting",
      checked_in_at: new Date().toISOString(),
      wins: 0,
      games_played: 0,
    });
    setSaving(false);
    if (insertError) {
      setError("Something went wrong. Ask the organizer to add you instead.");
      return;
    }
    setDone(true);
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <p className="text-2xl">Supabase isn't configured yet.</p>
      </Screen>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (!session) {
    return (
      <Screen>
        <p className="text-2xl">No open-play session running right now.</p>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <p className="text-4xl font-display mb-3">You're in, {name}!</p>
        <p className="text-waiting mb-6">
          You've been added to the waiting queue. Check the live screen to see your spot in line.
        </p>
        <Link
          href="/queue"
          className="tap-target inline-flex items-center justify-center bg-ink text-surface font-display text-xl rounded-card px-6"
        >
          View the queue
        </Link>
      </Screen>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-wide text-waiting mb-1 text-center">
          Check in
        </p>
        <h1 className="font-display text-5xl leading-none mb-8 text-center">QueueUp PH</h1>

        <div className="bg-white border border-line rounded-card p-6">
          <label className="block text-sm font-medium mb-2">Your name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name"
            className="tap-target w-full border-2 border-ink rounded-card px-4 text-lg mb-5 bg-surface"
          />

          <label className="block text-sm font-medium mb-2">Skill level</label>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkill(s)}
                className={`tap-target rounded-card border-2 font-medium text-sm transition-colors ${
                  skill === s ? "bg-court text-white border-court" : "border-ink/30 text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

          <button
            onClick={handleCheckin}
            disabled={!name.trim() || !skill || saving}
            className="tap-target w-full bg-ink text-surface font-display text-2xl rounded-card disabled:opacity-40"
          >
            {saving ? "Checking in..." : "Check in"}
          </button>
        </div>

        <p className="text-xs text-waiting text-center mt-4">
          {session.game_format}
        </p>
      </div>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-4xl mb-3">QueueUp PH</p>
        {children}
      </div>
    </div>
  );
}
