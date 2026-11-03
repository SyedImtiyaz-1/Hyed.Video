// Reel help: a customer uploads a short video they recorded (a talking-head reel, a Short, a product demo) and gets it
// back with word-by-word captions, keyword emphasis, emojis, punch-in zooms, sound effects and an optional hook title.
// Shared by the web app (options, prices, upload limits), the render Worker and the runner (runner/src/reel.ts).
// No Prisma here: the browser and the container import it.
import { parseLookChanges, REEL_STYLES, type CaptionLine, type ReelLookChanges, type ReelStyle } from "./captions";
import { EFFECTS, isReelEffect, type PlacedEffect } from "./effects";
import { customerError } from "./engines";
import { parsePicture, type ReelPicture } from "./picture";
import { isReelSound, type ReelSound } from "./sounds";
import { parseBroll, type BrollShot } from "./broll";
import { isEditStyle, isStrength, type ReelEditStyle, type ReelStrength } from "./edit-styles";
import { parseAudio, type ReelAudio } from "./music-beds";
import { parseTrims, REEL_CLEANUPS, type ReelCleanup, type Trim } from "./trims";
import { parseTransitions, type PlacedTransition } from "./transitions";
import { strongestWord } from "./words";

// The caption styles and what customers can change about them live in captions.ts.
export { REEL_STYLES, type ReelStyle } from "./captions";

/**
 * What the captions are written in. "auto" follows the speech; "hinglish" (beta) writes Hindi and English speech in
 * Roman script, the way creators type it. Other languages are refused for now: the caption fonts cover Latin script.
 */
export type ReelLanguage = "auto" | "en" | "hinglish";
export const REEL_LANGUAGES: readonly ReelLanguage[] = ["auto", "en", "hinglish"];

/**
 * Font styles for "behind"'s big words, each with a casing and colour of its own (the customer can change both for all
 * of them: bigCasing and bigColors in the caption look): white Inter, yellow Anton, red Abril Fatface, white DM Serif
 * italic, blue Kaushan Script, white Permanent Marker, hollow Inter, lime Archivo Black, orange Luckiest Guy, gold
 * Instrument Serif italic, pink Bebas Neue, lavender lowercase Rubik, teal lowercase Poppins, gold Playfair Display
 * capitals, pink lowercase Fredoka, white Great Vibes calligraphy, pink Press Start 2P pixels, yellow Lilita One and
 * white wide Archivo. All are caption fonts too (runner/fonts). A reel takes one, or mixes up to REEL_MAX_FONTS: the big words take turns (bigWords), in the order
 * the fonts were picked.
 */
export type ReelFont = "classic" | "impact" | "editorial" | "elegant" | "script" | "marker" | "outline" | "pop" | "chunky" | "slim" | "poster" | "rounded" | "geometric" | "didone" | "bubbly" | "calligraphy" | "arcade" | "block" | "wide";
export const REEL_FONTS: readonly ReelFont[] = ["classic", "impact", "editorial", "elegant", "script", "marker", "outline", "pop", "chunky", "slim", "poster", "rounded", "geometric", "didone", "bubbly", "calligraphy", "arcade", "block", "wide"];
export const REEL_MAX_FONTS = 4;

/** How a big word is written: in capitals, lower case, with a capital first, or as said. */
export type BigCasing = "upper" | "lower" | "title" | "as-said";

/** A big word as a casing writes it: trailing commas and full stops dropped, then cased. */
export function bigWordText(word: string, casing: BigCasing): string {
  const text = word.replace(/[.,;:]+$/, "");
  if (casing === "upper") return text.toLocaleUpperCase("en");
  if (casing === "lower") return text.toLocaleLowerCase("en");
  if (casing === "as-said") return text;
  return text.charAt(0).toLocaleUpperCase("en") + text.slice(1);
}

/** A big word's colour on its turn: the customer's colours in turn, when they chose some, else its font's own. */
export const bigColorOf = (colors: readonly string[] | undefined, turn: number, own: string) => (colors?.length ? colors[turn % colors.length] : own);

/** One of "behind"'s big words: its caption line, its place on the line, when it shows, and its turn (bigWords). */
export type BigWord = { line: number; word: number; start: number; end: number; turn: number };

