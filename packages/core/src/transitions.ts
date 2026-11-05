// Transitions between shots: a crossfade, a wipe, a push, a circle opening... at a jump cut (where a stretch was cut out)
// or where the video cuts from one shot to the next. Each is one of ffmpeg's xfade transitions, played across the joint
// as a short "patch" over the cut video: half before the joint, half after. A jump cut has real picture on both sides
// to mix (the footage just past each side of the cut, from the stretch that was cut out); a cut inside the video has
// none, so each side holds its edge frame. Nothing moves on the clock: the video keeps its length, the words, sounds,
// effects and B-roll keep their times, and the sound still cuts at the joint. Some come with one of the effects
// (effects.ts) laid over the joint, for a zoom, twist or flash through it.
//
// The render (runner/src/reel.ts) and the editor's preview both play them from transitionJoints(), so they agree on
// where each runs and what it shows.
import { EFFECTS, type PlacedEffect, type ReelEffect } from "./effects";
import type { ReelSound } from "./sounds";
import { cutClock, keptSegments, REEL_FPS, toFrame, type Trim } from "./trims";

export type TransitionKind =
  | "mix"
  | "black"
  | "white"
  | "gray"
  | "dissolve"
  | "wipe"
  | "softwipe"
  | "push"
  | "diagonal"
  | "slices"
  | "open"
  | "close"
  | "circleopen"
  | "circleclose"
  | "iris"
  | "box"
  | "clock"
  | "pixelate"
  | "blur"
  | "squeeze"
  | "zoomin"
  | "zoomout"
  | "twist"
  | "whip"
  | "glitch"
  | "shake"
  | "leak"
  | "flash";

/**
 * Which way a transition goes: toward a side or a corner, or (split and squeeze) by ffmpeg's own names for the line it
 * works along: v, a vertical line (a split that opens side to side), h, a horizontal one (a squeeze up and down).
 */
export type TransitionDir = "left" | "right" | "up" | "down" | "tl" | "tr" | "bl" | "br" | "h" | "v";
export const TRANSITION_DIRS: readonly TransitionDir[] = ["left", "right", "up", "down", "tl", "tr", "bl", "br", "h", "v"];

export type TransitionSpec = {
  label: string;
  hint: string;
  /** ffmpeg's xfade transition, one for all, or one for each direction (the first is the default). */
  xfade: string | Partial<Record<TransitionDir, string>>;
  /** Its length in seconds as it comes. */
  length: number;
  /** An effect laid over the joint with it (at the joint, its own length). */
  effect?: ReelEffect;
  /** The sound it brings when it's added (the customer can change or drop it). */
  sound: ReelSound | null;
};

const SIDES = { left: "left", right: "right", up: "up", down: "down" } as const;
const each = (prefix: string, dirs: Record<string, string>) => Object.fromEntries(Object.entries(dirs).map(([d, s]) => [d, `${prefix}${s}`])) as Partial<Record<TransitionDir, string>>;

