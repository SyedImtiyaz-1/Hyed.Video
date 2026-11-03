// GitHub sources: a repo, or one change in it (a pull request, a release or a comparison), which makes a video about
// that change (the runner's hyped-release skill) rather than the whole project. Shared by the web app (accepting
// links), the render Worker (private repos, with the customer's token) and the runner (public repos), so all three
// read a link the same way and describe a change with the same facts (.hyped/change.json). No Prisma here: the
// container and the browser import it.
import { redactSecrets } from "./engines";

/** A repository: https://github.com/owner/repo */
export const GITHUB_REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
/** A GitHub pull request, release or comparison: a video about that change (hyped-release), not the whole project. */
export const GITHUB_CHANGE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(pull\/\d+|releases\/tag\/[^/?#]+|compare\/[^/?#]+)\/?$/;

/** What a GitHub link may be, for error messages. */
export const GITHUB_LINKS =
  "a repo (https://github.com/owner/repo), a pull request (https://github.com/owner/repo/pull/123), a release (https://github.com/owner/repo/releases/tag/v1.2.0) or a comparison (https://github.com/owner/repo/compare/v1.1.0...v1.2.0)";

export type ChangeRef =
  | { kind: "pull"; number: number }
  | { kind: "release"; tag: string }
  /** `base` null: compared with the repo's default branch, as GitHub does for /compare/<head>. */
  | { kind: "compare"; base: string | null; head: string };

export type GithubSource = {
  owner: string;
  repo: string;
  /** "owner/repo" */
  slug: string;
  /** https://github.com/owner/repo */
  url: string;
  change: ChangeRef | null;
};

/**
 * A ref we pass to git and GitHub's API: a branch, tag or commit name. Stricter than git's own rules (no spaces,
 * no "..", nothing that starts with "-" and could read as an option).
 */
const SAFE_REF = /^[\w][\w.@+/-]*$/;
const safeRef = (ref: string) => SAFE_REF.test(ref) && !ref.includes("..") && !ref.includes("//") && !/[./]$|\.lock$/.test(ref);

/**
 * The link people paste, made the one we store: https, no query or #fragment, no trailing slash, and a pull
 * request's tab (/files, /commits, /checks) dropped. Anything that isn't github.com comes back unchanged.
 */
export function canonicalGithubUrl(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return url;
  const path = u.pathname
    .replace(/\/+$/, "")
    .replace(/^(\/[^/]+\/[^/]+\/pull\/\d+)\/(?:files|commits|checks|changes)(?:\/.*)?$/, "$1")
    .replace(/^(\/[^/]+\/[^/]+)\.git$/, "$1");
  return `https://github.com${path}`;
}

/** A GitHub repo or change link, read; null when it's neither (or names a ref we won't pass on). */
export function parseGithubSource(url: string): GithubSource | null {
  if (!GITHUB_REPO.test(url) && !GITHUB_CHANGE.test(url)) return null;
  const [owner, rawRepo, kind, ...rest] = new URL(url).pathname.split("/").filter(Boolean);
  const repo = rawRepo.replace(/\.git$/, "");
  const source: GithubSource = { owner, repo, slug: `${owner}/${repo}`, url: `https://github.com/${owner}/${repo}`, change: null };
  if (!kind) return source;
  let value: string;
  try {
    value = decodeURIComponent(rest.join("/"));
  } catch {
    return null;
  }
  if (kind === "pull") return { ...source, change: { kind: "pull", number: Number(value) } };
  if (kind === "releases") {
    const tag = value.replace(/^tag\//, "");
    return safeRef(tag) ? { ...source, change: { kind: "release", tag } } : null;
  }
  // compare/<base>...<head>, <base>..<head> (diffed the same way here) or <head> alone. A fork's "owner:branch" isn't
  // supported: its pull request link is.
  const dots = value.includes("...") ? "..." : value.includes("..") ? ".." : null;
  const parts = dots ? value.split(dots) : [value];
  const [base, head] = parts.length === 2 ? parts : [null, parts[0]];
  if (parts.length > 2 || !head || (base !== null && !safeRef(base)) || !safeRef(head)) return null;
  return { ...source, change: { kind: "compare", base, head } };
}

/** Why a github.com link can't be used, or null when it can (a repo or a change we can read). */
export function githubLinkProblem(url: string): string | null {
  if (parseGithubSource(url)) return null;
  if (/\/compare\/[^/]*:/.test(url)) return "Comparisons with a fork aren't supported. Use the pull request's link instead.";
  return `Use a GitHub link: ${GITHUB_LINKS}.`;
}

/** The change in words, for the agent's prompt: "pull request #12 in owner/repo". */
export function describeChange(source: GithubSource): string {
  const c = source.change;
  if (!c) return `the repository ${source.slug}`;
  if (c.kind === "pull") return `pull request #${c.number} in ${source.slug}`;
  if (c.kind === "release") return `the release ${c.tag} of ${source.slug}`;
  return c.base ? `the changes from ${c.base} to ${c.head} in ${source.slug}` : `the changes on ${c.head} in ${source.slug}, compared with its default branch`;
}

export type ChangeFile = {
  path: string;
  status: "added" | "modified" | "removed" | "renamed" | "copied" | "changed";
  additions: number;
  deletions: number;
  /** Renamed or copied from. */
  previousPath?: string;
};

export type ChangeCommit = {
  sha: string;
  /** The first line of the message. */
  subject: string;
  /** The author's GitHub handle, without "@", when GitHub links the commit to an account. */
  author: string | null;
  /** The author's name as git recorded it, when there's no handle. */
  name?: string;
};

/**
 * What the agent knows about a change: written to .hyped/change.json (and its diff to .hyped/change.diff) next to
 * the code, which is checked out at the change's head. Everything here comes from GitHub or git, never from us.
 */
export type ChangeFacts = {
  kind: "pull" | "release" | "compare";
  /** The link the customer gave. */
  link: string;
  /** "owner/repo" and https://github.com/owner/repo */
  repo: string;
  repoUrl: string;
  /** A pull request's title, a release's name (or its tag), or "<base>...<head>" for a comparison. */
  title: string | null;
  number: number | null;
  tag: string | null;
  /** A release: the tag it's compared with (null for a first release). */
  previousTag: string | null;
  /** pull: open, draft, merged or closed. release: published, prerelease or draft. */
  state: string | null;
  /** Who opened the pull request or published the release: a GitHub handle as GitHub shows it, without "@". */
  author: string | null;
  createdAt: string | null;
  mergedAt: string | null;
  publishedAt: string | null;
  labels: string[];
  /** The pull request's description or the release notes, as written (Markdown), without HTML comments. */
  body: string | null;
  /** Images and attachments linked in the body (screenshots, screen recordings), in order. */
  media: string[];
  /** base.sha: the commit the diff starts from (where the change branched off, or the previous tag). */
  base: { ref: string | null; sha: string | null };
  /** head.sha: the commit checked out in the workspace. */
  head: { ref: string | null; sha: string | null };
  totals: { commits: number | null; files: number | null; additions: number | null; deletions: number | null };
  /** The changed files, biggest change first (up to 300). */
  files: ChangeFile[];
  /** The commits, oldest first (up to 200). */
  commits: ChangeCommit[];
  diff: {
    /** ".hyped/change.diff", or null when there's no diff (a first release). */
    path: string | null;
    truncated: boolean;
    /** Files left out of the diff file (lockfiles, minified and generated files); they're still in `files`. */
    omitted: string[];
  };
  /** git: the repo with enough history for `git show` and a checkout of base.sha. archive: the head's files only. */
  checkout: "git" | "archive";
  /** Anything that's missing, and why. */
  notes: string[];
};

export const CHANGE_FILE = ".hyped/change.json";
export const CHANGE_DIFF = ".hyped/change.diff";
const BODY_MAX = 20_000;
export const CHANGE_DIFF_MAX = 2_000_000;
const FILES_MAX = 300;
const COMMITS_MAX = 200;

/** Files whose diff says nothing about the change (lockfiles, minified and generated code): left out of the diff. */
const NOISE = /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|Pipfile\.lock|Gemfile\.lock|composer\.lock|go\.sum|flake\.lock|[^/]+\.min\.(js|css)|[^/]+\.map)$/;
export const isNoisyPath = (path: string) => NOISE.test(path);
/** The same files as git pathspecs, to leave them out of `git diff`. */
export const NOISE_PATHSPECS = [
  "package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock", "bun.lockb", "Cargo.lock", "poetry.lock", "uv.lock",
  "Pipfile.lock", "Gemfile.lock", "composer.lock", "go.sum", "flake.lock", "*.min.js", "*.min.css", "*.map",
].map((p) => `:(exclude,glob)**/${p}`);

/** An empty set of facts for a source, filled in by whoever reads the change. */
export function changeStub(source: GithubSource, link: string, checkout: ChangeFacts["checkout"]): ChangeFacts {
  const c = source.change;
  return {
    kind: c?.kind ?? "compare",
    link,
    repo: source.slug,
    repoUrl: source.url,
    title: c?.kind === "compare" ? (c.base ? `${c.base}...${c.head}` : c.head) : c?.kind === "release" ? c.tag : null,
    number: c?.kind === "pull" ? c.number : null,
    tag: c?.kind === "release" ? c.tag : null,
    previousTag: null,
    state: null,
    author: null,
    createdAt: null,
    mergedAt: null,
    publishedAt: null,
    labels: [],
    body: null,
    media: [],
    base: { ref: c?.kind === "compare" ? c.base : null, sha: null },
    head: { ref: c?.kind === "compare" ? c.head : c?.kind === "release" ? c.tag : null, sha: null },
    totals: { commits: null, files: null, additions: null, deletions: null },
    files: [],
    commits: [],
    diff: { path: null, truncated: false, omitted: [] },
    checkout,
    notes: [],
  };
}

// The parts of GitHub's REST API answers we read.
type ApiUser = { login?: string | null } | null | undefined;
export type ApiPull = {
  number: number;
  title: string;
  body: string | null;
  user: ApiUser;
  state: string;
  draft?: boolean;
  merged_at: string | null;
  created_at: string;
  labels?: { name?: string }[];
  base: { ref: string; sha: string };
  head: { ref: string; sha: string };
  commits?: number;
  additions?: number;
  deletions?: number;
  changed_files?: number;
};
export type ApiRelease = {
  tag_name: string;
  name: string | null;
  body: string | null;
  author: ApiUser;
  draft: boolean;
  prerelease: boolean;
  created_at: string | null;
  published_at: string | null;
};
type ApiFile = { filename: string; status: string; additions: number; deletions: number; previous_filename?: string; patch?: string };
type ApiCommit = { sha: string; commit: { message: string; author?: { name?: string } | null }; author: ApiUser };
type ApiCompare = { total_commits: number; commits: ApiCommit[]; files?: ApiFile[]; merge_base_commit?: { sha: string } };

/** A pull request's description or release notes: HTML comments (templates' hints) out, likely secrets masked, capped. */
function cleanBody(body: string | null | undefined): string | null {
  const text = redactSecrets((body ?? "").replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?-->/g, "")).trim();
  if (!text) return null;
  return text.length > BODY_MAX ? `${text.slice(0, BODY_MAX)}\n\n[cut: the rest is on GitHub]` : text;
}

/** Images and attachments in a body, in order: Markdown images, <img>/<video> tags and bare attachment links. */
export function bodyMedia(body: string | null | undefined): string[] {
  const found: string[] = [];
  const pattern = /!\[[^\]]*\]\((https:\/\/[^\s)]+)|<(?:img|video|source)\b[^>]*\bsrc=["'](https:\/\/[^"']+)["']|^\s*(https:\/\/github\.com\/user-attachments\/assets\/[\w-]+)\s*$/gim;
  for (const m of (body ?? "").matchAll(pattern)) found.push(m[1] ?? m[2] ?? m[3]);
  return [...new Set(found)].slice(0, 30);
}

