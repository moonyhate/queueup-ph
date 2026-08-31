export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type PlayerStatus = "waiting" | "playing" | "resting" | "checked_out";

export interface Session {
  id: string;
  created_at: string;
  court_count: number;
  game_format: string;
  active: boolean;
}

export interface Player {
  id: string;
  session_id: string;
  name: string;
  skill_level: SkillLevel;
  status: PlayerStatus;
  checked_in_at: string;
  wins: number;
  games_played: number;
  court_id?: string | null;
}

export interface TeamPair {
  playerIds: string[];
}

export interface Court {
  id: string;
  session_id: string;
  court_number: number;
  status: "open" | "in_progress";
  team_a: TeamPair | null;
  team_b: TeamPair | null;
  started_at: string | null;
}

export interface MatchRecord {
  id: string;
  session_id: string;
  court_id: string;
  team_a: TeamPair;
  team_b: TeamPair;
  winner: "A" | "B" | null;
  ended_at: string | null;
}

export const SKILL_ORDER: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];

export const SKILL_RANK: Record<SkillLevel, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};