export const TRANSITIONS: Record<TransitionKind, TransitionSpec> = {
  mix: { label: "Mix", hint: "A crossfade from one shot to the next", xfade: "fade", length: 0.5, sound: null },
  black: { label: "Black fade", hint: "Fades through black", xfade: "fadeblack", length: 0.6, sound: null },
  white: { label: "White fade", hint: "Fades through white", xfade: "fadewhite", length: 0.5, sound: null },
  gray: { label: "Grey fade", hint: "Fades through black and white", xfade: "fadegrays", length: 0.6, sound: null },
  dissolve: { label: "Dissolve", hint: "Breaks up into the next shot, dot by dot", xfade: "dissolve", length: 0.5, sound: null },
  wipe: { label: "Wipe", hint: "A hard edge sweeps the next shot in", xfade: { ...each("wipe", SIDES), tl: "wipetl", tr: "wipetr", bl: "wipebl", br: "wipebr" }, length: 0.4, sound: "swoosh" },
  softwipe: { label: "Soft wipe", hint: "A soft edge sweeps the next shot in", xfade: each("smooth", SIDES), length: 0.5, sound: "swoosh" },
  push: { label: "Push", hint: "The next shot pushes this one out", xfade: each("slide", SIDES), length: 0.4, sound: "whoosh" },
  diagonal: { label: "Diagonal", hint: "Sweeps in from a corner", xfade: { tl: "diagtl", tr: "diagtr", bl: "diagbl", br: "diagbr" }, length: 0.5, sound: "swoosh" },
  slices: { label: "Slices", hint: "Comes in in staggered strips", xfade: { left: "hlslice", right: "hrslice", up: "vuslice", down: "vdslice" }, length: 0.5, sound: "swoosh" },
  open: { label: "Split open", hint: "This shot splits open onto the next", xfade: { v: "vertopen", h: "horzopen" }, length: 0.5, sound: "whoosh" },
  close: { label: "Split close", hint: "The next shot closes in from both sides", xfade: { v: "vertclose", h: "horzclose" }, length: 0.5, sound: "whoosh" },
  circleopen: { label: "Circle open", hint: "A circle opens onto the next shot", xfade: "circleopen", length: 0.5, sound: "whoosh" },
  circleclose: { label: "Circle close", hint: "A circle closes onto the next shot", xfade: "circleclose", length: 0.5, sound: "whoosh" },
  iris: { label: "Iris", hint: "Closes to a circle, then opens on the next shot", xfade: "circlecrop", length: 0.6, sound: null },
  box: { label: "Box", hint: "Closes to a box, then opens on the next shot", xfade: "rectcrop", length: 0.6, sound: null },
  clock: { label: "Clock", hint: "Sweeps round like a clock hand", xfade: "radial", length: 0.6, sound: "swoosh" },
  pixelate: { label: "Pixelate", hint: "Breaks into blocks and back", xfade: "pixelize", length: 0.5, sound: "glitch" },
  blur: { label: "Blur", hint: "Blurs across to the next shot", xfade: "hblur", length: 0.5, sound: "swoosh" },
  squeeze: { label: "Squeeze", hint: "Squeezes this shot away", xfade: { h: "squeezeh", v: "squeezev" }, length: 0.5, sound: "whoosh" },
  zoomin: { label: "Zoom in", hint: "Rushes in through the cut", xfade: "fade", length: 0.3, effect: "pullin", sound: "whoosh" },
  zoomout: { label: "Zoom out", hint: "Lands close and pulls back", xfade: "fade", length: 0.3, effect: "pullout", sound: "swoosh" },
  twist: { label: "Twist", hint: "Twists through the cut", xfade: "fade", length: 0.3, effect: "twist", sound: "swoosh" },
  whip: { label: "Whip", hint: "Whips sideways into the next shot", xfade: "fade", length: 0.2, effect: "whip", sound: "whoosh" },
  glitch: { label: "Glitch", hint: "Glitches into the next shot", xfade: "fade", length: 0.2, effect: "glitch", sound: "glitch" },
  shake: { label: "Shake", hint: "Shakes as it cuts", xfade: "fade", length: 0.2, effect: "shake", sound: "boom" },
  leak: { label: "Light leak", hint: "A warm flare washes over the cut", xfade: "fade", length: 0.6, effect: "leak", sound: null },
  flash: { label: "Flash", hint: "A white flash covers the cut", xfade: "fadewhite", length: 0.3, effect: "flash", sound: "shutter" },
};
export const REEL_TRANSITIONS = Object.keys(TRANSITIONS) as TransitionKind[];
export const isTransitionKind = (v: unknown): v is TransitionKind => typeof v === "string" && v in TRANSITIONS;

/** How long a transition can run, in seconds (it also has to fit its shots, see transitionJoints). */
export const TRANSITION_LENGTH = { min: 0.2, max: 1.5 } as const;

/** The directions a transition can go, the first its default; none when it has no direction. */
export function transitionDirs(kind: TransitionKind): TransitionDir[] {
  const x = TRANSITIONS[kind].xfade;
  return typeof x === "string" ? [] : (Object.keys(x) as TransitionDir[]);
}

/** ffmpeg's xfade transition for a kind going a way (its default way when that one isn't one of its own). */
export function xfadeName(kind: TransitionKind, dir?: TransitionDir): string {
  const x = TRANSITIONS[kind].xfade;
  if (typeof x === "string") return x;
  return (dir && x[dir]) || Object.values(x)[0]!;
}

/**
 * A transition placed in an edit: `at` is where the next shot starts, on the upload's clock (a trim's end, for a jump
 * cut, or one of the edit's `cuts`); its kind, which way it goes, and how long it runs.
 */
export type PlacedTransition = { at: number; kind: TransitionKind; dir?: TransitionDir; length: number };

const MAX_TRANSITIONS = 300;
const round = (t: number) => Math.round(t * 1000) / 1000;

