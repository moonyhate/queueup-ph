"use client";

import { LayoutGrid, Users, Clock3 } from "lucide-react";

interface Props {
  courtsInPlay: number;
  courtsTotal: number;
  playersTotal: number;
  queueCount: number;
  dark?: boolean;
}

export default function StatsBar({
  courtsInPlay,
  courtsTotal,
  playersTotal,
  queueCount,
  dark = false,
}: Props) {
  const items = [
    { label: "Courts", value: `${courtsInPlay}/${courtsTotal}`, Icon: LayoutGrid },
    { label: "Players", value: playersTotal, Icon: Users },
    { label: "Queue", value: queueCount, Icon: Clock3 },
  ];

  if (dark) {
    return (
      <div className="flex items-center gap-5">
        {items.map(({ label, value, Icon }) => (
          <span key={label} className="flex items-center gap-2 text-white/60">
            <Icon size={15} strokeWidth={2} className="text-ball" />
            <span className="font-mono text-xs uppercase tracking-wide">{label}</span>
            <span className="scoreboard-num text-base normal-case text-white">
              {value}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white rounded-card shadow-sm border border-line overflow-hidden">
      {items.map(({ label, value, Icon }, i) => (
        <div
          key={label}
          className={`flex items-center gap-2 px-4 py-2.5 ${
            i > 0 ? "border-l border-line" : ""
          }`}
        >
          <Icon size={16} strokeWidth={2} className="text-court" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-waiting leading-none mb-0.5">
              {label}
            </p>
            <p className="scoreboard-num text-lg leading-none text-ink">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
