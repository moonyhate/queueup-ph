"use client";

import { Court, Player } from "@/lib/types";
import ElapsedTimer from "./ElapsedTimer";

interface Props {
  court: Court;
  playersById: Map<string, Player>;
  onReportWinner: (court: Court, winner: "A" | "B") => void;
  waitingCount: number;
}

export default function CourtCard({
  court,
  playersById,
  onReportWinner,
  waitingCount,
}: Props) {
  const inProgress = court.status === "in_progress";
  const teamA = court.team_a?.playerIds.map((id) => playersById.get(id));
  const teamB = court.team_b?.playerIds.map((id) => playersById.get(id));

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
        <p className="text-sm text-waiting py-8 px-4 text-center">
          {waitingCount < 4
            ? "Waiting for more players"
            : "Filling from the queue..."}
        </p>
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
            <span className="flex-1 px-3 py-3 font-medium leading-snug">
              {teamA.map((p) => p?.name).join(" & ")}
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
            <span className="flex-1 px-3 py-3 font-medium leading-snug">
              {teamB.map((p) => p?.name).join(" & ")}
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
