// The skills pipeline (docs/SKILLS_PIPELINE.md): the skills that make Hyped's videos as versioned packs of files, and
// the lint every version gets when it's saved. Shared by the web app's admin pages (step 1) and, from step 2, the
// render Worker and the runner, which unpack a version into a job's workspace in place of the baked-in folders.

/** A skill the team keeps versions of: one per scenario, plus the core and the review every scenario builds on. */
export type SkillSlot = { id: string; name: string; folder: string; kind: "scenario" | "shared"; about: string };

export const SKILL_SLOTS: readonly SkillSlot[] = [
  { id: "launch", name: "Launch", folder: "hyped-launch", kind: "scenario", about: "Launch Day, Teaser, 3 Features in 30" },
  { id: "update", name: "Update", folder: "hyped-update", kind: "scenario", about: "Feature Drop, Social Proof" },
  { id: "ads", name: "Ads", folder: "hyped-ads", kind: "scenario", about: "Problem → Solution, Before / After" },
  { id: "explain", name: "Explain", folder: "hyped-explain", kind: "scenario", about: "Walkthrough, Founder Demo" },
  { id: "dev", name: "Dev", folder: "hyped-dev", kind: "scenario", about: "README Loop, CLIs, changelogs" },
  { id: "release", name: "Release", folder: "hyped-release", kind: "scenario", about: "One GitHub pull request or release" },
  { id: "app", name: "App", folder: "hyped-app", kind: "scenario", about: "App Store Preview, Play Store Promo" },
  { id: "core", name: "Core", folder: "hyped", kind: "shared", about: "The loop, formats and craft every scenario reads first" },
  { id: "review", name: "Review", folder: "hyped-review", kind: "shared", about: "The rubric and review.mjs" },
];

export const skillSlot = (id: string) => SKILL_SLOTS.find((s) => s.id === id);

/** The baseline production runs today (runner/src/agent.ts): version 1 of every scenario. */
export const BASELINE_FOLDER = "brag-slim";

export const SKILL_STATUSES = ["draft", "tested", "candidate", "live", "retired"] as const;
export type SkillStatus = (typeof SKILL_STATUSES)[number];

/** A version's files: the folder it unpacks into and each file's text, by path inside that folder. */
export type SkillPack = { folder: string; files: Record<string, string> };

export const skillPackKey = (skillId: string, version: number) => `skills/${skillId}/v${version}.json`;

// Limits (research and v2 of the plan): what the agent reads before planning, the whole skill, and the pack itself.
export const SKILL_LIMITS = { readBeforePlan: 40_000, perSkill: 120_000, files: 80, fileBytes: 200_000, pathLength: 120 } as const;

/**
 * What a workspace offers the agent under .hyped/ (prepareWorkspace in runner/src/agent.ts): the scene tools, the audio
 * library, a GitHub change's facts, and the base worktree hyped-release makes itself. Keep in step with the runner.
 */
export const RUNNER_TOOLS = ["camera.js", "capture.mjs", "captions.js", "audio", "change.json", "change.diff", "base"] as const;

/** The other skill folders a skill may link into (../hyped/…): the shared ones and the baseline. */
const LINKABLE_FOLDERS = new Set(SKILL_SLOTS.map((s) => s.folder).concat(BASELINE_FOLDER));

export type SkillLint = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  bytes: number;
  /** SKILL.md plus the files it links to directly: roughly what the agent reads before it plans. */
  readBeforePlan: number;
  tools: string[];
};

// Keys and tokens that must never sit in a skill's text: the agent would see them, and so would every admin.
const SECRETS: [RegExp, string][] = [
  [/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/, "an API key (sk-…)"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, "a GitHub token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "an AWS access key"],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, "a Slack token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
  [/\bBearer\s+[A-Za-z0-9._-]{24,}/, "a bearer token"],
];

const byteLength = (s: string) => new TextEncoder().encode(s).length;

/** A path inside a skill folder: forward slashes, no ".." or leading slash, plain characters. */
export function cleanSkillPath(path: string): string | null {
  const p = path.replace(/\\/g, "/").replace(/^\.\/+/, "").trim();
  if (!p || p.length > SKILL_LIMITS.pathLength || p.startsWith("/") || p.split("/").some((part) => !part || part === "." || part === "..")) return null;
  return /^[A-Za-z0-9 _.,()+@-]+(\/[A-Za-z0-9 _.,()+@-]+)*$/.test(p) ? p : null;
}

/** A pack from untrusted input (the admin editor, an imported folder), or the reason it can't be one. */
export function cleanSkillPack(input: unknown): { pack: SkillPack } | { error: string } {
  const raw = input as { folder?: unknown; files?: unknown } | null;
  const folder = typeof raw?.folder === "string" ? raw.folder.trim() : "";
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(folder)) return { error: "The folder name must be lowercase letters, digits and dashes, like hyped-launch." };
  if (!raw?.files || typeof raw.files !== "object" || Array.isArray(raw.files)) return { error: "No files." };
  const files: Record<string, string> = {};
  for (const [path, text] of Object.entries(raw.files as Record<string, unknown>)) {
    const clean = cleanSkillPath(path);
    if (!clean) return { error: `"${path.slice(0, 80)}" isn't a usable file path.` };
    if (typeof text !== "string") return { error: `${clean} isn't text.` };
    if (byteLength(text) > SKILL_LIMITS.fileBytes) return { error: `${clean} is over ${SKILL_LIMITS.fileBytes / 1000} KB.` };
    files[clean] = text;
  }
  const count = Object.keys(files).length;
  if (!count) return { error: "No files." };
  if (count > SKILL_LIMITS.files) return { error: `At most ${SKILL_LIMITS.files} files in a skill.` };
  return { pack: { folder, files } };
}

