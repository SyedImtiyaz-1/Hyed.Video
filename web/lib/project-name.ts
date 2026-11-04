import { reelName } from "@/components/reels/labels";
import { hostOf } from "./format";

/**
 * A project's name: the one the customer gave it (Job.title, renamed in the editor's bar), else its source's: a reel's
 * file name (`fileName` when known, else the upload's name in `sourceUrl`), a video's website or repo.
 */
export function projectName(job: { title?: string | null; kind: string; sourceUrl: string }, fileName?: string | null): string {
  return job.title?.trim() || (job.kind === "reel" ? reelName(fileName ?? job.sourceUrl) : hostOf(job.sourceUrl));
}

/** The longest name a project can have. */
export const PROJECT_NAME_MAX = 80;
