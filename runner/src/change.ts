// A GitHub change in a public repo (a pull request, a release or a comparison), made ready for the agent: the repo
// checked out at the change's head with enough history to diff it against where it started, and what the agent needs
// to know about it in .hyped/change.json and .hyped/change.diff. Private repos get the same two files from the render
// Worker instead (fetchChangeFacts, with the customer's token), next to a download of the head.
//
// git does the heavy lifting (history, files, diff), so a public change costs at most one unauthenticated call to
// GitHub's API (60 an hour per address): for the title, description, author and dates. Without it the change is still
// checked out and diffed, and change.json says what's missing.
import { execFileSync } from "node:child_process";
import { closeSync, openSync, readSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  capCommits,
  changeFiles,
  changeStub,
  describeChange,
  factsFromPull,
  factsFromRelease,
  isNoisyPath,
  NOISE_PATHSPECS,
  previousTag,
  previousTagFromNotes,
  sortFiles,
  CHANGE_DIFF_MAX,
  type ApiPull,
  type ApiRelease,
  type ChangeFacts,
  type ChangeFile,
  type GithubSource,
} from "@launchreel/core/github";

const STATUS: Record<string, ChangeFile["status"]> = { A: "added", M: "modified", D: "removed", R: "renamed", C: "copied" };

/** One unauthenticated GitHub API call; null (and a note saying why) when GitHub doesn't answer. */
async function publicApi<T>(path: string, notes: string[], missing: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "hyped-runner" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return (await res.json()) as T;
    notes.push(res.status === 404 ? missing : `GitHub's API didn't answer (status ${res.status}, often its hourly limit): the title, description, author and dates are missing. Read the commits and the diff.`);
  } catch {
    notes.push("GitHub's API couldn't be reached: the title, description, author and dates are missing. Read the commits and the diff.");
  }
  return null;
}

/**
 * Clones the change's repo into `workdir` (empty), checked out at the change's head, and returns change.json and the
 * diff for the caller to write once the workspace is cleaned. Throws when the change itself can't be fetched.
 */
