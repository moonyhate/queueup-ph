"use client";

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
    { label: "Courts", value: `${courtsInPlay}/${courtsTotal}` },
    { label: "Players", value: playersTotal },
    { label: "Queue", value: queueCount },
  ];

  if (dark) {
    return (
      <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-wide">
        {items.map((item) => (
          <span key={item.label} className="text-white/60">
            {item.label}{" "}
            <span className="scoreboard-num text-base normal-case text-ball">
              {item.value}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white rounded-card shadow-sm border border-line overflow-hidden">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`px-4 py-2 text-center ${i > 0 ? "border-l border-line" : ""}`}
        >
          <p className="font-mono text-[10px] uppercase tracking-wide text-waiting">
            {item.label}
          </p>
          <p className="scoreboard-num text-xl text-court">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