/**
 * "Behind you"'s big words: each caption line's first highlighted word, else its strongest, from just before it's said
 * to the end of its line (0.8 s at least), never into the next one or across a shot change (`cuts`, in seconds; one
 * said just before a cut waits for the new shot). None is said before the hook ends (`hookEnd`, null without a hook),
 * and one left on screen under 0.4 s is dropped (its word stays in the small captions).
 *
 * They take turns after the hook's: the hook is turn 0, and big word n is turn n, plus 1 when there's a hook. Fonts and
 * colours go round by the turn (fonts[turn % fonts.length], bigColors[turn % bigColors.length]). The render and the
 * previews both pick and time the big words with this, so they agree on each one's font and colour.
 */
export function bigWords(lines: readonly CaptionLine[], keywords: ReadonlySet<number>, hookEnd: number | null, duration = Infinity, cuts: readonly number[] = [], frame = 1 / 30): BigWord[] {
  const shots: BigWord[] = [];
  lines.forEach((g, line) => {
    const marked = g.words.findIndex((w) => keywords.has(w.i));
    const k = marked >= 0 ? marked : strongestWord(g.words);
    if (k === null || g.words[k].start < (hookEnd ?? 0)) return;
    let [start, end] = [Math.max(0, g.words[k].start - 0.05), Math.min(duration, Math.max(g.end, g.words[k].start + 0.8))];
    const cut = cuts.find((c) => c > start && c < end);
    if (cut !== undefined && cut - start < 0.4) start = cut;
    else if (cut !== undefined) end = cut - frame;
    shots.push({ line, word: k, start, end, turn: 0 });
  });
  shots.forEach((s, i) => (s.end = Math.min(s.end, (shots[i + 1]?.start ?? Infinity) - 0.04)));
  return shots.filter((s) => s.end - s.start >= 0.4).map((s, n) => ({ ...s, turn: n + (hookEnd === null ? 0 : 1) }));
}

/**
 * What the customer picks: an edit style (edit-styles.ts) and its strength, the caption style and their changes to it
 * ("look"), for "behind" the big words' fonts, the extras, and how much dead air the first render cuts (cleanup; every
 * cut can be put back in the editor). The edit style sets the rest as a starting point; the first render also takes
 * its picture grade, music bed and cut effects from it.
 */
export type ReelOptions = { style: ReelStyle; look: ReelLookChanges; fonts: ReelFont[]; emojis: boolean; zooms: boolean; sfx: boolean; hook: boolean; broll: boolean; language: ReelLanguage; cleanup: ReelCleanup; editStyle: ReelEditStyle; strength: ReelStrength; captions?: boolean };
export const REEL_DEFAULTS: ReelOptions = { style: "bold", look: {}, fonts: ["classic"], emojis: true, zooms: true, sfx: true, hook: true, broll: true, language: "auto", cleanup: "pauses", editStyle: "creator", strength: "medium" };
/** Whether the captions are drawn: reels always have them; a product video has them when it's narrated and they're on. */
export const captionsOn = (options: Pick<ReelOptions, "captions">) => options.captions !== false;

/** Font styles read back defensively: known ones, each once, at most REEL_MAX_FONTS, else Classic. */
export function parseFonts(value: unknown): ReelFont[] {
  const fonts = [...new Set((Array.isArray(value) ? value : [value]).filter((f): f is ReelFont => REEL_FONTS.includes(f as ReelFont)))].slice(0, REEL_MAX_FONTS);
  return fonts.length ? fonts : [...REEL_DEFAULTS.fonts];
}

/** A re-export of an edited reel (free while the upload is kept): which one, and how it went. */
export type ReelExport = { revision: number; status: "rendering" | "done" | "failed"; startedAt: string; finishedAt?: string; error?: string };

/**
 * Job.reel: the options plus the uploaded file, stored in R2 at uploads/<userId>/<random>.<ext> (kept REEL_EDIT_DAYS,
 * then the bucket's lifecycle rule deletes it), and the latest re-export.
 */
export type ReelJob = ReelOptions & { key: string; fileName: string; bytes: number; durationSec: number; width: number | null; height: number | null; export?: ReelExport; video?: VideoSource };

/**
 * A product video (Job.kind "video") opened in the same editor. Its clean copy (jobs/<id>/source.mp4: the agent's video,
 * without the captions, which the render adds) is the editor's upload, kept as long as the video. What that copy has in
 * it already: captions drawn into the picture and the free trial's mark (videos made before captions were added after
 * the agent), whether it's narrated, and whether the narration was kept on its own (jobs/<id>/voice.m4a), so the music
 * can be changed under it. While an older video is being made ready, Job.reel.export is revision 0.
 */
