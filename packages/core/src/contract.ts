// The contract between the render Worker (Cloudflare) and the runner (inside the Sandbox container).
// Types plus a few tiny value lists: both sides import this without pulling in each other's runtime code.
import type { TokenUsage } from "./pricing";
import type { VoiceId } from "./voices";

/** Which agent makes the video: Claude (Claude Agent SDK) or OpenAI (Codex CLI). */
export type Engine = "claude" | "openai";

/**
 * The quality tier a customer picks. Each tier always runs on one engine, set in the render Worker's config
 * (STANDARD_ENGINE, STUDIO_ENGINE). Customers only ever see the tier's name, never the engine behind it.
 */
export type Quality = "standard" | "studio";
export const QUALITIES: readonly Quality[] = ["standard", "studio"];

/** What kind of video: a launch announcement, a product demo walkthrough, or one feature in depth. */
export type VideoType = "launch" | "demo" | "feature";
export const VIDEO_TYPES: readonly VideoType[] = ["launch", "demo", "feature"];

/**
 * A product video's frame (reels keep their upload's own shape): wide 16:9, vertical 9:16, square 1:1, or portrait 4:5,
 * the tallest shape the Instagram, Facebook and LinkedIn feeds and Meta's feed ads show whole.
 */
export type VideoFormat = "landscape" | "vertical" | "square" | "portrait";
export const VIDEO_FORMATS: readonly VideoFormat[] = ["landscape", "vertical", "square", "portrait"];
/** Each format's frame in pixels, and its ratio as people write it. */
export const FORMAT_FRAMES: Record<VideoFormat, { width: number; height: number; ratio: string }> = {
  landscape: { width: 1920, height: 1080, ratio: "16:9" },
  vertical: { width: 1080, height: 1920, ratio: "9:16" },
  square: { width: 1080, height: 1080, ratio: "1:1" },
  portrait: { width: 1080, height: 1350, ratio: "4:5" },
};

/** Soundtrack: a real music track from the library, one the agent composes itself, or no music. */
export type MusicChoice = "upbeat" | "composed" | "none";
export const MUSIC_CHOICES: readonly MusicChoice[] = ["upbeat", "composed", "none"];

/** Optional guided brief from the customer. Every field is short free text. */
export type VideoBrief = {
  launching?: string; // what's new: "v2 with AI search"
  audience?: string; // who it's for
  highlights?: string[]; // up to 3 things to show
  cta?: string; // how the video should end: "Start free at acme.com"
};

export type BragRequest = {
  source: { type: "WEBSITE" | "GITHUB" | "LOCAL"; url: string };
  tone?: string | null;
  format?: string;
  durationSec?: number;
  notes?: string | null;
  revisionOf?: string | null; // free-text change request when revising an existing brag-output
  videoType?: VideoType;
  music?: MusicChoice;
  brief?: VideoBrief | null;
  /** Spoken voiceover by this voice; null or missing means no voiceover. */
  voice?: VoiceId | null;
  /** With a voiceover: burn the captions into the video (an SRT file is always delivered too). */
  captions?: boolean;
  /** The template this video started from (TEMPLATES in templates.ts): its beats shape the story. */
  template?: string | null;
  /**
   * Rotates the music library per customer: the render Worker sends a number that goes up by one with each of the
   * customer's videos, so back-to-back videos get different tracks (runner/src/music.ts).
   */
  musicSeed?: number | null;
};

/** Written by the render Worker to /workspace/job.json. */
export type JobSpec = {
  jobId: string;
  request: BragRequest;
  engine: Engine;
  model: string;
  watermark: boolean;
  watermarkText: string;
  hasParentWorkspace: boolean;
  /** Private repos: the render Worker downloaded the code to /workspace/source.tgz (the token never enters the container). */
  hasSourceArchive: boolean;
  /**
   * A private repo's pull request, release or comparison: the render Worker also wrote what it read about the change
   * through GitHub's API to /workspace/change.json and its diff to /workspace/change.diff (github.ts's ChangeFacts).
   */
  hasChangeFacts?: boolean;
};

/** Written by the runner to /workspace/result.json. File paths are relative to /workspace. */
export type JobResult = {
  ok: boolean;
  error?: string;
  engine: Engine;
  model: string;
  numTurns: number;
  usage: TokenUsage;
  llmCostUsd: number;
  sdkReportedCostUsd: number;
  durationMs: number;
  /**
   * Reels also leave their editable decisions (edit) and, on the first render, a small clean preview for the editor.
   * Product videos leave those too, with their clean copy (source) and narration alone (voice), the editor's upload.
   */
  files: { video?: string; poster?: string; workspace?: string; captions?: string; edit?: string; preview?: string; source?: string; voice?: string };
  /** Product videos: what's in the clean copy already, for Job.reel.video (VideoSource in reel.ts). */
  source?: { burned: boolean; watermarked: boolean; narrated: boolean; voice: boolean; captions: boolean; accent: string | null; width: number; height: number; duration: number; bytes: number };
  shareCopy: string | null;
  plan: string | null;
  /** Product videos made with Hyped's skills: the agent's own review of the finished video (hyped-review's review.json). */
  review?: VideoReview;
};

/**
 * What the hyped-review skill concluded about a finished video (brag-output/review.json, read defensively): the score
 * out of 100, whether it passed (no hard fails, no criterion at 0, score >= 80), the hard fails still true at the end,
 * and how many times it was measured and scored (1 = no fix round, at most 3).
 */
export type VideoReview = { score: number; passed: boolean; hardFails: string[]; rounds: number };
