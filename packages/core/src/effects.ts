// Transitions and effects for reels, as curves over time. The render turns them into ffmpeg expressions
// (runner/src/reel.ts: zoompan, rotate, eq, gblur, rgbashift, noise, hue, negate, and an overlay for light leaks) and the
// editor's preview evaluates them every frame (CSS transforms, overlays and SVG filters), from the same numbers, so an
// effect looks the same in both.
//
// An effect sits at a moment (a cut, or a word as it's said) and runs for its length; most build up to the moment and
// land on it, like a flash covering a cut.

import type { ReelSound } from "./sounds";

export type ReelEffect =
  | "flash"
  | "pullin"
  | "pullout"
  | "shake"
  | "glitch"
  | "blur"
  | "blackout"
  | "strobe"
  | "pulse"
  | "slam"
  | "whip"
  | "twist"
  | "rgbsplit"
  | "tape"
  | "invert"
  | "mono"
  | "leak"
  | "push"
  | "drift";
export const REEL_EFFECTS: readonly ReelEffect[] = ["flash", "pullin", "pullout", "shake", "glitch", "blur", "blackout", "strobe", "pulse", "slam", "whip", "twist", "rgbsplit", "tape", "invert", "mono", "leak", "push", "drift"];

/** How a curve runs into a key: straight, easing in or out, both, or holding the last value and jumping at the key. */
export type Ease = "linear" | "in" | "out" | "inout" | "hold";
/** A key: when (a share of the effect's length from its moment; negative is before it), the value, and how it's reached. */
export type Key = readonly [at: number, v: number, ease?: Ease];
/** A wobble over time: a sine (a shake) or random jumps `hz` times a second (a glitch), sized by its `amp` curve. */
export type Wobble = { kind: "sine" | "jitter"; hz: number; seed: number; amp: readonly Key[] };

/**
 * What an effect does, each a curve over its length (zero outside its keys):
 * - zoom: added to the zoom (0.25 is 25% closer); dx, dy: the picture moved, as shares of the frame (zoom makes the room),
 *   by a wobble or along a curve (a pan); rot: turned about the middle, in degrees (zoom must cover the corners)
 * - white, black: the picture mixed toward white or black (0 to 1); leak: a warm light leak over it, from the top left
 *   (its strength, 0 to 1)
 * - blur: a Gaussian blur, its sigma a share of the frame's width; hblur: the same, sideways only (motion blur); rgb: red
 *   and blue pulled apart, a share of the width; noise: grain (0 to 1); invert: the picture as a negative; mono: in black
 *   and white. These hold their values in steps (the render switches filters on and off; invert and mono are on or off).
 */
export type EffectSpec = {
  label: string;
  hint: string;
  /** Its length in seconds as it comes, and the slider's range. */
  length: number;
  min: number;
  max: number;
  /** The sound it brings when it's added (the customer can change or drop it). */
  sound: ReelSound | null;
  zoom?: readonly Key[];
  dx?: Wobble | readonly Key[];
  dy?: Wobble | readonly Key[];
  rot?: readonly Key[];
  white?: readonly Key[];
  black?: readonly Key[];
  leak?: readonly Key[];
  blur?: readonly Key[];
  hblur?: readonly Key[];
  rgb?: readonly Key[];
  noise?: readonly Key[];
  invert?: readonly Key[];
  mono?: readonly Key[];
};

/** A light leak's colour (ffmpeg's and CSS's), and where it fades out along the diagonal from the top left (shares). */
export const LEAK = { r: 255, g: 122, b: 48, full: 0.125, gone: 0.75 } as const;

