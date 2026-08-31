"use client";

import { useState } from "react";
import { SkillLevel } from "@/lib/types";

interface Props {
  onAdd: (name: string, skill: SkillLevel) => Promise<void>;
  onClose: () => void;
}

const SKILLS: SkillLevel[] = ["Beginner", "Novice", "Intermediate", "Advanced"];

export default function AddPlayerModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim() || !skill) return;
    setSaving(true);
    await onAdd(name.trim(), skill);
    setSaving(false);
    setName("");
    setSkill(null);
  }

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-end sm:items-center justify-center z-50 px-4">
      <div className="w-full max-w-md bg-white rounded-t-card sm:rounded-card p-6 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-3xl leading-none">Add player</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center text-2xl text-waiting"
          >
            Close
          </button>
        </div>

        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="tap-target w-full border-2 border-ink rounded-card px-4 text-lg mb-5 bg-surface"
        />

        <label className="block text-sm font-medium mb-2">Skill level</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSkill(s)}
              className={`tap-target rounded-card border-2 font-medium text-sm sm:text-base transition-colors ${
                skill === s
                  ? "bg-court text-white border-court"
                  : "border-ink/30 text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim() || !skill || saving}
          className="tap-target w-full bg-ink text-surface font-display text-2xl rounded-card disabled:opacity-40"
        >
          {saving ? "Adding..." : "Add to queue"}
        </button>
      </div>
    </div>
  );
}
