"use client";

import { Court, Player } from "@/lib/types";
import { skillBadgeColor } from "@/lib/matching";
import ElapsedTimer from "./ElapsedTimer";

interface Props {
  court: Court;
  playersById: Map<string, Player>;
  onReportWinner: (court: Court, winner: "A" | "B") => void;
  onStartNext: (court: Court) => void;
  onChoosePlayers: (court: Court) => void;
  waitingCount: number;
  busy?: boolean;
}

export default function CourtCard({
  court,
  playersById,
  onReportWinner,
  onStartNext,
  onChoosePlayers,
  waitingCount,
  busy = false,
}: Props) {
  const inProgress = court.status === "in_progress";
  const teamA = court.team_a?.playerIds
    .map((id) => playersById.get(id))
    .filter((p): p is Player => Boolean(p));
  const teamB = court.team_b?.playerIds
    .map((id) => playersById.get(id))
    .filter((p): p is Player => Boolean(p));
  const canStart = waitingCount >= 4;

  return (
    <div
      className={`card-lift rounded-card overflow-hidden border-2 shadow-md bg-white ${
        inProgress ? "border-progress" : "border-court"
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 ${
          inProgress ? "bg-progress text-white" : "bg-court text-white"
        }`}
      >
        <span className="font-display text-2xl leading-none">
          Court {court.court_number}
        </span>
        {inProgress ? (
          <span className="flex items-center gap-2 text-sm font-mono">
            <span className="live-dot w-2 h-2 rounded-full bg-white inline-block" />
            <ElapsedTimer startedAt={court.started_at as string} />
          </span>
        ) : (
          <span className="text-xs font-mono uppercase tracking-wide">Open</span>
        )}
      </div>

      {!inProgress && (
        <div className="p-4">
          {!canStart ? (
            <p className="text-sm text-waiting py-8 text-center">
              Waiting for more players
            </p>
          ) : (
            <div className="space-y-2 py-2">
              <button
                onClick={() => onStartNext(court)}
                disabled={busy}
                className="tap-target w-full bg-court text-white font-display text-xl rounded-card shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
              >
                Start next match
              </button>
              <button
                onClick={() => onChoosePlayers(court)}
                disabled={busy}
                className="tap-target w-full border-2 border-ink/20 text-ink font-mono text-xs uppercase rounded-card disabled:opacity-50"
              >
                Choose players
              </button>
            </div>
          )}
        </div>
      )}

      {inProgress && teamA && teamB && (
        <div className="grid grid-cols-2">
          <button
            onClick={() => onReportWinner(court, "A")}
            className="tap-target flex flex-col items-stretch text-left border-r border-line hover:bg-progress/5 transition-colors"
          >
            <span className="bg-progress/15 text-progress font-mono text-[10px] uppercase tracking-wide px-3 py-1.5">
              Team A
            </span>
            <span className="flex-1 px-3 py-3 space-y-1.5">
              {teamA.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5">
                  <span className="font-medium">{p.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-card border font-mono ${skillBadgeColor(
                      p.skill_level
                    )}`}
                  >
                    {p.skill_level}
                  </span>
                </span>
              ))}
            </span>
            <span className="px-3 pb-3 text-xs font-mono uppercase text-progress">
              Tap if they win
            </span>
          </button>
          <button
            onClick={() => onReportWinner(court, "B")}
            className="tap-target flex flex-col items-stretch text-left hover:bg-rest/10 transition-colors"
          >
            <span className="bg-rest/20 text-rest font-mono text-[10px] uppercase tracking-wide px-3 py-1.5">
              Team B
            </span>
            <span className="flex-1 px-3 py-3 space-y-1.5">
              {teamB.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5">
                  <span className="font-medium">{p.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-card border font-mono ${skillBadgeColor(
                      p.skill_level
                    )}`}
                  >
                    {p.skill_level}
                  </span>
                </span>
              ))}
            </span>
            <span className="px-3 pb-3 text-xs font-mono uppercase text-rest">
              Tap if they win
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
