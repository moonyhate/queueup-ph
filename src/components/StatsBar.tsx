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

  return (
    <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-wide">
      {items.map((item) => (
        <span key={item.label} className={dark ? "text-white/60" : "text-waiting"}>
          {item.label}{" "}
          <span
            className={`scoreboard-num text-base normal-case ${
              dark ? "text-ball" : "text-court"
            }`}
          >
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}
