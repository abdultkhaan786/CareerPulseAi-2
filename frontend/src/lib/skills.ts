import type { Job, SkillDemand } from "./types";

export const norm = (s: string) => s.trim().toLowerCase();

export const skillSet = (skills: string[]) => new Set(skills.map(norm));

/** Share of a job's listed skills the user has (0..1), or null when the job lists none. */
export function matchScore(jobSkills: string[], userSkills: string[] | Set<string>): number | null {
  if (!jobSkills.length) return null;
  const have = userSkills instanceof Set ? userSkills : skillSet(userSkills);
  return jobSkills.filter(s => have.has(norm(s))).length / jobSkills.length;
}

export function splitSkills(jobSkills: string[], userSkills: string[]) {
  const have = skillSet(userSkills);
  return {
    matched: jobSkills.filter(s => have.has(norm(s))),
    missing: jobSkills.filter(s => !have.has(norm(s)))
  };
}

export const STRONG_MATCH = 0.7;

export type MatchTone = "strong" | "partial" | "low" | "none";
export function matchTone(score: number | null): MatchTone {
  if (score === null) return "none";
  if (score >= STRONG_MATCH) return "strong";
  if (score >= 0.4) return "partial";
  return "low";
}

/** Share of all skill requests across listings that the user's skills cover. */
export function demandCoverage(skills: SkillDemand[], userSkills: string[]) {
  const have = skillSet(userSkills);
  const total = skills.reduce((a, s) => a + s.demand, 0);
  const covered = skills.filter(s => have.has(norm(s.skill))).reduce((a, s) => a + s.demand, 0);
  return { total, covered, ratio: total ? covered / total : 0 };
}

/**
 * For each missing skill: how many jobs would become strong matches (>= 70%)
 * if the user added just that skill.
 */
export function unlocksBySkill(jobs: Job[], userSkills: string[]) {
  const have = skillSet(userSkills);
  const result = new Map<string, number>();
  for (const job of jobs) {
    if (!job.skills.length) continue;
    const hit = job.skills.filter(s => have.has(norm(s))).length;
    if (hit / job.skills.length >= STRONG_MATCH) continue;
    for (const s of job.skills) {
      const k = norm(s);
      if (have.has(k)) continue;
      if ((hit + 1) / job.skills.length >= STRONG_MATCH) result.set(k, (result.get(k) || 0) + 1);
    }
  }
  return result;
}

/** Skills that appear in the same listings as `skill`, most frequent first. */
export function relatedSkills(jobs: Job[], skill: string) {
  const target = norm(skill);
  const counts = new Map<string, { skill: string; count: number }>();
  let listings = 0;
  for (const job of jobs) {
    if (!job.skills.some(s => norm(s) === target)) continue;
    listings++;
    for (const s of job.skills) {
      const k = norm(s);
      if (k === target) continue;
      const cur = counts.get(k) || { skill: s, count: 0 };
      cur.count++;
      counts.set(k, cur);
    }
  }
  return { listings, related: [...counts.values()].sort((a, b) => b.count - a.count) };
}

export function countBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  items.forEach(i => {
    const k = key(i) || "Unspecified";
    map.set(k, (map.get(k) || 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
