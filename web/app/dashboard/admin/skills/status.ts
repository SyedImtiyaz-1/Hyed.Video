import type { BadgeTone } from "@/components/ui/badge";

/** Each version status's badge colour on the skills pages. */
export const STATUS_TONE: Record<string, BadgeTone> = { draft: "gray", tested: "blue", candidate: "amber", live: "green", retired: "gray" };

/** A size in KB, one decimal under 10. */
export const kb = (bytes: number) => `${bytes < 10_000 ? (bytes / 1000).toFixed(1) : Math.round(bytes / 1000)} KB`;