/** Transitions read back defensively: known kinds and ways, lengths in range, on whole frames, one a moment, in order. */
export function parseTransitions(value: unknown, duration: number): PlacedTransition[] {
  if (!Array.isArray(value) || !(duration > 0)) return [];
  const byFrame = new Map<number, PlacedTransition>();
  for (const x of value) {
    const t = (x ?? {}) as Partial<PlacedTransition>;
    if (!isTransitionKind(t.kind)) continue;
    const at = toFrame(Number(t.at));
    if (!Number.isFinite(at) || at <= 0 || at >= duration) continue;
    const length = typeof t.length === "number" && Number.isFinite(t.length) ? Math.min(TRANSITION_LENGTH.max, Math.max(TRANSITION_LENGTH.min, round(t.length))) : TRANSITIONS[t.kind].length;
    const dirs = transitionDirs(t.kind);
    const dir = dirs.length ? (dirs.includes(t.dir as TransitionDir) ? (t.dir as TransitionDir) : dirs[0]) : undefined;
    byFrame.set(Math.round(at * REEL_FPS), { at: round(at), kind: t.kind, ...(dir ? { dir } : {}), length });
  }
  return [...byFrame.values()].sort((a, b) => a.at - b.at).slice(0, MAX_TRANSITIONS);
}

/**
 * A transition where it plays. `joint` is the moment on the cut video's clock; it runs `length` (whole frames) from
 * `start`, half before the joint and half after (an odd frame falls after). Its two sides are read from the upload: the
 * outgoing shot from `out[0]` to `out[1]`, the incoming one from `in[0]` to `in[1]`. A side shorter than the transition
 * holds its edge frame for the rest: the outgoing one its last frame, at the end; the incoming one its first, at the
 * start. That's a cut inside the video (no picture past the joint), or a jump cut whose cut-out stretch is shorter than
 * half the transition (`hold` says either side is short). `at` is the placed transition's (upload clock).
 */
export type TransitionJoint = {
  at: number;
  joint: number;
  start: number;
  length: number;
  kind: TransitionKind;
  dir?: TransitionDir;
  xfade: string;
  out: [number, number];
  in: [number, number];
  /** A side is short: the outgoing one holds its last frame after `out[1]`, the incoming its first before `in[0]`. */
  hold: boolean;
};

const near = (a: number, b: number) => Math.abs(a - b) < 0.5 / REEL_FPS;
/** Whole frames in `t` seconds, rounded down. */
const framesIn = (t: number) => Math.floor(t * REEL_FPS + 1e-6);
/** A length in whole frames, split around the joint: frames before it and after it (the odd one after), in seconds. */
const split = (frames: number) => [Math.floor(frames / 2) / REEL_FPS, (frames - Math.floor(frames / 2)) / REEL_FPS] as const;

/**
 * Where each placed transition plays, fitted to its shots, in order on the cut video's clock. A transition at a jump
 * cut (a trim's end) mixes the end of the shot before, running on into the cut stretch, with the start of the shot after,
 * from just before it: half of it fits in each shot, and each side runs on into the stretch cut out as far as it goes
 * (holding its edge frame past that, when the stretch is short: cutting one word leaves only a few frames). One at a
 * cut inside the video (one of `cuts`, not cut out) holds each side's edge frame, and fits inside its stretch of the
 * upload. Shortened to fit, on whole frames; dropped when there's no joint there any more (its trim was put back), when
 * it can't run for TRANSITION_LENGTH.min, or when it would overlap the one before.
 */
