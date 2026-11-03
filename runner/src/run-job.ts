// Entry point inside the Cloudflare Sandbox container: runs exactly one video job, then exits.
//
// Input:  /workspace/job.json            (written by the render Worker)
//         /workspace/parent.tgz          (optional: the parent video's workspace, for revisions)
//         /workspace/source.tgz          (optional: a private repo, downloaded by the render Worker)
//         /workspace/change.json, .diff  (optional: a private repo's pull request or release, read by the render Worker)
// Output: /workspace/result.json         (usage, cost, outcome, share copy, plan)
//         /workspace/out/brag.mp4, brag.jpg, workspace.tgz
//         /workspace/out/source.mp4, voice.m4a, edit.json, preview.mp4 (what the editor opens: reel.ts adds the captions)
//
// No secrets live in this container. Claude Code calls http://anthropic.internal with a placeholder
// key; the render Worker answers that virtual host and adds the real key on the way to Anthropic.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { JobResult, JobSpec } from "@launchreel/core/contract";
import { VOICE_TIMINGS_USD_PER_MINUTE, VOICE_TTS_USD_PER_MINUTE } from "@launchreel/core/pricing";
import { REEL_PLAN_MODEL, videoOptions, type ReelSpec } from "@launchreel/core/reel";
import { prepareWorkspace, runBrag } from "./agent.ts";
import { readReview, reviewLine } from "./review.ts";

const ROOT = process.env.JOB_ROOT ?? "/workspace";
const workdir = join(ROOT, "project");
const outDir = join(ROOT, "out");
const run = (cmd: string, args: string[], cwd: string) => execFileSync(cmd, args, { cwd, stdio: "pipe", timeout: 5 * 60_000 });
const readIfExists = (p: string) => (existsSync(p) ? readFileSync(p, "utf8").slice(0, 50_000) : null);
// The voice tool logs what it recorded here, one JSON line per recording, so the job's cost includes speech.
const VOICE_USAGE = join(ROOT, "voice-usage.jsonl");

function voiceCostUsd() {
  const lines = (readIfExists(VOICE_USAGE) ?? "").split("\n").filter(Boolean);
  return lines.reduce((sum, line) => {
    try {
      const u = JSON.parse(line) as { ttsSeconds?: number; timingSeconds?: number };
      return sum + ((u.ttsSeconds ?? 0) / 60) * VOICE_TTS_USD_PER_MINUTE + ((u.timingSeconds ?? 0) / 60) * VOICE_TIMINGS_USD_PER_MINUTE;
    } catch {
      return sum;
    }
  }, 0);
}

/** The library's music is CC BY 4.0; the composer waives the credit, but a line in the share copy is appreciated. */
function withMusicCredit(shareCopy: string | null, outputDir: string) {
  const track = readIfExists(join(outputDir, "music.txt"));
  if (!shareCopy || !track || !/ende-dot-app/.test(track) || shareCopy.includes("ende.app")) return shareCopy;
  return `${shareCopy.trim()}\n\nMusic by Sascha Ende (ende.app)`;
}

function finish(result: JobResult) {
  writeFileSync(join(ROOT, "result.json"), JSON.stringify(result));
  console.log(`done engine=${result.engine} ok=${result.ok} turns=${result.numTurns} cost=$${(result.sdkReportedCostUsd || result.llmCostUsd).toFixed(3)} ${result.error ?? ""}`);
}

