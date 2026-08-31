"use client";

import { useEffect, useState } from "react";

export default function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() => tick(startedAt));

  useEffect(() => {
    const id = setInterval(() => setElapsed(tick(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="scoreboard-num tabular-nums">{elapsed}</span>;
}

function tick(startedAt: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  );
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
