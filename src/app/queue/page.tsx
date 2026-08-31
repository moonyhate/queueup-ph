"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Court, Player, Session } from "@/lib/types";
import { skillBadgeColor, previewNextMatches } from "@/lib/matching";
import { formatWaitTime } from "@/lib/format";
import ElapsedTimer from "@/components/ElapsedTimer";
import StatsBar from "@/components/StatsBar";
import UpNextPreview from "@/components/UpNextPreview";

export default function QueuePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selfUrl, setSelfUrl] = useState("");
  const [checkinUrl, setCheckinUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelfUrl(window.location.href);
      setCheckinUrl(`${window.location.origin}/checkin`);
    }
  }, []);

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
      const topic = `queue-${active.id}`;
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
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "courts", filter: `session_id=eq.${active.id}` },
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
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase
        .from("players")
        .select("*")
        .eq("session_id", sessionId)
        .neq("status", "checked_out")
        .order("checked_in_at", { ascending: true }),
      supabase
        .from("courts")
        .select("*")
        .eq("session_id", sessionId)
        .order("court_number", { ascending: true }),
    ]);
    setPlayers(p ?? []);
    setCourts(c ?? []);
  }

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const waiting = useMemo(
    () =>
      players
        .filter((p) => p.status === "waiting")
        .sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()),
    [players]
  );
  const resting = useMemo(() => players.filter((p) => p.status === "resting"), [players]);
  const upNext = useMemo(() => previewNextMatches(waiting, 1), [waiting]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <p className="text-2xl">Supabase isn&rsquo;t configured yet.</p>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <p className="text-2xl">No open-play session running right now.</p>
      </Screen>
    );
  }

  return (
    <div className="min-h-screen bg-court-dark text-surface">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6 border-b border-white/10 flex-wrap gap-4">
        <div>
          <span className="font-display text-3xl sm:text-4xl leading-none">QueueUp PH</span>
          <p className="font-mono text-xs uppercase tracking-wide text-white/50 mt-1">
            {session.game_format}
          </p>
        </div>
        <StatsBar
          dark
          courtsInPlay={courts.filter((c) => c.status === "in_progress").length}
          courtsTotal={courts.length}
          playersTotal={players.filter((p) => p.status !== "checked_out").length}
          queueCount={waiting.length}
        />
        <div className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="font-mono text-xs sm:text-sm uppercase border border-white/30 rounded-card px-4 py-2"
          >
            Leaderboard
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-center">
              <div className="bg-white p-2 rounded-card">
                <QRCodeSVG value={selfUrl || "/"} size={56} />
              </div>
              <p className="font-mono text-[9px] uppercase text-white/40 mt-1">Watch</p>
            </div>
            <div className="text-center">
              <div className="bg-white p-2 rounded-card">
                <QRCodeSVG value={checkinUrl || "/checkin"} size={56} />
              </div>
              <p className="font-mono text-[9px] uppercase text-ball mt-1">Check in</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 sm:px-10 py-8 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <section>
          <h2 className="font-display text-3xl sm:text-4xl leading-none mb-4 text-ball">
            Courts
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {courts.map((court) => {
              const inProgress = court.status === "in_progress";
              const teamA = court.team_a?.playerIds.map((id) => playersById.get(id));
              const teamB = court.team_b?.playerIds.map((id) => playersById.get(id));
              return (
                <div
                  key={court.id}
                  className={`rounded-card overflow-hidden border-2 shadow-lg ${
                    inProgress ? "border-progress" : "border-ball"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-3 ${
                      inProgress ? "bg-progress" : "bg-ball"
                    }`}
                  >
                    <span
                      className={`font-display text-2xl leading-none ${
                        inProgress ? "text-white" : "text-ink"
                      }`}
                    >
                      Court {court.court_number}
                    </span>
                    {inProgress ? (
                      <span className="flex items-center gap-2 font-mono text-sm text-white">
                        <span className="live-dot w-2 h-2 rounded-full bg-white inline-block" />
                        <ElapsedTimer startedAt={court.started_at as string} />
                      </span>
                    ) : (
                      <span className="font-mono text-xs uppercase text-ink">Open</span>
                    )}
                  </div>
                  <div className="bg-court-dark">
                    {inProgress && teamA && teamB ? (
                      <div className="grid grid-cols-2">
                        <div className="px-3 py-3 border-r border-white/10 space-y-1.5">
                          <p className="font-mono text-[10px] uppercase tracking-wide text-progress-light text-progress mb-1">
                            Team A
                          </p>
                          {teamA.map((p) => (
                            <p key={p?.id} className="text-lg flex items-center gap-2">
                              {p?.name}
                              <span className="text-[10px] font-mono text-white/40 border border-white/20 rounded-card px-1.5 py-0.5">
                                {p?.skill_level}
                              </span>
                            </p>
                          ))}
                        </div>
                        <div className="px-3 py-3 space-y-1.5">
                          <p className="font-mono text-[10px] uppercase tracking-wide text-rest mb-1">
                            Team B
                          </p>
                          {teamB.map((p) => (
                            <p key={p?.id} className="text-lg flex items-center gap-2">
                              {p?.name}
                              <span className="text-[10px] font-mono text-white/40 border border-white/20 rounded-card px-1.5 py-0.5">
                                {p?.skill_level}
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/50 px-4 py-8 text-center">Waiting for players</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          {upNext.length > 0 && (
            <div className="mb-8">
              <UpNextPreview previews={upNext} dark />
            </div>
          )}

          <h2 className="font-display text-3xl sm:text-4xl leading-none mb-4 text-white/70">
            Waiting queue
          </h2>
          <ol className="space-y-2">
            {waiting.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-card bg-white/5 px-4 py-3"
              >
                <span className="scoreboard-num text-2xl w-8 text-white/40">{i + 1}</span>
                <span className="flex-1 text-lg font-medium">{p.name}</span>
                <span className="text-xs font-mono text-white/40 whitespace-nowrap">
                  {formatWaitTime(p.checked_in_at, now)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-card border font-mono bg-transparent ${skillBadgeColor(
                    p.skill_level
                  )
                    .replace("text-court-dark", "text-white")
                    .replace("text-progress", "text-white")
                    .replace("text-ink", "text-white")}`}
                >
                  {p.skill_level}
                </span>
              </li>
            ))}
            {waiting.length === 0 && (
              <p className="text-white/40">No one in line.</p>
            )}
          </ol>

          {resting.length > 0 && (
            <>
              <h3 className="font-display text-2xl leading-none mt-6 mb-2 text-rest">
                Resting
              </h3>
              <ul className="space-y-1">
                {resting.map((p) => (
                  <li key={p.id} className="text-rest/90">
                    {p.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-court-dark text-surface flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-4xl mb-3">QueueUp PH</p>
        {children}
      </div>
    </div>
  );
}
