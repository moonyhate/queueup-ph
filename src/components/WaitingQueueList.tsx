"use client";

import { useEffect, useState } from "react";
import { Player } from "@/lib/types";
import { skillBadgeColor } from "@/lib/matching";
import { formatWaitTime } from "@/lib/format";

interface Props {
  waiting: Player[];
  resting: Player[];
  onRest: (player: Player) => void;
  onResume: (player: Player) => void;
  onCheckout: (player: Player) => void;
}

export default function WaitingQueueList({
  waiting,
  resting,
  onRest,
  onResume,
  onCheckout,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h2 className="font-display text-3xl leading-none mb-3">
        Waiting queue
      </h2>
      {waiting.length === 0 && (
        <p className="text-sm text-waiting mb-4">
          No one&rsquo;s waiting. Add players to fill the line.
        </p>
      )}
      <ol className="space-y-2 mb-6">
        {waiting.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2"
          >
            <span className="scoreboard-num text-xl w-7 text-waiting">
              {i + 1}
            </span>
            <span className="flex-1 font-medium">{p.name}</span>
            <span className="text-xs font-mono text-waiting whitespace-nowrap">
              {formatWaitTime(p.checked_in_at, now)}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-card border font-mono ${skillBadgeColor(
                p.skill_level
              )}`}
            >
              {p.skill_level}
            </span>
            <button
              onClick={() => onRest(p)}
              className="text-xs font-mono uppercase text-rest border border-rest/50 rounded-card px-2 py-2 tap-target"
            >
              Rest
            </button>
            <button
              onClick={() => onCheckout(p)}
              className="text-xs font-mono uppercase text-waiting border border-waiting/40 rounded-card px-2 py-2 tap-target"
            >
              Out
            </button>
          </li>
        ))}
      </ol>

      {resting.length > 0 && (
        <>
          <h3 className="font-display text-2xl leading-none mb-3 text-rest">
            Resting
          </h3>
          <ul className="space-y-2">
            {resting.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-card border border-rest/40 bg-rest/5 px-3 py-2"
              >
                <span className="flex-1 font-medium">{p.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-card border font-mono ${skillBadgeColor(
                    p.skill_level
                  )}`}
                >
                  {p.skill_level}
                </span>
                <button
                  onClick={() => onResume(p)}
                  className="text-xs font-mono uppercase text-court border border-court/50 rounded-card px-3 py-2 tap-target"
                >
                  Back in
                </button>
                <button
                  onClick={() => onCheckout(p)}
                  className="text-xs font-mono uppercase text-waiting border border-waiting/40 rounded-card px-2 py-2 tap-target"
                >
                  Out
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