/** The frontmatter's fields (name, description) from a SKILL.md, or null without a frontmatter block. */
function frontmatter(text: string): Record<string, string> | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const fields: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const f = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
    if (f) fields[f[1]] = f[2].trim();
  }
  return fields;
}

/** Resolve a relative link from a file in the folder: a path inside it, another skill folder's path, or null. */
function resolveLink(from: string, href: string): { inside: string } | { folder: string; path: string } | null {
  const parts = from.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (!parts.length) {
        // Out of this folder: into a sibling skill folder (../hyped/SKILL.md).
        const rest = href.split("/");
        const i = rest.lastIndexOf("..");
        const [folder, ...path] = rest.slice(i + 1);
        return folder ? { folder, path: path.join("/") } : null;
      }
      parts.pop();
    } else parts.push(part);
  }
  return { inside: parts.join("/") };
}

/**
 * The checks every saved version gets (v2 of the plan): a SKILL.md with its name and description, relative links that
 * resolve, sizes under budget, only tools the runner image has, and no keys or tokens. A lint can't keep a skill off
 * the internet (the container needs it to reach customers' sites); it only flags obvious fetches for the reviewer.
 */
export function lintSkill(pack: SkillPack): SkillLint {
  const errors: string[] = [];
  const warnings: string[] = [];
  const paths = Object.keys(pack.files);
  const bytes = paths.reduce((n, p) => n + byteLength(pack.files[p]), 0);

  const main = pack.files["SKILL.md"];
  let readBeforePlan = 0;
  if (main === undefined) errors.push("There's no SKILL.md at the top of the folder.");
  else {
    const fm = frontmatter(main);
    if (!fm) errors.push("SKILL.md has no frontmatter (--- name: … description: … ---).");
    else {
      if (!fm.name) errors.push("SKILL.md's frontmatter has no name.");
      else if (fm.name !== pack.folder) warnings.push(`SKILL.md's name is "${fm.name}", but the folder is "${pack.folder}".`);
      if (!fm.description) errors.push("SKILL.md's frontmatter has no description: the agent picks skills by it.");
    }
  }

  const linked = new Set<string>();
  const tools = new Set<string>();
  for (const path of paths) {
    const text = pack.files[path];
    if (!path.endsWith(".md")) continue;
    for (const m of text.matchAll(/\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g)) {
      const href = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue; // https:, mailto: and the like
      const target = resolveLink(path, href);
      if (!target) errors.push(`${path}: the link "${href}" doesn't point anywhere.`);
      else if ("inside" in target) {
        if (!(target.inside in pack.files) && !paths.some((p) => p.startsWith(`${target.inside}/`))) errors.push(`${path}: the link "${href}" points to a file this skill doesn't have.`);
        else if (path === "SKILL.md") linked.add(target.inside);
      } else if (!LINKABLE_FOLDERS.has(target.folder)) errors.push(`${path}: the link "${href}" points to a skill folder Hyped doesn't have ("${target.folder}").`);
    }
  }
  if (main !== undefined) readBeforePlan = byteLength(main) + [...linked].reduce((n, p) => n + (pack.files[p] ? byteLength(pack.files[p]) : 0), 0);

  for (const path of paths) {
    const text = pack.files[path];
    for (const m of text.matchAll(/\.hyped\/([A-Za-z0-9_.-]+)/g)) {
      const tool = m[1].replace(/\.$/, "");
      if ((RUNNER_TOOLS as readonly string[]).includes(tool)) tools.add(tool);
      else errors.push(`${path}: it calls .hyped/${tool}, which the runner image doesn't have. A new tool needs a new image first.`);
    }
    for (const [re, what] of SECRETS) if (re.test(text)) errors.push(`${path}: it contains what looks like ${what}. Keys never go in a skill.`);
    if (/\b(curl|wget)\b[^\n]*https?:\/\//i.test(text) || /\bfetch\(\s*["'`]https?:\/\//.test(text)) {
      warnings.push(`${path}: it fetches from the internet. Check the address is one the video needs.`);
    }
  }

  if (bytes > SKILL_LIMITS.perSkill) errors.push(`The skill is ${Math.round(bytes / 1000)} KB; the limit is ${SKILL_LIMITS.perSkill / 1000} KB.`);
  if (readBeforePlan > SKILL_LIMITS.readBeforePlan) warnings.push(`SKILL.md and the files it links come to ${Math.round(readBeforePlan / 1000)} KB; aim for under ${SKILL_LIMITS.readBeforePlan / 1000} KB before the plan.`);

  return { ok: errors.length === 0, errors: [...new Set(errors)].slice(0, 50), warnings: [...new Set(warnings)].slice(0, 50), bytes, readBeforePlan, tools: [...tools].sort() };
}