export async function cloneChange(workdir: string, source: GithubSource, link: string): Promise<{ json: string; diff: string }> {
  const change = source.change;
  if (!change) throw new Error("Not a GitHub change link");
  // Never prompt for a password (a private or missing repo fails at once), and never run the repo's diff drivers.
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  const git = (args: string[], stdout?: number) =>
    String(execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: workdir, env, timeout: 5 * 60_000, maxBuffer: 64 << 20, stdio: ["ignore", stdout ?? "pipe", "pipe"] }) ?? "").trim();
  const tryGit = (args: string[]) => {
    try {
      return git(args);
    } catch {
      return null;
    }
  };
  const unreachable = `GitHub change: We couldn't get ${describeChange(source)} from GitHub. Check that the link is right and the repository is public.`;

  git(["init", "-q"]);
  git(["remote", "add", "origin", `${source.url}.git`]);
  // The first call to GitHub: is the repo there and public, and what's its default branch?
  const remoteHead = tryGit(["ls-remote", "--symref", "origin", "HEAD"]);
  if (remoteHead === null) throw new Error(unreachable);
  const defaultBranch = () => remoteHead.match(/^ref: refs\/heads\/(\S+)\s+HEAD/m)?.[1] ?? "main";
  const notes: string[] = [];
  let facts: ChangeFacts = changeStub(source, link, "git");
  let headSpec: string;
  let baseSpec: string | null;
  let depth = 100;

  if (change.kind === "pull") {
    const pr = await publicApi<ApiPull>(`/repos/${source.slug}/pulls/${change.number}`, notes, "GitHub's API doesn't show this pull request: the title, description and author are missing.");
    if (pr) facts = factsFromPull(source, link, pr, "git");
    headSpec = `+refs/pull/${change.number}/head:refs/hyped/head`;
    // The base branch as it was (GitHub's base.sha); without the API, the default branch.
    baseSpec = pr ? `+${pr.base.sha}:refs/hyped/base` : `+refs/heads/${defaultBranch()}:refs/hyped/base`;
    depth = Math.min((pr?.commits ?? 50) + 20, 300);
  } else if (change.kind === "release") {
    const tags = git(["ls-remote", "--tags", "--refs", "origin"])
      .split("\n")
      .map((line) => line.split("\trefs/tags/")[1])
      .filter(Boolean);
    if (!tags.includes(change.tag)) throw new Error(`GitHub change: The tag ${change.tag} isn't in ${source.slug}. Check the release link.`);
    const release = await publicApi<ApiRelease>(
      `/repos/${source.slug}/releases/tags/${encodeURIComponent(change.tag)}`,
      notes,
      "There's no GitHub release for this tag, only the tag: there are no release notes.",
    );
    if (release) facts = factsFromRelease(source, link, release, "git");
    const fromNotes = previousTagFromNotes(change.tag, facts.body);
    const previous = fromNotes && tags.includes(fromNotes) ? fromNotes : previousTag(change.tag, tags);
    facts.previousTag = previous;
    facts.base.ref = previous;
    headSpec = `+refs/tags/${change.tag}:refs/hyped/head`;
    baseSpec = previous ? `+refs/tags/${previous}:refs/hyped/base` : null;
  } else {
    const base = change.base ?? defaultBranch();
    facts.title = `${base}...${change.head}`;
    facts.base.ref = base;
    headSpec = `+${change.head}:refs/hyped/head`;
    baseSpec = `+${base}:refs/hyped/base`;
  }

  // Commits and trees only (blobs come when checked out or diffed), so deepening to find the base stays cheap.
  const gitFetch = (specs: string[], how: string) => git(["fetch", "-q", "--no-tags", "--filter=blob:none", how, "origin", ...specs]);
  try {
    gitFetch([headSpec], `--depth=${depth}`);
  } catch {
    throw new Error(unreachable);
  }
  if (baseSpec) {
    try {
      gitFetch([baseSpec], `--depth=${depth}`);
    } catch {
      notes.push(`Couldn't fetch the base (${baseSpec.split(":")[0].slice(1)}): there's no diff, only the head.`);
      baseSpec = null;
    }
  }

  // Where the change starts: the merge base of base and head, deepening the shallow history until it's found.
  let mergeBase: string | null = null;
  if (baseSpec) {
    for (const deepen of [0, 300, 2000, 10000]) {
      if (deepen && tryGit(["fetch", "-q", "--no-tags", "--filter=blob:none", `--deepen=${deepen}`, "origin", headSpec, baseSpec]) === null) break;
      mergeBase = tryGit(["merge-base", "refs/hyped/base", "refs/hyped/head"]);
      if (mergeBase) break;
    }
    if (!mergeBase) notes.push("Couldn't find where the change starts in the history: there's no diff, only the head.");
  }

  git(["checkout", "-q", "--detach", "refs/hyped/head"]);
  facts.head.sha = git(["rev-parse", "HEAD"]);
  let diff = "";
  if (mergeBase) {
    facts.base.sha = mergeBase;
    if (mergeBase === facts.head.sha) notes.push("The head is already part of the base, so the diff is empty: read the commits and the description.");
    const range = [mergeBase, "HEAD"];
    const diffArgs = ["diff", "--no-color", "--no-ext-diff", "--no-textconv", "-M"];
    // name-status and numstat list the files in the same order.
    const names = git([...diffArgs, "--name-status", "-z", ...range]).split("\0");
    const counts = git([...diffArgs, "--numstat", "-z", ...range]).split("\0");
    const files: ChangeFile[] = [];
    for (let i = 0, j = 0; i < names.length - 1; ) {
      const code = names[i][0];
      const renamed = code === "R" || code === "C";
      const path = renamed ? names[i + 2] : names[i + 1];
      const previous = renamed ? names[i + 1] : undefined;
      i += renamed ? 3 : 2;
      // numstat: "added\tdeleted\tpath", or "added\tdeleted\t" then the old and new paths for a rename.
      const [added, deleted, numstatPath] = (counts[j] ?? "").split("\t");
      j += numstatPath === "" ? 3 : 1;
      files.push({ path, status: STATUS[code] ?? "changed", additions: Number(added) || 0, deletions: Number(deleted) || 0, ...(previous ? { previousPath: previous } : {}) });
    }
    const commits = git(["log", "--reverse", "--no-merges", "-n", "200", "--format=%H%x1f%aN%x1f%s", `${mergeBase}..HEAD`])
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, name, subject] = line.split("\x1f");
        return { sha, subject, author: null, name };
      });
    const total = Number(git(["rev-list", "--count", "--no-merges", `${mergeBase}..HEAD`]));
    facts.files = sortFiles(files);
    facts.commits = capCommits(commits);
    facts.totals = {
      commits: facts.totals.commits ?? total,
      files: files.length,
      additions: files.reduce((n, f) => n + f.additions, 0),
      deletions: files.reduce((n, f) => n + f.deletions, 0),
    };
    if (total > commits.length) notes.push(`The latest ${commits.length} of ${total} commits are listed; \`git log\` has the rest.`);
    if (files.length > facts.files.length) notes.push(`The ${facts.files.length} biggest of ${files.length} changed files are listed; \`git diff --stat ${mergeBase.slice(0, 12)} HEAD\` has the rest.`);
    facts.diff.omitted = files.map((f) => f.path).filter(isNoisyPath);

    // The diff can be huge (a release of a big project): written to a file in .git, and only its start read back.
    const file = join(workdir, ".git", "hyped-change.diff");
    const out = openSync(file, "w");
    try {
      git([...diffArgs, ...range, "--", ".", ...NOISE_PATHSPECS], out);
    } finally {
      closeSync(out);
    }
    const buffer = Buffer.alloc(CHANGE_DIFF_MAX + 1);
    const fd = openSync(file, "r");
    const read = readSync(fd, buffer, 0, buffer.length, 0);
    closeSync(fd);
    rmSync(file, { force: true });
    diff = buffer.subarray(0, read).toString("utf8");
  } else if (change.kind === "release" && !facts.previousTag) {
    notes.push("This is the first release: there's no earlier tag to compare with, so there's no diff. The whole project is new.");
  }
  facts.notes.push(...notes);
  return changeFiles(facts, diff);
}
