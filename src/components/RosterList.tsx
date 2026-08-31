"use client";

import { useState } from "react";
import { Player } from "@/lib/types";
import { skillBadgeColor } from "@/lib/matching";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  notArrived: Player[];
  onCheckIn: (player: Player) => void;
  onCheckInAll: () => void;
  onRemove: (player: Player) => void;
}

export default function RosterList({
  notArrived,
  onCheckIn,
  onCheckInAll,
  onRemove,
}: Props) {
  const [confirming, setConfirming] = useState<Player | null>(null);

  if (notArrived.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-3xl leading-none">
          Not yet here ({notArrived.length})
        </h2>
        <button
          onClick={onCheckInAll}
          className="text-xs font-mono uppercase bg-court text-white rounded-card px-3 py-2 tap-target shadow-sm hover:shadow-md transition-shadow"
        >
          Check in all
        </button>
      </div>
      <ul className="space-y-2">
        {notArrived.map((p) => (
          <li
            key={p.id}
            className="rounded-card border border-line bg-white shadow-sm px-3 py-3"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="flex-1 font-medium">{p.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded-card border font-mono ${skillBadgeColor(
                  p.skill_level
                )}`}
              >
                {p.skill_level}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onCheckIn(p)}
                className="tap-target flex-1 bg-court text-white font-mono text-xs uppercase rounded-card"
              >
                Check in
              </button>
              <button
                onClick={() => setConfirming(p)}
                className="text-xs font-mono uppercase text-red-700 border border-red-700/30 rounded-card px-3 tap-target"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {confirming && (
        <ConfirmDialog
          title={`Remove ${confirming.name}?`}
          message="They'll be taken off the roster entirely. This can't be undone."
          confirmLabel="Remove"
          onConfirm={() => {
            onRemove(confirming);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
