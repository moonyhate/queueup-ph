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
      className={`rounded-card border-2 p-4 ${
        inProgress ? "border-progress bg-progress/5" : "border-court bg-court/5"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-2xl leading-none">
          Court {court.court_number}
        </span>
        {inProgress ? (
          <span className="flex items-center gap-2 text-progress text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-progress inline-block" />
            In progress · <ElapsedTimer startedAt={court.started_at as string} />
          </span>
        ) : (
          <span className="flex items-center gap-2 text-court text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-court inline-block" />
            Open
          </span>
        )}
      </div>

      {!inProgress && (
        <p className="text-sm text-waiting py-4">
          {waitingCount < 4
            ? "Waiting for more players"
            : "Filling from the queue…"}
        </p>
      )}

      {inProgress && teamA && teamB && (
        <div className="space-y-2">
          <button
            onClick={() => onReportWinner(court, "A")}
            className="tap-target w-full flex items-center justify-between rounded-card border-2 border-ink/20 bg-white px-4 hover:border-court transition-colors"
          >
            <span className="text-left font-medium">
              {teamA.map((p) => p?.name).join(" & ")}
            </span>
            <span className="text-xs font-mono uppercase text-waiting">
              Team A wins
            </span>
          </button>
          <div className="text-center text-xs text-waiting font-mono">vs</div>
          <button
            onClick={() => onReportWinner(court, "B")}
            className="tap-target w-full flex items-center justify-between rounded-card border-2 border-ink/20 bg-white px-4 hover:border-court transition-colors"
          >
            <span className="text-left font-medium">
              {teamB.map((p) => p?.name).join(" & ")}
            </span>
            <span className="text-xs font-mono uppercase text-waiting">
              Team B wins
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
