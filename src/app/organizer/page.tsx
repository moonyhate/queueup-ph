"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { isPinUnlocked, lockPin } from "@/lib/pin";
import { Court, Player, Session, SkillLevel } from "@/lib/types";
import { formNextMatch, previewNextMatches } from "@/lib/matching";
import PinGate from "@/components/PinGate";
import SessionSetup from "@/components/SessionSetup";
import AddPlayerModal from "@/components/AddPlayerModal";
import CourtCard from "@/components/CourtCard";
import ChoosePlayersModal from "@/components/ChoosePlayersModal";
import WaitingQueueList from "@/components/WaitingQueueList";
import RosterList from "@/components/RosterList";
import StatsBar from "@/components/StatsBar";
import UpNextPreview from "@/components/UpNextPreview";

export default function OrganizerPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    setUnlocked(isPinUnlocked());
    setCheckedStorage(true);
  }, []);

  if (!isSupabaseConfigured) {
    return <NotConfigured />;
  }

  if (!checkedStorage) return null;
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return <OrganizerDashboard onLock={() => { lockPin(); setUnlocked(false); }} />;
}

function NotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 text-center">
      <div>
        <h1 className="font-display text-3xl mb-2">Supabase isn&rsquo;t configured</h1>
        <p className="text-waiting max-w-sm">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
          your environment. See README.md.
        </p>
      </div>
    </div>
  );
}

