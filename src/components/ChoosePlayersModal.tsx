"use client";

import { useState } from "react";
import { Player, Court } from "@/lib/types";
import { skillBadgeColor, splitIntoTeams } from "@/lib/matching";

interface Props {
  court: Court;
  waiting: Player[];
  onAssign: (court: Court, teamA: Player[], teamB: Player[]) => Promise<void>;
  onClose: () => void;
}

export default function ChoosePlayersModal({ court, waiting, onAssign, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
  }

  async function handleAssign() {
    if (selectedIds.length !== 4) return;
    const selected = waiting.filter((p) => selectedIds.includes(p.id));
    const [teamA, teamB] = splitIntoTeams(selected);
    setAssigning(true);
    await onAssign(court, teamA, teamB);
    setAssigning(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-white rounded-t-card sm:rounded-card p-6 pb-8 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-3xl leading-none">Choose players</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center text-2xl text-waiting"
          >
            Close
          </button>
        </div>
        <p className="text-sm text-waiting mb-4">
          For Court {court.court_number}. Pick exactly 4 -- teams are balanced
          automatically, strongest paired with weakest.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {waiting.map((p) => {
            const selected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                disabled={!selected && selectedIds.length >= 4}
                className={`tap-target w-full flex items-center gap-3 rounded-card border-2 px-3 text-left transition-colors ${
                  selected
                    ? "bg-court text-white border-court"
                    : "border-line disabled:opacity-40"
                }`}
              >
                <span className="flex-1 font-medium">{p.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-card border font-mono ${
                    selected ? "border-white/40 text-white" : skillBadgeColor(p.skill_level)
                  }`}
                >
                  {p.skill_level}
                </span>
              </button>
            );
          })}
          {waiting.length === 0 && (
            <p className="text-sm text-waiting">No one is waiting right now.</p>
          )}
        </div>

        <button
          onClick={handleAssign}
          disabled={selectedIds.length !== 4 || assigning}
          className="tap-target w-full bg-ink text-surface font-display text-2xl rounded-card disabled:opacity-40"
        >
          {assigning
            ? "Sending..."
            : `Send to Court ${court.court_number} (${selectedIds.length}/4)`}
        </button>
      </div>
    </div>
  );
}