export type VideoSource = { burned: boolean; watermarked: boolean; narrated: boolean; voice: boolean };
/** A narrated video whose narration wasn't kept on its own keeps its soundtrack: a new bed would lose the voice. */
export const musicLocked = (video: VideoSource | null | undefined) => Boolean(video?.narrated && !video.voice);
export const sourceKey = (jobId: string) => `jobs/${jobId}/source.mp4`;
export const voiceKey = (jobId: string) => `jobs/${jobId}/voice.m4a`;

/** How long a reel stays editable, with free re-exports: its upload is kept this long. Product videos keep theirs. */
export const REEL_EDIT_DAYS = 7;

/** Whether a reel or product video can still be edited: finished, and for a reel, made within REEL_EDIT_DAYS. */
export function reelEditable(job: { status: string; createdAt: Date }, reel: ReelJob | null, now = Date.now()): { ok: boolean; reason?: string } {
  if (!reel || job.status !== "SUCCEEDED") return { ok: false, reason: reel?.video ? "Only finished videos can be edited." : "Only finished reels can be edited." };
  if (reel.video) return { ok: true };
  if (now - job.createdAt.getTime() > REEL_EDIT_DAYS * 86_400_000) return { ok: false, reason: `Reels can be edited for ${REEL_EDIT_DAYS} days after they're made; this one's upload has been deleted.` };
  return { ok: true };
}

/**
 * A product video's starting options: as it was made. The captions start as the agent's used to look (a dark box at
 * the bottom, the spoken word in the brand's colour), when it's narrated and they're on; nothing else is added.
 */
export function videoOptions(captions: boolean, accent?: string | null): ReelOptions {
  const look = parseLookChanges({ position: "bottom", accent: accent ?? undefined });
  return { ...REEL_DEFAULTS, style: "box", look, hook: false, broll: false, cleanup: "off", captions };
}

/** An edit that changes nothing: the words, and where the picture cuts from shot to shot. */
export function blankEdit(duration: number, width: number, height: number, words: ReelEdit["words"], cuts: number[] = []): ReelEdit {
  return parseReelEdit({ version: 1, duration, width, height, words, cuts }) ?? { version: 1, duration, width, height, words: [], hidden: [], breaks: [], keywords: [], emojis: [], emojiStyle: { size: "m", place: "auto" }, zooms: [], sounds: [], hookSound: null, effects: [], picture: parsePicture(null), cuts: [], hook: "", trims: [], audio: parseAudio(null), broll: [], transitions: [] };
}

/** How far a punch-in goes: a little, a normal punch, or a lot closer. */
export type ZoomStrength = "subtle" | "medium" | "strong";
export const ZOOM_STRENGTHS: readonly ZoomStrength[] = ["subtle", "medium", "strong"];
export const ZOOM_AMOUNT: Record<ZoomStrength, number> = { subtle: 0.07, medium: 0.12, strong: 0.2 };

/** Emoji sizes (shares of sqrt(width × height)), and where they go: by the captions' position, or above or below them. */
export type EmojiSize = "s" | "m" | "l";
export type EmojiPlace = "auto" | "above" | "below";
export const EMOJI_SIZE: Record<EmojiSize, number> = { s: 0.08, m: 0.115, l: 0.155 };
export type EmojiStyle = { size: EmojiSize; place: EmojiPlace };

/**
 * A reel's editable decisions, saved after its first render (R2: jobs/<id>/edit.json) and changed in the editor. The
 * render makes the video from exactly this, so the first render and every export show what the editor shows.
 * - the spoken words with their timings (only their spelling can change), which are left out of the captions, and
 *   where a new caption line starts
 * - the highlighted words ("Behind you": a line's first is its big word), the emojis and punch-ins, each on a word
 * - sound effects, transitions and effects, each at a second (a cut, or a word as it's said)
 * - the picture's look, the hook title and its sound, and where the upload cuts from shot to shot
 * - the stretches cut out (trims: pauses, filler sounds, retakes, the customer's own cuts)
 * - the sound: the voice's background noise cleaned out, and a music bed
 * - stock B-roll laid over the speaker (broll.ts)
 * Everything is on the upload's clock; onCutTimeline() (trims.ts) moves it onto the cut video's. Marks on words
 * survive a change in how words are grouped into lines.
 */