export const EFFECTS: Record<ReelEffect, EffectSpec> = {
  flash: { label: "Flash", hint: "A white flash on the moment", length: 0.3, min: 0.1, max: 1, sound: "shutter", white: [[-0.2, 0], [0, 1], [0.1, 1], [0.8, 0]] },
  pullin: { label: "Pull in", hint: "Rushes in to the moment, then settles", length: 0.4, min: 0.2, max: 1, sound: "whoosh", zoom: [[-0.6, 0], [0, 0.25, "in"], [0.6, 0, "out"]], blur: [[-0.2, 0.005], [0.2, 0.005]] },
  pullout: { label: "Pull out", hint: "Lands close, then pulls back", length: 0.4, min: 0.2, max: 1, sound: "swoosh", zoom: [[0, 0.3], [1, 0, "out"]], blur: [[0, 0.004], [0.3, 0.004]] },
  shake: {
    label: "Shake",
    hint: "A camera shake that settles",
    length: 0.5,
    min: 0.2,
    max: 1.5,
    sound: "boom",
    zoom: [[-0.1, 0], [0, 0.07, "out"], [0.8, 0.07], [1, 0, "inout"]],
    dx: { kind: "sine", hz: 13, seed: 0, amp: [[0, 0.03], [1, 0]] },
    dy: { kind: "sine", hz: 9, seed: 1.7, amp: [[0, 0.02], [1, 0]] },
  },
  glitch: {
    label: "Glitch",
    hint: "Colour split and jumps",
    length: 0.3,
    min: 0.15,
    max: 1,
    sound: "glitch",
    zoom: [[0, 0.05], [1, 0.05]],
    dx: { kind: "jitter", hz: 18, seed: 3, amp: [[0, 0.025], [1, 0.025]] },
    rgb: [[0, 0.012], [1, 0.012]],
    noise: [[0, 0.5], [1, 0.5]],
  },
  blur: {
    label: "Blur",
    hint: "Blurs out and back on the moment",
    length: 0.4,
    min: 0.2,
    max: 1.5,
    sound: "swoosh",
    blur: [[-0.5, 0.004], [-0.25, 0.008, "hold"], [-0.1, 0.012, "hold"], [0.1, 0.008, "hold"], [0.25, 0.004, "hold"], [0.5, 0, "hold"]],
  },
  blackout: { label: "Black fade", hint: "Dips to black and back", length: 0.5, min: 0.2, max: 1.5, sound: "whoosh", black: [[-0.4, 0], [0, 1], [0.1, 1], [0.6, 0]] },
  strobe: {
    label: "Strobe",
    hint: "Three quick flashes",
    length: 0.5,
    min: 0.3,
    max: 1.5,
    sound: "shutter",
    white: [[0, 0], [0.06, 1], [0.24, 0], [0.36, 0], [0.42, 1], [0.6, 0], [0.72, 0], [0.78, 1], [0.96, 0]],
  },
  pulse: { label: "Pulse", hint: "Two beats closer, like a heartbeat", length: 0.6, min: 0.3, max: 1.5, sound: "hit", zoom: [[0, 0], [0.15, 0.07, "out"], [0.4, 0, "inout"], [0.55, 0.07, "out"], [0.9, 0, "inout"]] },
  slam: {
    label: "Slam",
    hint: "Slams in hard, then settles",
    length: 0.5,
    min: 0.25,
    max: 1.2,
    sound: "punch",
    zoom: [[0, 0.3], [0.3, 0.1, "out"], [1, 0, "inout"]],
    dy: { kind: "sine", hz: 14, seed: 0.5, amp: [[0, 0.025], [0.6, 0]] },
    white: [[0, 0.35], [0.15, 0]],
  },
  // The picture shoots one way into the moment and arrives from the other, blurred sideways.
  whip: {
    label: "Whip pan",
    hint: "Swipes sideways with motion blur",
    length: 0.4,
    min: 0.2,
    max: 1,
    sound: "whoosh",
    zoom: [[-0.5, 0], [-0.2, 0.18, "in"], [0.3, 0.18], [0.6, 0, "out"]],
    dx: [[-0.5, 0], [0, -0.08, "in"], [0.001, 0.08, "hold"], [0.5, 0, "out"]],
    hblur: [[-0.35, 0.004], [-0.15, 0.014, "hold"], [0.15, 0.004, "hold"], [0.35, 0, "hold"]],
  },
  // The zoom always covers the corners the turn would show: 8° needs about 24% more on any 16:9 or 9:16 frame.
  twist: {
    label: "Twist",
    hint: "A quick twist with a push in",
    length: 0.45,
    min: 0.2,
    max: 1,
    sound: "swoosh",
    zoom: [[-0.5, 0], [0, 0.34, "in"], [0.7, 0, "out"]],
    rot: [[-0.5, 0], [0, 8, "in"], [0.7, 0, "out"]],
    blur: [[-0.15, 0.003], [0.15, 0.003]],
  },
  rgbsplit: {
    label: "RGB split",
    hint: "The colours tear apart, then snap back",
    length: 0.35,
    min: 0.15,
    max: 1,
    sound: "glitch",
    zoom: [[0, 0.06], [1, 0, "out"]],
    rgb: [[0, 0.024], [0.35, 0.012, "hold"], [0.7, 0.005, "hold"], [1, 0, "hold"]],
  },
  tape: {
    label: "Tape",
    hint: "A VHS tracking glitch",
    length: 0.6,
    min: 0.3,
    max: 2,
    sound: "glitch",
    zoom: [[0, 0.05], [1, 0.05]],
    dx: { kind: "jitter", hz: 24, seed: 9, amp: [[0, 0.006], [1, 0.006]] },
    dy: { kind: "jitter", hz: 10, seed: 5, amp: [[0, 0.015], [1, 0.015]] },
    rgb: [[0, 0.008], [1, 0.008]],
    noise: [[0, 0.7], [1, 0.7]],
    hblur: [[0, 0.002], [1, 0.002]],
  },
  invert: { label: "Invert", hint: "Two quick negative flashes", length: 0.4, min: 0.2, max: 1, sound: "glitch", invert: [[0, 1], [0.25, 0, "hold"], [0.5, 1, "hold"], [0.75, 0, "hold"]] },
  mono: { label: "Black & white", hint: "Drops to black and white for a beat", length: 1.5, min: 0.5, max: 5, sound: null, mono: [[0, 1], [1, 1]] },
  leak: {
    label: "Light leak",
    hint: "A warm flare washes over",
    length: 1,
    min: 0.5,
    max: 2.5,
    sound: null,
    leak: [[-0.4, 0], [0, 0.7, "out"], [0.3, 0.7], [1, 0, "inout"]],
    white: [[-0.1, 0], [0, 0.12], [0.25, 0]],
  },
  // Camera moves, for a whole shot: put one on a cut and stretch it toward the next.
  push: { label: "Slow push", hint: "Pushes in slowly, then eases back", length: 3, min: 1, max: 8, sound: null, zoom: [[0, 0], [0.85, 0.12, "inout"], [1, 0, "inout"]] },
  drift: {
    label: "Drift",
    hint: "A slow sideways drift",
    length: 3,
    min: 1,
    max: 8,
    sound: null,
    zoom: [[0, 0], [0.15, 0.1, "inout"], [0.85, 0.1], [1, 0, "inout"]],
    dx: [[0, 0], [0.15, -0.035, "inout"], [0.85, 0.035], [1, 0, "inout"]],
  },
};