function watermark(file: string, text: string) {
  const tmp = file.replace(/\.mp4$/, ".wm.mp4");
  const safe = text.replace(/['\\:%]/g, ""); // characters drawtext treats specially
  execFileSync("ffmpeg", [
    "-y", "-i", file,
    "-vf", `drawtext=text='${safe}':fontcolor=white@0.85:fontsize=h/28:x=w-tw-h/30:y=h-th-h/30:box=1:boxcolor=black@0.35:boxborderw=12`,
    "-c:a", "copy", tmp,
  ]);
  renameSync(tmp, file);
}

/** The brand's accent colour, which the agent writes for the captions' spoken word, or null. */
function brandAccent(outputDir: string): string | null {
  try {
    const accent = (JSON.parse(readFileSync(join(outputDir, "work/brand.json"), "utf8")) as { accent?: unknown }).accent;
    return typeof accent === "string" && /^#[0-9a-f]{6}$/i.test(accent.trim()) ? accent.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Makes the agent's video editable, and its captions: reel.ts (dist/reel.mjs) opens it as a product video, writes what
 * the editor opens (the edit, a small preview, the narration alone) and renders the video with the captions (in the
 * style the agent's used to have, the spoken word in the brand's colour) and the free trial's mark. The agent's own
 * video, without either, is kept as the editor's upload. Null when it fails: the job then delivers the agent's video.
 */
function makeEditable(outputDir: string, spec: JobSpec): { video: string; captions: string | null; source: NonNullable<JobResult["source"]> } | null {
  const reelEntry = fileURLToPath(new URL("./reel.mjs", import.meta.url));
  if (!existsSync(reelEntry)) return null; // not bundled (a laptop run from source)
  const root = join(ROOT, "edit");
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  const agentVideo = join(outputDir, "brag.mp4");
  copyFileSync(agentVideo, join(outDir, "source.mp4"));
  copyFileSync(agentVideo, join(root, "source.mp4"));
  const voiceTrack = join(outputDir, "work/voice/voice.wav");
  const words = join(outputDir, "work/voice/captions.json");
  const narrated = Boolean(spec.request.voice) && existsSync(voiceTrack);
  if (narrated) copyFileSync(voiceTrack, join(root, "voice.wav"));
  if (narrated && existsSync(words)) copyFileSync(words, join(root, "captions.json"));
  const captions = narrated && existsSync(words) && spec.request.captions !== false;
  const accent = brandAccent(outputDir);
  const reel: ReelSpec = {
    jobId: spec.jobId,
    input: "source.mp4",
    options: videoOptions(captions, accent),
    maxSeconds: 30 * 60,
    watermark: spec.watermark,
    watermarkText: spec.watermarkText,
    model: REEL_PLAN_MODEL, // nothing is planned: no model calls
    video: { voice: narrated ? "voice.wav" : null, words: narrated ? "captions.json" : null },
  };
  writeFileSync(join(root, "reel.json"), JSON.stringify(reel));
  try {
    // Inside the 5 minutes the agent leaves before the workflow stops waiting (JOB_TIMEOUT_MS); a minute or two at most.
    execFileSync(process.execPath, [reelEntry], { cwd: root, env: { ...process.env, JOB_ROOT: root }, stdio: ["ignore", "inherit", "inherit"], timeout: 4 * 60_000 });
  } catch (err) {
    console.log(`captions and editing: the render failed (${String(err instanceof Error ? err.message : err).slice(0, 300)})`);
  }
  const result = existsSync(join(root, "result.json")) ? (JSON.parse(readFileSync(join(root, "result.json"), "utf8")) as JobResult) : null;
  if (!result?.ok || !result.files.video || !result.files.edit || !result.files.preview) {
    console.log(`captions and editing: ${result?.error ?? "no result"}; delivering the agent's video`);
    rmSync(join(outDir, "source.mp4"), { force: true });
    return null;
  }
  for (const name of ["edit.json", "preview.mp4", "voice.m4a"]) if (existsSync(join(root, "out", name))) copyFileSync(join(root, "out", name), join(outDir, name));
  const probe = JSON.parse(readFileSync(join(root, "out/edit.json"), "utf8")) as { width: number; height: number; duration: number };
  return {
    video: join(root, "out/brag.mp4"),
    captions: result.files.captions ? join(root, result.files.captions) : null,
    source: { burned: false, watermarked: false, narrated: Boolean(spec.request.voice), voice: narrated, captions, accent, width: probe.width, height: probe.height, duration: probe.duration, bytes: statSync(join(outDir, "source.mp4")).size },
  };
}

const spec: JobSpec = JSON.parse(readFileSync(join(ROOT, "job.json"), "utf8"));
mkdirSync(outDir, { recursive: true });

try {
  const sourceArchive = spec.hasSourceArchive ? join(ROOT, "source.tgz") : undefined;
  // A private repo's pull request or release: what the render Worker read about it through GitHub's API.
  const changeFacts = spec.hasChangeFacts ? { json: join(ROOT, "change.json"), diff: join(ROOT, "change.diff") } : undefined;
  await prepareWorkspace(workdir, spec.request, run, sourceArchive, changeFacts);
  if (sourceArchive) rmSync(sourceArchive, { force: true });
  if (changeFacts) for (const file of Object.values(changeFacts)) rmSync(file, { force: true });
  if (spec.hasParentWorkspace) run("tar", ["-xzf", join(ROOT, "parent.tgz")], workdir);

  process.env.HYPED_USAGE_FILE = VOICE_USAGE;
  const { outputDir, ...res } = await runBrag(workdir, spec.request, { engine: spec.engine, model: spec.model, onEvent: (m) => console.log(m) });
  const voiceCost = voiceCostUsd();
  res.llmCostUsd += voiceCost;
  if (res.sdkReportedCostUsd) res.sdkReportedCostUsd += voiceCost;
  const files: JobResult["files"] = {};
  let source: JobResult["source"];
  if (res.ok && outputDir) {
    // The captions go on after the agent, by the editor's render, so the video can be edited later.
    const editable = makeEditable(outputDir, spec);
    if (editable) {
      copyFileSync(editable.video, join(outDir, "brag.mp4"));
      Object.assign(files, { source: "out/source.mp4", edit: "out/edit.json", preview: "out/preview.mp4", ...(existsSync(join(outDir, "voice.m4a")) ? { voice: "out/voice.m4a" } : {}) });
      source = editable.source;
    } else {
      const video = join(outDir, "brag.mp4");
      copyFileSync(join(outputDir, "brag.mp4"), video);
      if (spec.watermark) watermark(video, spec.watermarkText);
    }
    files.video = "out/brag.mp4";
    if (existsSync(join(outputDir, "brag.jpg"))) {
      copyFileSync(join(outputDir, "brag.jpg"), join(outDir, "brag.jpg"));
      files.poster = "out/brag.jpg";
    }
    // Voiceover videos deliver their captions as SRT too (the agent copies them out; fall back to the tool's copy).
    const srt = editable?.captions ?? [join(outputDir, "captions.srt"), join(outputDir, "work/voice/captions.srt")].find((p) => existsSync(p));
    if (spec.request.voice && srt) {
      copyFileSync(srt, join(outDir, "captions.srt"));
      files.captions = "out/captions.srt";
    }
    // Keep the plan and composition so a revision edits this video instead of starting over.
    // The review's full-size stills (hyped-review) are regenerated by every review, like the frames.
    run("tar", ["--exclude=node_modules", "--exclude=brag-output/work/frames", "--exclude=brag-output/work/review/stills", "-czf", join(outDir, "workspace.tgz"), "brag-output"], workdir);
    files.workspace = "out/workspace.tgz";
  }
  // The agent's own review of the finished video (hyped-review), when it wrote one.
  const review = readReview(outputDir);
  if (outputDir) console.log(reviewLine(review));
  finish({
    ...res,
    files,
    ...(source ? { source } : {}),
    shareCopy: outputDir ? withMusicCredit(readIfExists(join(outputDir, "share-copy.txt")), outputDir) : null,
    plan: outputDir ? readIfExists(join(outputDir, "brag-plan.md")) : null,
    ...(review ? { review } : {}),
  });
} catch (err) {
  finish({
    ok: false,
    error: String(err instanceof Error ? err.message : err).slice(0, 2000),
    engine: spec.engine,
    model: spec.model,
    numTurns: 0,
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    llmCostUsd: 0,
    sdkReportedCostUsd: 0,
    durationMs: 0,
    files: {},
    shareCopy: null,
    plan: null,
  });
}
