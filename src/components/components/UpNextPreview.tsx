"use client";

import { MatchResult } from "@/lib/matching";
import { skillBadgeColor } from "@/lib/matching";

interface Props {
  previews: MatchResult[];
  dark?: boolean;
}

export default function UpNextPreview({ previews, dark = false }: Props) {
  if (previews.length === 0) return null;

  return (
    <div>
      <h3
        className={`font-display text-2xl leading-none mb-3 ${
          dark ? "text-white/70" : "text-ink"
        }`}
      >
        Up next
      </h3>
      <div className="space-y-3">
        {previews.map((match, i) => (
          <div
            key={i}
            className={`rounded-card border-2 p-4 ${
              i === 0
                ? dark
                  ? "border-ball bg-ball/10"
                  : "border-court bg-court/5"
                : dark
                ? "border-white/10 bg-white/5"
                : "border-line bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-mono uppercase ${
                  dark ? "text-white/40" : "text-waiting"
                }`}
              >
                {i === 0 ? "As soon as a court opens" : `Then, match ${i + 1}`}
              </span>
            </div>
            <div className={`text-sm space-y-1 ${dark ? "text-white" : "text-ink"}`}>
              <TeamLine players={match.teamA} dark={dark} />
              <p className={`font-mono text-xs ${dark ? "text-white/30" : "text-waiting"}`}>
                vs
              </p>
              <TeamLine players={match.teamB} dark={dark} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamLine({
  players,
  dark,
}: {
  players: { name: string; skill_level: "Beginner" | "Intermediate" | "Advanced" }[];
  dark: boolean;
}) {
  return (
    <p className="flex flex-wrap items-center gap-2">
      {players.map((p) => (
        <span key={p.name} className="inline-flex items-center gap-1.5">
          <span className="font-medium">{p.name}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-card border font-mono ${
              dark
                ? "border-white/20 text-white/50"
                : skillBadgeColor(p.skill_level)
            }`}
          >
            {p.skill_level[0]}
          </span>
        </span>
      ))}
    </p>
  );
}