export type ReelEdit = {
  version: 1;
  /** Length in seconds, and the output frame. */
  duration: number;
  width: number;
  height: number;
  words: { text: string; start: number; end: number }[];
  hidden: number[];
  breaks: number[];
  keywords: number[];
  emojis: { word: number; emoji: string }[];
  emojiStyle: EmojiStyle;
  zooms: { word: number; strength: ZoomStrength }[];
  sounds: { at: number; sound: ReelSound }[];
  hookSound: ReelSound | null;
  effects: PlacedEffect[];
  picture: ReelPicture;
  cuts: number[];
  hook: string;
  trims: Trim[];
  audio: ReelAudio;
  broll: BrollShot[];
  /** Transitions between shots, at jump cuts and cuts (transitions.ts). */
  transitions: PlacedTransition[];
};

// What the caption fonts can draw (as the runner checks): Latin, Greek and Cyrillic letters, digits and punctuation.
const DRAWABLE = /^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Common}\p{Script=Inherited}]*$/u;
// One emoji, as Unicode recommends them (flags and keycaps too); engines without the `v` flag fall back to a looser test.
const RGI_EMOJI = (() => {
  try {
    return new RegExp("^\\p{RGI_Emoji}$", "v");
  } catch {
    return null;
  }
})();
const graphemes = (s: string) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].length;

/** A word's new text as the captions can show it (1-40 characters the caption fonts can draw), or null. */
export const cleanWordText = (text: unknown): string | null => {
  const clean = typeof text === "string" ? text.replace(/\s+/g, " ").trim().slice(0, 40) : "";
  return clean && DRAWABLE.test(clean) ? clean : null;
};
export const isEmoji = (s: string) => (RGI_EMOJI ? RGI_EMOJI.test(s) : /^\p{Extended_Pictographic}/u.test(s) && graphemes(s) === 1);

const MAX_MARKS = 300;