export const isReelEffect = (value: unknown): value is ReelEffect => typeof value === "string" && value in EFFECTS;

/** An effect placed in a reel: its moment (seconds), what it is, and how long it runs. */
export type PlacedEffect = { at: number; effect: ReelEffect; length: number };

/* ---------- evaluating ---------- */

const easeOf = (ease: Ease | undefined, p: number) => (ease === "in" ? p * p * p : ease === "out" ? 1 - (1 - p) ** 3 : ease === "inout" ? 0.5 - 0.5 * Math.cos(Math.PI * p) : p);

/** A curve's value at `x` (a share of the length from the moment): zero before its first key and from its last on. */
export function curveAt(keys: readonly Key[], x: number): number {
  if (keys.length < 2 || x < keys[0][0] || x >= keys[keys.length - 1][0]) return 0;
  for (let k = 1; k < keys.length; k++) {
    const [a, va] = keys[k - 1];
    const [b, vb, ease] = keys[k];
    if (x < b) return ease === "hold" ? va : va + (vb - va) * easeOf(ease, (x - a) / (b - a));
  }
  return 0;
}

const fract = (n: number) => n - Math.floor(n);
const isWobble = (m: Wobble | readonly Key[]): m is Wobble => !Array.isArray(m);

/** A move at `u` seconds from the moment (x = u / length): a wobble, or a curve. */
function moveAt(m: Wobble | readonly Key[], u: number, x: number): number {
  return isWobble(m) ? wobbleAt(m, u, x) : curveAt(m, x);
}

