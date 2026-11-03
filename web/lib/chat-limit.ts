// Ask AI is free, but not unlimited: per person, in each Worker instance (a best-effort guard against loops). Chat edits
// and Ask AI before a clip count together.
const WINDOW_MS = 10 * 60_000;
const PER_WINDOW = 30;
const recent = new Map<string, number[]>();

/** Whether this person may ask once more now (and counts it when they may). */
export function chatAllowed(userId: string) {
  const now = Date.now();
  const times = (recent.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_WINDOW) return false;
  recent.set(userId, [...times, now]);
  return true;
}
