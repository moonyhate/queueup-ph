"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Player, Session } from "@/lib/types";

export default function LeaderboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const active = sessions?.[0] ?? null;
      if (cancelled) return;
      setSession(active);
      if (!active) return;

      await refresh(active.id);
      if (cancelled) return;

      // In React 18 dev mode this effect can run twice in a row (StrictMode).
      // Remove any leftover channel on the same topic before subscribing again,
      // otherwise Supabase errors with "cannot add callbacks after subscribe()".
      const topic = `leaderboard-${active.id}`;
      const existing = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`);
      if (existing) await supabase.removeChannel(existing);
      if (cancelled) return;

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `session_id=eq.${active.id}` },
          () => refresh(active.id)
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function refresh(sessionId: string) {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("session_id", sessionId)
      .neq("status", "checked_out");
    setPlayers(data ?? []);
  }

  const ranked = useMemo(() => {
    return [...players]
      .filter((p) => p.games_played > 0 || p.status !== "checked_out")
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.games_played - a.games_played;
      });
  }, [players]);

  if (!isSupabaseConfigured) {
    return <Screen>Supabase isn&rsquo;t configured yet.</Screen>;
  }
  if (!session) {
    return <Screen>No open-play session running right now.</Screen>;
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-waiting">
            Session leaderboard
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-none">Standings</h1>
        </div>
        <Link
          href="/queue"
          className="font-mono text-xs uppercase border border-ink/30 rounded-card px-4 py-2"
        >
          Back to Queue
        </Link>
      </div>

      <table className="w-full border-collapse bg-white rounded-card shadow-md overflow-hidden px-4">
        <thead>
          <tr className="border-b-2 border-ink text-left font-mono text-xs uppercase text-waiting">
            <th className="py-2 pr-2">Rank</th>
            <th className="py-2 pr-2">Name</th>
            <th className="py-2 pr-2 text-right">Wins</th>
            <th className="py-2 pr-2 text-right">Games</th>
            <th className="py-2 text-right">Win %</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p, i) => {
            const winPct = p.games_played > 0 ? Math.round((p.wins / p.games_played) * 100) : 0;
            const medalLabel = ["1ST", "2ND", "3RD"][i];
            return (
              <tr
                key={p.id}
                className={`border-b border-line ${i < 3 ? "bg-ball/10" : ""}`}
              >
                <td className="py-3 pr-2 scoreboard-num text-xl">
                  {medalLabel ? (
                    <span className="text-[10px] font-mono font-normal align-middle mr-1 px-1.5 py-0.5 rounded-card border border-ink/30">
                      {medalLabel}
                    </span>
                  ) : null}
                  {i + 1}
                </td>
                <td className="py-3 pr-2 font-medium">{p.name}</td>
                <td className="py-3 pr-2 text-right scoreboard-num text-xl">{p.wins}</td>
                <td className="py-3 pr-2 text-right text-waiting">{p.games_played}</td>
                <td className="py-3 text-right text-waiting">{winPct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {ranked.length === 0 && (
        <p className="text-waiting mt-6">No games played yet this session.</p>
      )}
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-4xl mb-3">QueueUp PH</p>
        <p className="text-waiting">{children}</p>
      </div>
    </div>
  );
}