/** A wobble at `u` seconds from the moment (x = u / length). */
function wobbleAt(w: Wobble, u: number, x: number): number {
  const amp = curveAt(w.amp, x);
  if (!amp) return 0;
  return w.kind === "sine" ? amp * Math.sin(2 * Math.PI * w.hz * u + w.seed) : amp * (2 * fract(Math.sin((Math.floor(u * w.hz) + w.seed) * 12.9898) * 43758.5453) - 1);
}

/**
 * What the effects do to the picture at `t`: the channels added up (white, black and leak at most 1; invert and mono on
 * or off).
 */
export type EffectFrame = { zoom: number; dx: number; dy: number; rot: number; white: number; black: number; leak: number; blur: number; hblur: number; rgb: number; noise: number; invert: boolean; mono: boolean };

/** No effect: the picture as it is. */
export const NO_EFFECT: Readonly<EffectFrame> = { zoom: 0, dx: 0, dy: 0, rot: 0, white: 0, black: 0, leak: 0, blur: 0, hblur: 0, rgb: 0, noise: 0, invert: false, mono: false };

export function effectsAt(effects: readonly PlacedEffect[], t: number): EffectFrame {
  const f: EffectFrame = { ...NO_EFFECT };
  for (const e of effects) {
    const spec = EFFECTS[e.effect];
    const u = t - e.at;
    const x = u / e.length;
    if (x < -1 || x > 1.2) continue;
    if (spec.zoom) f.zoom += curveAt(spec.zoom, x);
    if (spec.dx) f.dx += moveAt(spec.dx, u, x);
    if (spec.dy) f.dy += moveAt(spec.dy, u, x);
    if (spec.rot) f.rot += curveAt(spec.rot, x);
    if (spec.white) f.white += curveAt(spec.white, x);
    if (spec.black) f.black += curveAt(spec.black, x);
    if (spec.leak) f.leak += curveAt(spec.leak, x);
    if (spec.blur) f.blur += curveAt(spec.blur, x);
    if (spec.hblur) f.hblur += curveAt(spec.hblur, x);
    if (spec.rgb) f.rgb += curveAt(spec.rgb, x);
    if (spec.noise) f.noise += curveAt(spec.noise, x);
    if (spec.invert && curveAt(spec.invert, x) > 0) f.invert = true; // overlapping ones don't cancel, as in the render
    if (spec.mono && curveAt(spec.mono, x) > 0) f.mono = true;
  }
  f.white = Math.min(1, f.white);
  f.black = Math.min(1, f.black);
  f.leak = Math.min(1, f.leak);
  return f;
}

/** Where the effect starts and stops changing the picture, in seconds. */
export function effectSpan(e: PlacedEffect): [number, number] {
  const spec = EFFECTS[e.effect];
  const move = (m: Wobble | readonly Key[] | undefined) => (m ? (isWobble(m) ? m.amp : m) : undefined);
  const curves = [spec.zoom, spec.rot, spec.white, spec.black, spec.leak, spec.blur, spec.hblur, spec.rgb, spec.noise, spec.invert, spec.mono, move(spec.dx), move(spec.dy)].filter((c): c is readonly Key[] => Boolean(c?.length));
  const from = Math.min(...curves.map((c) => c[0][0]));
  const to = Math.max(...curves.map((c) => c[c.length - 1][0]));
  return [e.at + from * e.length, e.at + to * e.length];
}

/* ---------- as ffmpeg expressions ---------- */

// Numbers for ffmpeg's expression evaluator: negatives in brackets, no exponent notation.
const num = (n: number) => {
  const s = (Math.round(n * 1e6) / 1e6).toString();
  return n < 0 ? `(${s})` : s;
};

const easeExpr = (ease: Ease | undefined, p: string) =>
  ease === "in" ? `pow(${p},3)` : ease === "out" ? `(1-pow(1-${p},3))` : ease === "inout" ? `(0.5-0.5*cos(PI*${p}))` : p;

