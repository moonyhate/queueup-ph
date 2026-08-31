"use client";

import { useState } from "react";

interface Props {
  initialCourtCount?: number;
  initialFormat?: string;
  onSave: (courtCount: number, format: string) => Promise<void>;
  isNew: boolean;
}

const FORMAT_PRESET = "Race to 11, win by 2";

export default function SessionSetup({
  initialCourtCount = 4,
  initialFormat = FORMAT_PRESET,
  onSave,
  isNew,
}: Props) {
  const [courtCount, setCourtCount] = useState(initialCourtCount);
  const [format, setFormat] = useState(initialFormat);
  const [saving, setSaving] = useState(false);

  return (
    <div className="border border-line rounded-card bg-white p-6 shadow-md">
      <p className="font-mono text-xs uppercase tracking-wide text-waiting mb-1">
        {isNew ? "New session" : "Session settings"}
      </p>
      <h2 className="font-display text-3xl leading-none mb-5">
        {isNew ? "Set up open play" : "Edit courts &amp; format"}
      </h2>

      <label className="block text-sm font-medium mb-2">Number of courts</label>
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => setCourtCount((c) => Math.max(1, c - 1))}
          className="tap-target w-14 border-2 border-ink rounded-card font-display text-2xl"
          aria-label="Fewer courts"
        >
          -
        </button>
        <span className="scoreboard-num text-4xl w-12 text-center">
          {courtCount}
        </span>
        <button
          type="button"
          onClick={() => setCourtCount((c) => Math.min(12, c + 1))}
          className="tap-target w-14 border-2 border-ink rounded-card font-display text-2xl"
          aria-label="More courts"
        >
          +
        </button>
      </div>

      <label className="block text-sm font-medium mb-2">Game format</label>
      <input
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="tap-target w-full border-2 border-ink rounded-card px-4 mb-2 bg-surface"
      />
      <p className="text-xs text-waiting mb-5">
        Default PH open-play rule: {FORMAT_PRESET}.
      </p>

      <p className="text-xs text-waiting mb-5 border-t border-line pt-4">
        Fee collection happens in person -- this app doesn&apos;t handle payments.
      </p>

      <button
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await onSave(courtCount, format);
          setSaving(false);
        }}
        className="tap-target w-full bg-court text-white font-display text-2xl rounded-card disabled:opacity-50"
      >
        {saving ? "Starting..." : isNew ? "Start session" : "Save changes"}
      </button>
    </div>
  );
}