/** An edit read back defensively, or null. With `original`, the words keep the original's timings and count, and its cuts. */
export function parseReelEdit(value: unknown, original?: ReelEdit): ReelEdit | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { [K in keyof ReelEdit]?: unknown } & { words?: unknown };
  // A product video without a voiceover has no words: everything but the captions still edits.
  if (!Array.isArray(v.words)) return null;
  const base = original ?? (v as Partial<ReelEdit>);
  if (original && v.words.length !== original.words.length) return null;
  const words = (v.words as { text?: unknown; start?: unknown; end?: unknown }[]).map((w, i) => {
    const text = typeof w?.text === "string" ? w.text.replace(/\s+/g, " ").trim().slice(0, 40) : "";
    const timing = original ? original.words[i] : w;
    return { text, start: Number(timing?.start), end: Number(timing?.end) };
  });
  if (words.some((w) => !w.text || !DRAWABLE.test(w.text) || !Number.isFinite(w.start) || !Number.isFinite(w.end))) return null;
  const duration = Number(base.duration) || 0;
  const list = (x: unknown) => (Array.isArray(x) ? x : []) as Record<string, unknown>[];
  const index = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 && (n as number) < words.length ? (n as number) : null);
  const indices = (x: unknown) => [...new Set((Array.isArray(x) ? x : []).map(index).filter((n): n is number => n !== null))].sort((a, b) => a - b);
  const second = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= duration + 0.5 ? Math.round(n * 1000) / 1000 : null);
  // One of each mark a word (the last wins).
  const byWord = <T extends { word: number }>(marks: T[]) => [...new Map(marks.map((m) => [m.word, m])).values()].sort((a, b) => a.word - b.word).slice(0, MAX_MARKS);

  const emojis = byWord(
    list(v.emojis)
      .map((e) => ({ word: index(e?.word), emoji: typeof e?.emoji === "string" ? e.emoji.trim() : "" }))
      .filter((e): e is { word: number; emoji: string } => e.word !== null && isEmoji(e.emoji)),
  );
  // Zooms were word numbers before they had strengths.
  const zooms = byWord(
    (Array.isArray(v.zooms) ? v.zooms : [])
      .map((z) => (typeof z === "number" ? { word: index(z), strength: "medium" as ZoomStrength } : { word: index(z?.word), strength: ZOOM_STRENGTHS.includes(z?.strength) ? (z.strength as ZoomStrength) : "medium" }))
      .filter((z): z is { word: number; strength: ZoomStrength } => z.word !== null),
  );
  const sounds = list(v.sounds)
    .map((s) => ({ at: second(s?.at), sound: s?.sound }))
    .filter((s): s is { at: number; sound: ReelSound } => s.at !== null && isReelSound(s.sound))
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_MARKS);
  const effects = list(v.effects)
    .map((e) => {
      if (!isReelEffect(e?.effect)) return null;
      const spec = EFFECTS[e.effect];
      const at = second(e.at);
      const length = typeof e.length === "number" && Number.isFinite(e.length) ? Math.min(spec.max, Math.max(spec.min, Math.round(e.length * 100) / 100)) : spec.length;
      return at === null ? null : { at, effect: e.effect, length };
    })
    .filter((e): e is PlacedEffect => e !== null)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_MARKS);
  const style = (v.emojiStyle ?? {}) as Partial<EmojiStyle>;
  const cuts = (original ? original.cuts : (Array.isArray(v.cuts) ? v.cuts : []).map(second).filter((n): n is number => n !== null)).slice(0, 500);
  return {
    version: 1,
    duration,
    width: Number(base.width) || 1080,
    height: Number(base.height) || 1920,
    words,
    hidden: indices(v.hidden).filter((i) => i < words.length).slice(0, Math.max(0, words.length - 1)),
    breaks: indices(v.breaks),
    keywords: indices(v.keywords),
    emojis,
    emojiStyle: { size: style.size && style.size in EMOJI_SIZE ? style.size : "m", place: style.place === "above" || style.place === "below" ? style.place : "auto" },
    zooms,
    sounds,
    hookSound: isReelSound(v.hookSound) ? v.hookSound : null,
    effects,
    picture: parsePicture(v.picture),
    cuts: [...new Set(cuts)].sort((a, b) => a - b),
    hook: typeof v.hook === "string" ? v.hook.replace(/[\p{Extended_Pictographic}"“”]/gu, "").replace(/\s+/g, " ").trim().slice(0, 48) : "",
    trims: parseTrims(v.trims, duration),
    audio: parseAudio(v.audio),
    broll: parseBroll(v.broll, duration),
    transitions: parseTransitions(v.transitions, duration),
  };
}

function parseExport(value: unknown): ReelExport | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Partial<ReelExport>;
  if (!Number.isInteger(v.revision) || !["rendering", "done", "failed"].includes(v.status as string) || typeof v.startedAt !== "string") return undefined;
  return { revision: v.revision as number, status: v.status as ReelExport["status"], startedAt: v.startedAt, finishedAt: typeof v.finishedAt === "string" ? v.finishedAt : undefined, error: typeof v.error === "string" ? v.error : undefined };
}

// Uploads go from the browser straight to R2 through the web Worker, in parts. R2 wants every part but the last the
// same size and at least 5 MiB. Next.js cuts request bodies off at 10 MB when middleware runs (Clerk's does, on
// every API route: middlewareClientMaxBodySize), so a part is 8 MiB, well under that and the Worker's 100 MB.
export const REEL_MAX_SECONDS = 20 * 60;
export const REEL_MAX_BYTES = 4 * 1024 * 1024 * 1024;
export const REEL_PART_BYTES = 8 * 1024 * 1024;
/** Accepted uploads, and the extension each is stored with. */
export const REEL_UPLOAD_TYPES = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" } as const;
export type ReelUploadType = keyof typeof REEL_UPLOAD_TYPES;

// Priced by length: 1 credit per started 90 seconds of upload (so 1 up to 90 seconds and 2 up to 3 minutes, as before;
// 14 for 20 minutes). Our cost is about $0.03–0.10 per 90 seconds: speech recognition, a few small LLM calls (the plan,
// retakes) and container time for the cut and the render.
export const REEL_SECONDS_PER_CREDIT = 90;

/** Credits for a reel of this length, or null when it's longer than we take. */
export function creditsForReel(durationSec: number): number | null {
  if (!(durationSec > 0) || durationSec > REEL_MAX_SECONDS) return null;
  return Math.max(1, Math.ceil(durationSec / REEL_SECONDS_PER_CREDIT));
}

/** The longest reel `credits` pay for. The container measures the real length and refuses anything longer (refunded). */
export function reelSecondsFor(credits: number): number {
  return Math.min(REEL_MAX_SECONDS, Math.max(0, Math.floor(credits)) * REEL_SECONDS_PER_CREDIT);
}

