// The agent's review of its own video: hyped-review writes brag-output/review.json (schema in
// runner/skills/hyped-review/SKILL.md). Only what the job result and the measurements need is kept, and a missing or
// malformed file is simply no review: it never fails a job.
import type { VideoReview } from "@launchreel/core/contract";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readReview(outputDir: string | undefined): VideoReview | null {
  if (!outputDir) return null;
  try {
    const raw = JSON.parse(readFileSync(join(outputDir, "review.json"), "utf8")) as Record<string, unknown>;
    const { score, passed, hardFails, rounds } = raw;
    if (typeof score !== "number" || !Number.isFinite(score) || typeof passed !== "boolean") return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      passed,
      hardFails: Array.isArray(hardFails) ? hardFails.filter((h): h is string => typeof h === "string").map((h) => h.slice(0, 40)).slice(0, 20) : [],
      rounds: typeof rounds === "number" && Number.isInteger(rounds) && rounds >= 1 ? Math.min(rounds, 9) : 1,
    };
  } catch {
    return null;
  }
}

/** One line for the job's log. */
export const reviewLine = (r: VideoReview | null) =>
  r ? `review score=${r.score} passed=${r.passed} rounds=${r.rounds} hardFails=${r.hardFails.join("|") || "none"}` : "review none";