/** curveAt as an ffmpeg expression of `x` (an expression too). Empty when the curve is never on. */
export function curveExpr(keys: readonly Key[], x: string): string {
  const terms: string[] = [];
  for (let k = 1; k < keys.length; k++) {
    const [a, va] = keys[k - 1];
    const [b, vb, ease] = keys[k];
    const value = ease === "hold" ? num(va) : `(${num(va)}+${num(vb - va)}*${easeExpr(ease, `((${x}-${num(a)})/${num(b - a)})`)})`;
    if (va === 0 && (ease === "hold" || vb === 0)) continue;
    terms.push(`gte(${x},${num(a)})*lt(${x},${num(b)})*${value}`);
  }
  return terms.join("+");
}

/** A wobble as an ffmpeg expression of `u` (seconds from the moment) and `x` (u / length). */
function wobbleExpr(w: Wobble, u: string, x: string): string {
  const amp = curveExpr(w.amp, x);
  if (!amp) return "";
  if (w.kind === "sine") return `(${amp})*sin(2*PI*${num(w.hz)}*${u}+${num(w.seed)})`;
  const r = `sin((floor(${u}*${num(w.hz)})+${num(w.seed)})*12.9898)*43758.5453`;
  return `(${amp})*(2*(${r}-floor(${r}))-1)`;
}

/** One channel of all the effects as an expression of the time `t` (also an expression), or "0". */
export function channelExpr(effects: readonly PlacedEffect[], channel: "zoom" | "dx" | "dy" | "rot" | "white" | "black" | "leak", t: string): string {
  const terms = effects.flatMap((e) => {
    const spec = EFFECTS[e.effect];
    const u = `(${t}-${num(e.at)})`;
    const x = `(${u}/${num(e.length)})`;
    if (channel === "dx" || channel === "dy") {
      const m = spec[channel];
      return m ? [isWobble(m) ? wobbleExpr(m, u, x) : curveExpr(m, x)].filter(Boolean) : [];
    }
    const keys = spec[channel];
    return keys ? [curveExpr(keys, x)].filter(Boolean) : [];
  });
  if (!terms.length) return "0";
  const sum = terms.map((s) => `(${s})`).join("+");
  return channel === "white" || channel === "black" || channel === "leak" ? `min(1,${sum})` : sum;
}

/** The windows (seconds) in which effects with a channel change the picture, for a filter's `enable`. */
export function channelWindows(effects: readonly PlacedEffect[], channel: "rot" | "leak"): [number, number][] {
  return effects.filter((e) => EFFECTS[e.effect][channel]).map(effectSpan);
}

/**
 * The stepped channels (blur, hblur, rgb, noise, invert, mono) as levels with the windows each is on in: the render runs
 * one filter per level, switched on in its windows (the steps of every effect at that level).
 */
export function channelSteps(effects: readonly PlacedEffect[], channel: "blur" | "hblur" | "rgb" | "noise" | "invert" | "mono"): { level: number; windows: [number, number][] }[] {
  const levels = new Map<number, [number, number][]>();
  for (const e of effects) {
    const keys = EFFECTS[e.effect][channel];
    if (!keys) continue;
    for (let k = 1; k < keys.length; k++) {
      const [a, va] = keys[k - 1];
      const [b, vb, ease] = keys[k];
      // Steps hold their value; a straight run between equal values is a step too.
      const level = ease === "hold" || va === vb ? va : (va + vb) / 2;
      if (!level) continue;
      const key = Math.round(level * 1e5) / 1e5;
      levels.set(key, [...(levels.get(key) ?? []), [e.at + a * e.length, e.at + b * e.length]]);
    }
  }
  return [...levels].map(([level, windows]) => ({ level, windows }));
}

/** "between(t,a,b)+…" for a filter's `enable`, the windows rounded to the millisecond. */
export const enableExpr = (windows: readonly [number, number][], t = "t") => windows.map(([a, b]) => `between(${t},${num(Math.max(0, a))},${num(b)})`).join("+");
