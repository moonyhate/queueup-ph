import { Player, SKILL_RANK, SkillLevel } from "./types";

export interface MatchResult {
  teamA: Player[];
  teamB: Player[];
  /** The waiting queue with the 4 matched players removed, in original order. */
  remainingQueue: Player[];
}

/**
 * Forms the next 2v2 match from a waiting queue that is already sorted
 * oldest-check-in-first (index 0 = longest waiting).
 *
 * Rules (per QueueUp PH spec):
 * 1. Always start from the 4 longest-waiting players.
 * 2. If those 4 span all three skill tiers, try tightening the range by
 *    swapping the newest of the four with a player later in line — but
 *    never reach more than 2 positions past the original group of 4
 *    (fairness beats perfect skill balance).
 * 3. Split into teams by pairing best + weakest vs. the middle two, so
 *    matches are competitive rather than stacked.
 * 4. Fewer than 4 waiting players -> no match can form yet.
 */
export function formNextMatch(waitingQueue: Player[]): MatchResult | null {
  if (waitingQueue.length < 4) return null;

  const queue = [...waitingQueue];
  let group = queue.slice(0, 4);
  const rest = queue.slice(4);

  if (spansAllTiers(group)) {
    const MAX_LOOKAHEAD = 2; // never skip more than 2 positions into the line
    const newestIndex = 3; // the most-recently-queued of the current 4
    let bestSwapAt = -1;
    let bestSpread = tierSpread(group);

    for (let i = 0; i < Math.min(MAX_LOOKAHEAD, rest.length); i++) {
      const trial = [...group];
      trial[newestIndex] = rest[i];
      const spread = tierSpread(trial);
      if (spread < bestSpread) {
        bestSpread = spread;
        bestSwapAt = i;
      }
    }

    if (bestSwapAt >= 0) {
      const displaced = group[newestIndex];
      group[newestIndex] = rest[bestSwapAt];
      // Put the displaced player back where the swapped-in player was,
      // preserving everyone else's relative order in the line.
      rest[bestSwapAt] = displaced;
    }
  }

  const remainingQueue = rest;
  const [teamA, teamB] = splitIntoTeams(group);

  return { teamA, teamB, remainingQueue };
}

function spansAllTiers(players: Player[]): boolean {
  const tiers = new Set(players.map((p) => p.skill_level));
  return tiers.size >= 3;
}

/** Highest tier rank minus lowest tier rank among the group; 0 = all same tier. */
function tierSpread(players: Player[]): number {
  const ranks = players.map((p) => SKILL_RANK[p.skill_level]);
  return Math.max(...ranks) - Math.min(...ranks);
}

/** Best + weakest vs. the middle two, so games stay competitive. */
function splitIntoTeams(group: Player[]): [Player[], Player[]] {
  const sorted = [...group].sort(
    (a, b) => SKILL_RANK[b.skill_level] - SKILL_RANK[a.skill_level]
  );
  const [best, second, third, weakest] = sorted;
  const teamA = [best, weakest];
  const teamB = [second, third];
  return [teamA, teamB];
}

/**
 * Pure preview of the next N matches that *would* form from this queue,
 * without mutating anything or touching the database. Used to show an
 * "Up next" panel so the organizer and players can see what's coming
 * before a court actually frees up.
 */
export function previewNextMatches(waitingQueue: Player[], count: number): MatchResult[] {
  const previews: MatchResult[] = [];
  let remaining = waitingQueue;
  for (let i = 0; i < count; i++) {
    const result = formNextMatch(remaining);
    if (!result) break;
    previews.push(result);
    remaining = result.remainingQueue;
  }
  return previews;
}

export function skillBadgeColor(skill: SkillLevel): string {
  switch (skill) {
    case "Beginner":
      return "bg-court-light/20 text-court-dark border-court-light";
    case "Intermediate":
      return "bg-progress/10 text-progress border-progress/40";
    case "Advanced":
      return "bg-ink/10 text-ink border-ink/40";
  }
}