function OrganizerDashboard({ onLock }: { onLock: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [showChoosePlayersFor, setShowChoosePlayersFor] = useState<Court | null>(null);
  const [sendingToCourt, setSendingToCourt] = useState(false);

  // ---- initial load ----
  useEffect(() => {
    (async () => {
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const active = sessions?.[0] ?? null;
      setSession(active);
      if (active) {
        await loadSessionData(active.id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSessionData(sessionId: string) {
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

  // ---- realtime subscriptions ----
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // In React 18 dev mode this effect can run twice in a row (StrictMode).
      // Remove any leftover channel on the same topic before subscribing again,
      // otherwise Supabase errors with "cannot add callbacks after subscribe()".
      const topic = `organizer-${session.id}`;
      const existing = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`);
      if (existing) await supabase.removeChannel(existing);
      if (cancelled) return;

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `session_id=eq.${session.id}` },
          () => loadSessionData(session.id)
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "courts", filter: `session_id=eq.${session.id}` },
          () => loadSessionData(session.id)
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const waiting = useMemo(
    () =>
      players
        .filter((p) => p.status === "waiting")
        .sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()),
    [players]
  );
  const resting = useMemo(() => players.filter((p) => p.status === "resting"), [players]);
  const notArrived = useMemo(
    () =>
      players
        .filter((p) => p.status === "not_arrived")
        .sort((a, b) => new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()),
    [players]
  );
  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const upNext = useMemo(() => previewNextMatches(waiting, 2), [waiting]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [checkinLinkCopied, setCheckinLinkCopied] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const openCourts = useMemo(
    () => courts.filter((c) => c.status === "open").sort((a, b) => a.court_number - b.court_number),
    [courts]
  );
  const firstOpenCourt = openCourts[0] ?? null;

  // ---- assign a specific match to a specific court ----
  async function assignMatchToCourt(court: Court, teamA: Player[], teamB: Player[]) {
    if (!session) return;
    setSendingToCourt(true);
    try {
      const startedAt = new Date().toISOString();
      await supabase
        .from("courts")
        .update({
          status: "in_progress",
          team_a: { playerIds: teamA.map((p) => p.id) },
          team_b: { playerIds: teamB.map((p) => p.id) },
          started_at: startedAt,
        })
        .eq("id", court.id);

      const allFour = [...teamA, ...teamB];
      await supabase
        .from("players")
        .update({ status: "playing", court_id: court.id })
        .in(
          "id",
          allFour.map((p) => p.id)
        );

      await loadSessionData(session.id);
    } finally {
      setSendingToCourt(false);
      setShowChoosePlayersFor(null);
    }
  }

  // ---- send the algorithm's next match to a specific court ----
  async function handleStartNext(court: Court) {
    const result = formNextMatch(waiting);
    if (!result) return;
    await assignMatchToCourt(court, result.teamA, result.teamB);
  }

  // ---- manually chosen players, sent to a specific court ----
  async function handleAssignChosen(court: Court, teamA: Player[], teamB: Player[]) {
    await assignMatchToCourt(court, teamA, teamB);
  }

  async function handleCreateSession(courtCount: number, format: string) {
    const { data, error } = await supabase
      .from("sessions")
      .insert({ court_count: courtCount, game_format: format, active: true })
      .select()
      .single();
    if (error || !data) return;

    const courtRows = Array.from({ length: courtCount }, (_, i) => ({
      session_id: data.id,
      court_number: i + 1,
      status: "open" as const,
      team_a: null,
      team_b: null,
      started_at: null,
    }));
    await supabase.from("courts").insert(courtRows);

    setSession(data);
    await loadSessionData(data.id);
  }

  async function handleEditSession(courtCount: number, format: string) {
    if (!session) return;
    await supabase
      .from("sessions")
      .update({ court_count: courtCount, game_format: format })
      .eq("id", session.id);

    const existingNumbers = new Set(courts.map((c) => c.court_number));
    const toAdd = [];
    for (let n = 1; n <= courtCount; n++) {
      if (!existingNumbers.has(n)) {
        toAdd.push({
          session_id: session.id,
          court_number: n,
          status: "open" as const,
          team_a: null,
          team_b: null,
          started_at: null,
        });
      }
    }
    if (toAdd.length) await supabase.from("courts").insert(toAdd);

    const removed = courts.filter((c) => c.court_number > courtCount && c.status === "open");
    if (removed.length) {
      await supabase
        .from("courts")
        .delete()
        .in("id", removed.map((c) => c.id));
    }

    setSession({ ...session, court_count: courtCount, game_format: format });
    setShowEditSession(false);
    await loadSessionData(session.id);
  }

  async function handleAddPlayer(name: string, skill: SkillLevel) {
    if (!session) return;
    await supabase.from("players").insert({
      session_id: session.id,
      name,
      skill_level: skill,
      status: "not_arrived",
      checked_in_at: new Date().toISOString(),
      wins: 0,
      games_played: 0,
    });
    setShowAddPlayer(false);
    await loadSessionData(session.id);
  }

  async function handleReportWinner(court: Court, winner: "A" | "B") {
    if (!session || !court.team_a || !court.team_b) return;
    const winningIds = winner === "A" ? court.team_a.playerIds : court.team_b.playerIds;
    const losingIds = winner === "A" ? court.team_b.playerIds : court.team_a.playerIds;
    const now = new Date().toISOString();

    await supabase.from("matches").insert({
      session_id: session.id,
      court_id: court.id,
      team_a: court.team_a,
      team_b: court.team_b,
      winner,
      ended_at: now,
    });

    for (const id of winningIds) {
      const p = playersById.get(id);
      if (!p) continue;
      await supabase
        .from("players")
        .update({
          status: "waiting",
          wins: p.wins + 1,
          games_played: p.games_played + 1,
          checked_in_at: now,
          court_id: null,
        })
        .eq("id", id);
    }
    for (const id of losingIds) {
      const p = playersById.get(id);
      if (!p) continue;
      await supabase
        .from("players")
        .update({
          status: "waiting",
          games_played: p.games_played + 1,
          checked_in_at: now,
          court_id: null,
        })
        .eq("id", id);
    }

    await supabase
      .from("courts")
      .update({ status: "open", team_a: null, team_b: null, started_at: null })
      .eq("id", court.id);

    await loadSessionData(session.id);
  }

  async function handleCheckIn(player: Player) {
    await supabase
      .from("players")
      .update({ status: "waiting", checked_in_at: new Date().toISOString() })
      .eq("id", player.id);
    if (session) await loadSessionData(session.id);
  }

  async function handleCheckInAll() {
    if (!session) return;
    // Stagger checked_in_at by a few ms per player so they keep the same
    // relative queue order they had on the roster, rather than tying.
    const now = Date.now();
    await Promise.all(
      notArrived.map((p, i) =>
        supabase
          .from("players")
          .update({
            status: "waiting",
            checked_in_at: new Date(now + i).toISOString(),
          })
          .eq("id", p.id)
      )
    );
    await loadSessionData(session.id);
  }

  async function handleRest(player: Player) {
    await supabase.from("players").update({ status: "resting" }).eq("id", player.id);
    if (session) await loadSessionData(session.id);
  }
  async function handleResume(player: Player) {
    // Preserve original place in line -- checked_in_at is left untouched.
    await supabase.from("players").update({ status: "waiting" }).eq("id", player.id);
    if (session) await loadSessionData(session.id);
  }
  async function handleCheckout(player: Player) {
    await supabase.from("players").update({ status: "checked_out" }).eq("id", player.id);
    if (session) await loadSessionData(session.id);
  }

  async function handleCopyQueueLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/queue`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard access can fail (e.g. no HTTPS in some dev setups) -- no-op.
    }
  }

  async function handleCopyCheckinLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/checkin`;
    try {
      await navigator.clipboard.writeText(url);
      setCheckinLinkCopied(true);
      setTimeout(() => setCheckinLinkCopied(false), 2000);
    } catch {
      // Clipboard access can fail (e.g. no HTTPS in some dev setups) -- no-op.
    }
  }

  async function handleEndSession() {
    if (!session) return;
    await supabase.from("sessions").update({ active: false }).eq("id", session.id);
    setSession(null);
    setPlayers([]);
    setCourts([]);
    setShowEndConfirm(false);
  }

  if (loading) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface px-4 py-10 flex justify-center">
        <div className="w-full max-w-md">
          <Header onLock={onLock} />
          <SessionSetup isNew onSave={handleCreateSession} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-6 max-w-2xl mx-auto pb-28">
      <Header onLock={onLock} />

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-waiting">
            {session.game_format}
          </p>
          <h1 className="font-display text-4xl leading-none">Session control</h1>
        </div>
        <button
          onClick={() => setShowEditSession((s) => !s)}
          className="text-xs font-mono uppercase border border-ink/30 rounded-card px-3 py-2 tap-target bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          {showEditSession ? "Close" : "Edit"}
        </button>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <StatsBar
          courtsInPlay={courts.filter((c) => c.status === "in_progress").length}
          courtsTotal={courts.length}
          playersTotal={players.filter((p) => p.status !== "checked_out").length}
          queueCount={waiting.length}
        />
        <div className="flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="text-xs font-mono uppercase border border-ink/30 rounded-card px-3 py-2 tap-target flex items-center bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            Leaderboard
          </Link>
          <button
            onClick={handleCopyQueueLink}
            className="text-xs font-mono uppercase border border-ink/30 rounded-card px-3 py-2 tap-target bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {linkCopied ? "Copied!" : "Share queue link"}
          </button>
          <button
            onClick={handleCopyCheckinLink}
            className="text-xs font-mono uppercase border border-court/50 text-court rounded-card px-3 py-2 tap-target bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {checkinLinkCopied ? "Copied!" : "Check-in link"}
          </button>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="text-xs font-mono uppercase border border-red-700/40 text-red-700 rounded-card px-3 py-2 tap-target bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            End session
          </button>
        </div>
      </div>

      {showEndConfirm && (
        <div className="mb-6 rounded-card border-2 border-red-700/40 bg-red-50 p-4">
          <p className="font-medium mb-3">
            End this session? The queue, courts, and leaderboard will stop updating.
            You can always start a new session afterward.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEndSession}
              className="tap-target flex-1 bg-red-700 text-white rounded-card font-mono text-xs uppercase"
            >
              End session
            </button>
            <button
              onClick={() => setShowEndConfirm(false)}
              className="tap-target flex-1 border-2 border-ink/20 rounded-card font-mono text-xs uppercase"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEditSession && (
        <div className="mb-6">
          <SessionSetup
            isNew={false}
            initialCourtCount={session.court_count}
            initialFormat={session.game_format}
            onSave={handleEditSession}
          />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            playersById={playersById}
            onReportWinner={handleReportWinner}
            onStartNext={handleStartNext}
            onChoosePlayers={(c) => setShowChoosePlayersFor(c)}
            waitingCount={waiting.length}
          />
        ))}
      </div>

      <RosterList
        notArrived={notArrived}
        onCheckIn={handleCheckIn}
        onCheckInAll={handleCheckInAll}
        onRemove={handleCheckout}
      />

      {upNext.length > 0 && (
        <div className="mb-8">
          <UpNextPreview
            previews={upNext}
            openCourtNumber={firstOpenCourt?.court_number}
            onSendToCourt={
              firstOpenCourt ? () => handleStartNext(firstOpenCourt) : undefined
            }
            sending={sendingToCourt}
          />
        </div>
      )}

      <WaitingQueueList
        waiting={waiting}
        resting={resting}
        onRest={handleRest}
        onResume={handleResume}
        onCheckout={handleCheckout}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur border-t border-line">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setShowAddPlayer(true)}
            className="tap-target flex-1 bg-ink text-surface font-display text-2xl rounded-card shadow-lg hover:shadow-xl transition-shadow"
          >
            + Add player
          </button>
          <Link
            href="/queue"
            className="tap-target px-5 flex items-center justify-center border-2 border-ink rounded-card font-mono text-xs uppercase"
          >
            View queue screen
          </Link>
        </div>
      </div>

      {showAddPlayer && (
        <AddPlayerModal onAdd={handleAddPlayer} onClose={() => setShowAddPlayer(false)} />
      )}

      {showChoosePlayersFor && (
        <ChoosePlayersModal
          court={showChoosePlayersFor}
          waiting={waiting}
          onAssign={handleAssignChosen}
          onClose={() => setShowChoosePlayersFor(null)}
        />
      )}
    </div>
  );
}

function Header({ onLock }: { onLock: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <span className="font-display text-lg tracking-tight">QueueUp PH</span>
      <button
        onClick={onLock}
        className="text-xs font-mono uppercase text-waiting"
      >
        Lock
      </button>
    </div>
  );
}