export function factsFromPull(source: GithubSource, link: string, pr: ApiPull, checkout: ChangeFacts["checkout"]): ChangeFacts {
  return {
    ...changeStub(source, link, checkout),
    title: pr.title,
    state: pr.merged_at ? "merged" : pr.draft ? "draft" : pr.state,
    author: pr.user?.login ?? null,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    labels: (pr.labels ?? []).map((l) => l.name ?? "").filter(Boolean),
    body: cleanBody(pr.body),
    media: bodyMedia(pr.body),
    base: { ref: pr.base.ref, sha: null },
    head: { ref: pr.head.ref, sha: pr.head.sha },
    totals: { commits: pr.commits ?? null, files: pr.changed_files ?? null, additions: pr.additions ?? null, deletions: pr.deletions ?? null },
  };
}

export function factsFromRelease(source: GithubSource, link: string, release: ApiRelease, checkout: ChangeFacts["checkout"]): ChangeFacts {
  return {
    ...changeStub(source, link, checkout),
    title: release.name?.trim() || release.tag_name,
    tag: release.tag_name,
    state: release.draft ? "draft" : release.prerelease ? "prerelease" : "published",
    author: release.author?.login ?? null,
    createdAt: release.created_at,
    publishedAt: release.published_at,
    body: cleanBody(release.body),
    media: bodyMedia(release.body),
    head: { ref: release.tag_name, sha: null },
  };
}