export function transitionJoints(edit: { duration: number; trims: readonly Trim[]; cuts: readonly number[]; transitions?: readonly PlacedTransition[] }): TransitionJoint[] {
  const placed = edit.transitions ?? [];
  if (!placed.length) return [];
  const clock = cutClock(edit.duration, edit.trims);
  const segments = keptSegments(edit.duration, edit.trims);
  const segmentOf = (t: number) => segments.find(([a, b]) => t >= a - 1e-6 && t <= b + 1e-6);
  const out: TransitionJoint[] = [];
  for (const t of placed) {
    const trim = edit.trims.findIndex((x) => near(x.end, t.at));
    let joint: TransitionJoint | null = null;
    if (trim >= 0) {
      // A jump cut: the kept stretch before ends at the trim's start, the one after starts at its end.
      const { start, end } = edit.trims[trim];
      const before = segments.find(([, b]) => near(b, start));
      const after = segments.find(([a]) => near(a, end));
      if (!before || !after) continue;
      // Each half fits in the shot on its side; the footage past each side comes from the stretch cut out, as far as it goes.
      const frames = Math.min(Math.round(t.length * REEL_FPS), 2 * Math.min(framesIn(before[1] - before[0]), framesIn(after[1] - after[0])));
      const [pre, post] = split(frames);
      const gap = framesIn(end - start + 1e-6) / REEL_FPS;
      const j = round(clock.toCut(end));
      joint = { at: t.at, joint: j, start: round(j - pre), length: round(frames / REEL_FPS), kind: t.kind, ...(t.dir ? { dir: t.dir } : {}), xfade: xfadeName(t.kind, t.dir), out: [round(start - pre), round(start + Math.min(post, gap))], in: [round(end - Math.min(pre, gap)), round(end + post)], hold: post > gap + 1e-6 || pre > gap + 1e-6 };
    } else if (edit.cuts.some((c) => near(c, t.at)) && clock.isKept(t.at)) {
      // A cut inside the video: no picture past it, so each side holds its edge frame.
      const seg = segmentOf(t.at);
      if (!seg) continue;
      const frames = Math.min(Math.round(t.length * REEL_FPS), 2 * Math.min(framesIn(t.at - seg[0]), framesIn(seg[1] - t.at)));
      const [pre, post] = split(frames);
      const j = round(clock.toCut(t.at));
      joint = { at: t.at, joint: j, start: round(j - pre), length: round(frames / REEL_FPS), kind: t.kind, ...(t.dir ? { dir: t.dir } : {}), xfade: xfadeName(t.kind, t.dir), out: [round(t.at - pre), round(t.at)], in: [round(t.at), round(t.at + post)], hold: true };
    }
    if (!joint || joint.length < TRANSITION_LENGTH.min - 1e-6) continue;
    const last = out[out.length - 1];
    if (last && joint.start < last.start + last.length - 1e-6) continue;
    out.push(joint);
  }
  return out;
}

/** The effects the transitions bring, at their joints (on the cut video's clock), to add to the edit's own. */
export function transitionEffects(joints: readonly TransitionJoint[]): PlacedEffect[] {
  return joints.flatMap((j) => {
    const effect = TRANSITIONS[j.kind].effect;
    return effect ? [{ at: j.joint, effect, length: EFFECTS[effect].length }] : [];
  });
}

/** The places a transition can go, on the upload's clock: every jump cut (a trim's end) and every cut not cut out. */
export function transitionPlaces(edit: { duration: number; trims: readonly Trim[]; cuts: readonly number[] }): number[] {
  const clock = cutClock(edit.duration, edit.trims);
  const ends = edit.trims.map((t) => t.end).filter((e) => e > 0 && e < edit.duration);
  const cuts = edit.cuts.filter((c) => clock.isKept(c) && !ends.some((e) => near(e, c)));
  return [...ends, ...cuts].map((t) => round(toFrame(t))).sort((a, b) => a - b);
}

/**
 * An edit with new trims, its transitions following them (the editor and the chat both cut through this): one at a jump
 * cut moves to its trim's new end when the trim grows past it (a word beside it cut too), and goes, with the sound it
 * brought, when its stretch is put back. Transitions at cuts inside the video stay where they are.
 */
export function withTrims<E extends { duration: number; trims: Trim[]; transitions: PlacedTransition[]; sounds: { at: number; sound: ReelSound }[] }>(edit: E, next: Trim[]): E {
  const same = (a: number, b: number) => Math.abs(a - b) < 0.001;
  const moves = new Map<PlacedTransition, number | null>();
  for (const t of edit.transitions) {
    if (!edit.trims.some((x) => same(x.end, t.at)) || next.some((x) => same(x.end, t.at))) continue;
    const grown = next.find((x) => x.start <= t.at + 0.001 && x.end > t.at);
    const taken = (at: number) => edit.transitions.some((o) => same(o.at, at)) || [...moves.values()].some((m) => m !== null && same(m, at));
    moves.set(t, grown && !taken(grown.end) ? grown.end : null);
  }
  if (!moves.size) return { ...edit, trims: next };
  const sounds = edit.sounds.flatMap((s) => {
    const t = [...moves.keys()].find((x) => same(x.at, s.at) && TRANSITIONS[x.kind].sound === s.sound);
    if (!t) return [s];
    const to = moves.get(t);
    return to === null || to === undefined ? [] : [{ ...s, at: to }];
  });
  const transitions = edit.transitions.flatMap((t) => {
    const to = moves.get(t);
    return to === undefined ? [t] : to === null ? [] : [{ ...t, at: to }];
  });
  return { ...edit, trims: next, transitions: parseTransitions(transitions, edit.duration), sounds: sounds.sort((a, b) => a.at - b.at) };
}
