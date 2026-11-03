/**
 * Cheap checks before any AI tokens are spent: a failed render still costs real money,
 * so anything we can reject up front for free, we do.
 */
import { parseGithubSource } from "@launchreel/core/github";

/**
 * Whether GitHub shows the repo publicly. Without a token, GitHub answers 404 for both private and missing
 * repos ("hidden"). "unknown" means GitHub didn't say (rate limits are common on shared IPs).
 */
export async function githubVisibility(url: string): Promise<"public" | "hidden" | "unknown"> {
  try {
    const [, owner, repo] = new URL(url).pathname.split("/");
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo?.replace(/\.git$/, "")}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "launch-video-preflight" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return "hidden";
    if (res.ok) return ((await res.json()) as { private?: boolean }).private ? "hidden" : "public";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * For a public repo's pull request, release or comparison: a reason to reject the link when GitHub says what it names
 * isn't there, or null to go ahead (also when GitHub doesn't answer: the render reports it then). One or two small
 * unauthenticated calls.
 */
export async function githubChangeProblem(url: string): Promise<string | null> {
  const source = parseGithubSource(url);
  const change = source?.change;
  if (!source || !change) return null;
  const exists = async (path: string, accept = "application/vnd.github+json") => {
    try {
      const res = await fetch(`https://api.github.com/repos/${source.slug}/${path}`, {
        headers: { accept, "user-agent": "launch-video-preflight" },
        signal: AbortSignal.timeout(6000),
      });
      return res.status === 404 || res.status === 422 ? false : true; // anything else: not a "no"
    } catch {
      return true;
    }
  };
  if (change.kind === "pull") {
    return (await exists(`pulls/${change.number}`)) ? null : `We couldn't find pull request #${change.number} in ${source.slug}. Check the link.`;
  }
  if (change.kind === "release") {
    return (await exists(`git/ref/tags/${encodeURIComponent(change.tag)}`)) ? null : `We couldn't find the tag ${change.tag} in ${source.slug}. Check the link.`;
  }
  for (const ref of [change.base, change.head]) {
    if (ref && !(await exists(`commits/${encodeURIComponent(ref)}`, "application/vnd.github.sha"))) return `We couldn't find ${ref} in ${source.slug}. Check the link.`;
  }
  return null;
}

/** A reason to reject a website up front, or null to go ahead. */
export async function websiteProblem(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10_000), headers: { "user-agent": "Mozilla/5.0 (compatible; launch-video-preflight)" } });
    if (res.status === 404 || res.status === 410) return `That page returned ${res.status}. Check the URL.`;
    if (res.status >= 500) return `That site is returning errors (${res.status}). Try again when it's back up.`;
    return null; // 2xx/3xx, or 401/403 bot protection the real browser may pass
  } catch {
    return "We couldn't reach that site. Check the URL, or try again in a minute.";
  }
}