/** The edit plan's model: one small structured call per reel (a second one romanizes Hinglish). */
export const REEL_PLAN_MODEL = "gpt-6-luna";

/** Written by the render Worker to /workspace/reel.json. The runner answers with /workspace/result.json (a JobResult). */
export type ReelSpec = {
  jobId: string;
  /** The uploaded video, relative to /workspace. */
  input: string;
  options: ReelOptions;
  /** What the job's credits cover, plus a second of slack for how browsers measure. */
  maxSeconds: number;
  watermark: boolean;
  watermarkText: string;
  model: string;
  /**
   * A re-export of an edited reel: the words and decisions come from /workspace/edit.json (a ReelEdit) instead of
   * speech recognition and the planner.
   */
  edit?: boolean;
  /**
   * A product video instead of a reel: `input` is its clean copy, with its own soundtrack. Its words come from the
   * narration's script (`words`, the voice tool's captions.json, on the first run), not speech recognition; nothing is
   * planned or cut. A new music bed goes under `voice`, the narration alone (null without a voiceover). `editorOnly`:
   * write what the editor opens (the edit, the preview, the narration) and stop, without rendering the video.
   */
  video?: { voice: string | null; words?: string | null; editorOnly?: boolean };
};

function parseVideoSource(value: unknown): VideoSource | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<VideoSource>;
  return { burned: v.burned === true, watermarked: v.watermarked === true, narrated: v.narrated === true || v.voice === true, voice: v.voice === true };
}

/** Job.reel read back defensively: defaults for anything missing, null when it isn't a reel. */
export function parseReel(value: unknown): ReelJob | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<ReelJob>;
  if (typeof v.key !== "string") return null;
  const flag = (x: unknown, fallback: boolean) => (typeof x === "boolean" ? x : fallback);
  return {
    key: v.key,
    fileName: typeof v.fileName === "string" ? v.fileName : "video",
    bytes: Number(v.bytes) || 0,
    durationSec: Number(v.durationSec) || 0,
    width: Number(v.width) || null,
    height: Number(v.height) || null,
    style: REEL_STYLES.includes(v.style as ReelStyle) ? (v.style as ReelStyle) : REEL_DEFAULTS.style,
    look: parseLookChanges(v.look),
    export: parseExport(v.export),
    fonts: parseFonts(v.fonts),
    emojis: flag(v.emojis, REEL_DEFAULTS.emojis),
    zooms: flag(v.zooms, REEL_DEFAULTS.zooms),
    sfx: flag(v.sfx, REEL_DEFAULTS.sfx),
    hook: flag(v.hook, REEL_DEFAULTS.hook),
    // Reels from before B-roll had none.
    broll: flag(v.broll, false),
    ...(v.captions === false ? { captions: false } : {}),
    ...(parseVideoSource(v.video) ? { video: parseVideoSource(v.video)! } : {}),
    language: REEL_LANGUAGES.includes(v.language as ReelLanguage) ? (v.language as ReelLanguage) : REEL_DEFAULTS.language,
    // Reels from before cleanup cut nothing.
    cleanup: REEL_CLEANUPS.includes(v.cleanup as ReelCleanup) ? (v.cleanup as ReelCleanup) : "off",
    editStyle: isEditStyle(v.editStyle) ? v.editStyle : REEL_DEFAULTS.editStyle,
    strength: isStrength(v.strength) ? v.strength : REEL_DEFAULTS.strength,
  };
}

/**
 * What a customer sees when a reel fails; the technical error stays in the database. The runner starts its own
 * failures with these phrases (runner/src/reel.ts).
 */
export function reelError(error: string | null | undefined): string {
  if (/^Too long/.test(error ?? "")) return `This video is longer than the credits spent on it cover (1 credit per ${REEL_SECONDS_PER_CREDIT} seconds of video).`;
  if (/^Not a video/.test(error ?? "")) return "We couldn't read that file as a video. Export it as an MP4, MOV or WebM and upload it again.";
  if (/^No speech/.test(error ?? "")) return "We couldn't hear anyone speaking in this video, so there was nothing to caption.";
  if (/^Unsupported language/.test(error ?? "")) return "Captions work for English and Hinglish for now. Choose one of those, or try another video.";
  if (/^Upload missing/.test(error ?? "")) return "We couldn't find your upload. Please upload the video again.";
  return customerError(error);
}