const FILE_STATUS: Record<string, ChangeFile["status"]> = { added: "added", modified: "modified", removed: "removed", renamed: "renamed", copied: "copied" };

/** Biggest change first, capped. */
export function sortFiles(files: ChangeFile[]): ChangeFile[] {
  return [...files].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions)).slice(0, FILES_MAX);
}

const fileFromApi = (f: ApiFile): ChangeFile => ({
  path: f.filename,
  status: FILE_STATUS[f.status] ?? "changed",
  additions: f.additions,
  deletions: f.deletions,
  ...(f.previous_filename ? { previousPath: f.previous_filename } : {}),
});

const commitFromApi = (c: ApiCommit): ChangeCommit => ({
  sha: c.sha,
  subject: c.commit.message.split("\n")[0],
  author: c.author?.login ?? null,
  ...(c.author?.login ? {} : { name: c.commit.author?.name ?? undefined }),
});

/** The commits to list: the latest COMMITS_MAX, oldest first. */
export const capCommits = <T>(commits: T[]) => commits.slice(-COMMITS_MAX);

/** The tag a release follows, from the "Full Changelog" link GitHub writes into generated notes (…/compare/v1.2.2...v1.2.3). */
export function previousTagFromNotes(tag: string, notes: string | null | undefined): string | null {
  for (const m of (notes ?? "").matchAll(/\/compare\/([^\s)\]]+?)\.\.\.([^\s)\]>]+)/g)) {
    try {
      if (decodeURIComponent(m[2]) === tag && safeRef(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
    } catch {
      // a malformed link: look at the next one
    }
  }
  return null;
}

/**
 * The tag a release follows among the repo's tags: the one before it among tags shaped the same way ("v1.2.3",
 * "pkg@1.2.3"), a stable release skipping pre-releases. Null for a first release.
 */
export function previousTag(tag: string, tags: string[]): string | null {
  const parse = (t: string) => {
    const m = t.match(/^(\D*?)(\d+(?:\.\d+)*)(.*)$/);
    return m ? { prefix: m[1], nums: m[2].split(".").map(Number), pre: m[3].replace(/^[-+.]/, "") } : null;
  };
  type Version = NonNullable<ReturnType<typeof parse>>;
  const cmp = (a: Version, b: Version) => {
    for (let i = 0; i < Math.max(a.nums.length, b.nums.length); i++) {
      const d = (a.nums[i] ?? 0) - (b.nums[i] ?? 0);
      if (d) return d;
    }
    if (!a.pre !== !b.pre) return a.pre ? -1 : 1; // 2.0.0-rc.1 comes before 2.0.0
    return a.pre.localeCompare(b.pre, "en", { numeric: true });
  };
  const self = parse(tag);
  if (!self) return null;
  const earlier = tags
    .map((t) => ({ t, v: parse(t) }))
    .filter((x): x is { t: string; v: Version } => !!x.v && x.v.prefix === self.prefix && x.t !== tag && (!!self.pre || !x.v.pre) && cmp(x.v, self) < 0)
    .sort((a, b) => cmp(a.v, b.v));
  return earlier.at(-1)?.t ?? null;
}

/** A diff for the agent: noise files out, capped at a file boundary. */
export function trimDiff(diff: string, max = CHANGE_DIFF_MAX): { text: string; truncated: boolean; omitted: string[] } {
  const omitted: string[] = [];
  const kept = diff.split(/^(?=diff --git )/m).filter((part) => {
    const path = part.match(/^diff --git a\/(\S+) b\/(\S+)/)?.[2];
    if (path && isNoisyPath(path)) {
      omitted.push(path);
      return false;
    }
    return true;
  });
  let text = kept.join("");
  let truncated = false;
  if (text.length > max) {
    truncated = true;
    const cut = text.slice(0, max);
    const boundary = cut.lastIndexOf("\ndiff --git ");
    text = `${boundary > 0 ? cut.slice(0, boundary + 1) : cut.slice(0, cut.lastIndexOf("\n") + 1)}\n[cut: the diff is longer; see the files list in change.json]\n`;
  }
  return { text, truncated, omitted };
}

/** A diff rebuilt from the API's per-file patches, when GitHub won't send the whole diff (too large). */
function diffFromPatches(files: ApiFile[]): string {
  return files
    .filter((f) => f.patch)
    .map((f) => `diff --git a/${f.previous_filename ?? f.filename} b/${f.filename}\n--- a/${f.previous_filename ?? f.filename}\n+++ b/${f.filename}\n${f.patch}\n`)
    .join("");
}

/** What a GitHub API call returns, as much as we use of it (fetch's Response in every runtime). */
export type ApiResponse = { ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> };
/** Calls GitHub's REST API: a path like /repos/o/r/pulls/1, and the Accept header. The caller adds any token. */
export type GithubApi = (path: string, accept?: string) => Promise<ApiResponse>;

export class GithubApiError extends Error {
  constructor(
    readonly status: number,
    readonly what: string,
  ) {
    super(`GitHub answered ${status} for ${what}`);
  }
}

const DIFF_ACCEPT = "application/vnd.github.diff";
/** Above this many changed lines the whole diff isn't fetched (it would be cut anyway): the per-file patches are used. */
const DIFF_LINES_MAX = 60_000;
const enc = encodeURIComponent;

async function getJson<T>(api: GithubApi, path: string, what: string): Promise<T> {
  const res = await api(path);
  if (!res.ok) throw new GithubApiError(res.status, what);
  return (await res.json()) as T;
}

async function getText(api: GithubApi, path: string, accept: string): Promise<string | null> {
  try {
    const res = await api(path, accept);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * A change read entirely through GitHub's API: its facts, its diff and the commit to download (for private repos,
 * where the render Worker calls with the customer's token and the container gets files, never the token).
 * Throws GithubApiError when GitHub refuses or can't find the change.
 */
export async function fetchChangeFacts(source: GithubSource, link: string, api: GithubApi): Promise<{ facts: ChangeFacts; diff: string; head: string }> {
  const change = source.change;
  if (!change) throw new Error("Not a GitHub change link");
  const repo = `/repos/${source.slug}`;

  if (change.kind === "pull") {
    const what = `pull request #${change.number} in ${source.slug}`;
    const pr = await getJson<ApiPull>(api, `${repo}/pulls/${change.number}`, what);
    const facts = factsFromPull(source, link, pr, "archive");
    const files: ApiFile[] = [];
    for (let page = 1; page <= 3; page++) {
      const batch = await getJson<ApiFile[]>(api, `${repo}/pulls/${change.number}/files?per_page=100&page=${page}`, what);
      files.push(...batch);
      if (batch.length < 100) break;
    }
    const commits = await getJson<ApiCommit[]>(api, `${repo}/pulls/${change.number}/commits?per_page=100`, what).catch(() => []);
    facts.files = sortFiles(files.map(fileFromApi));
    facts.commits = capCommits(commits.map(commitFromApi));
    if ((pr.commits ?? 0) > commits.length) facts.notes.push(`${commits.length} of the ${pr.commits} commits are listed.`);
    if ((pr.changed_files ?? 0) > files.length) facts.notes.push(`${files.length} of the ${pr.changed_files} changed files are listed.`);
    const big = (pr.additions ?? 0) + (pr.deletions ?? 0) > DIFF_LINES_MAX;
    const diff = (big ? null : await getText(api, `${repo}/pulls/${change.number}`, DIFF_ACCEPT)) ?? diffFromPatches(files);
    return { facts, diff, head: pr.head.sha };
  }

  let facts = changeStub(source, link, "archive");
  let base: string | null;
  let head: string;
  if (change.kind === "release") {
    const release = await api(`${repo}/releases/tags/${enc(change.tag)}`);
    if (release.ok) facts = factsFromRelease(source, link, (await release.json()) as ApiRelease, "archive");
    else facts.notes.push("There's no GitHub release for this tag, only the tag: no release notes.");
    base =
      previousTagFromNotes(change.tag, facts.body) ??
      previousTag(change.tag, (await getJson<{ name: string }[]>(api, `${repo}/tags?per_page=100`, `the tags of ${source.slug}`).catch(() => [])).map((t) => t.name));
    facts.previousTag = base;
    facts.base.ref = base;
    head = change.tag;
  } else {
    base = change.base ?? (await getJson<{ default_branch: string }>(api, repo, source.slug)).default_branch;
    facts.base.ref = base;
    facts.title = `${base}...${change.head}`;
    head = change.head;
  }
  const sha = (await getText(api, `${repo}/commits/${enc(head)}`, "application/vnd.github.sha"))?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new GithubApiError(404, `${head} in ${source.slug}`);
  facts.head.sha = sha;
  if (!base) {
    facts.notes.push("This is the first release: there's no earlier tag to compare with, so there's no diff. The whole project is new.");
    return { facts, diff: "", head: sha };
  }
  const what = `the comparison ${base}...${head} in ${source.slug}`;
  const basehead = `${enc(base)}...${enc(head)}`;
  const compare = await getJson<ApiCompare>(api, `${repo}/compare/${basehead}?per_page=100`, what);
  const files = compare.files ?? [];
  facts.base.sha = compare.merge_base_commit?.sha ?? null;
  facts.files = sortFiles(files.map(fileFromApi));
  facts.commits = capCommits(compare.commits.map(commitFromApi));
  facts.totals = {
    commits: compare.total_commits,
    files: files.length,
    additions: files.reduce((n, f) => n + f.additions, 0),
    deletions: files.reduce((n, f) => n + f.deletions, 0),
  };
  if (compare.total_commits > compare.commits.length) facts.notes.push(`${compare.commits.length} of the ${compare.total_commits} commits are listed.`);
  if (files.length >= 300) facts.notes.push("GitHub lists at most 300 changed files: the totals count those.");
  const big = (facts.totals.additions ?? 0) + (facts.totals.deletions ?? 0) > DIFF_LINES_MAX || files.length >= 300;
  const diff = (big ? null : await getText(api, `${repo}/compare/${basehead}`, DIFF_ACCEPT)) ?? diffFromPatches(files);
  return { facts, diff, head: sha };
}

/** The facts and diff as the two files the agent reads. */
export function changeFiles(facts: ChangeFacts, diff: string): { json: string; diff: string } {
  const trimmed = trimDiff(diff);
  const withDiff: ChangeFacts = { ...facts, diff: { path: trimmed.text ? CHANGE_DIFF : null, truncated: trimmed.truncated, omitted: [...new Set([...facts.diff.omitted, ...trimmed.omitted])] } };
  return { json: `${JSON.stringify(withDiff, null, 2)}\n`, diff: trimmed.text };
}
