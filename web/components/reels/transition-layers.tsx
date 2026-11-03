"use client";
// Transitions on the editor's preview, as the render makes them with ffmpeg's xfade (libavfilter/vf_xfade.c, ffmpeg
// 4.4): the same shapes from the same formulas, drawn with CSS over two pictures of the recording, the outgoing side
// and the incoming one. xfade's `progress` runs from 1 (all outgoing) to 0 (all incoming), one step a frame.
//
// - fades (fade, fadeblack, fadewhite, fadegrays): opacity over a black or white layer, grayscale(); exact.
// - hard edges (wipe*, slide*, rectcrop, circlecrop, squeeze*, *slice): clip-path, transforms, hard-stop gradient masks;
//   exact (to the pixel row; squeezes are scaled smoothly where ffmpeg picks whole rows).
// - soft edges (smooth*, circleopen/close, vertopen/close, horzopen/close, radial): gradient masks sampled from
//   xfade's smoothstep, linear between the samples (within a percent).
// - canvas: dissolve (xfade's per-pixel random switch, on a grid of CSS pixels), diag* (its curved soft edge, from a
//   small weight map scaled up), pixelize (both sides in blocks, sampled at their middles, crossfaded).
// - hblur: xfade's sideways box blur, run from each pixel to the right, approximated by a Gaussian of the same spread,
//   moved left by half the box (the strip it leaves on the right keeps the unmoved blur).
import { useEffect, useId, useRef, type CSSProperties, type RefObject } from "react";
import type { TransitionJoint } from "@launchreel/core/transitions";
import { REEL_FPS, trimAt, type CutClock, type Trim } from "@launchreel/core/trims";

/* ---------- xfade's shapes, as CSS ---------- */

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const fract = (n: number) => n - Math.floor(n);
const num = (n: number) => String(Math.round(n * 1000) / 1000);
const pct = (share: number) => `${num(share * 100)}%`;
const inset = (top: number, right: number, bottom: number, left: number) => `inset(${pct(top)} ${pct(right)} ${pct(bottom)} ${pct(left)})`;
const masked = (image: string): CSSProperties => ({ maskImage: image, WebkitMaskImage: image });

/**
 * Gradient stops for a mask that lets `alpha(x)` of a side through at x (0 to 1 along the gradient), sampled across the
 * stretches where it changes (`bands`, where it's flat elsewhere) and at both ends.
 */
function alphaStops(alpha: (x: number) => number, bands: readonly (readonly [number, number])[], unit: "%" | "deg" = "%", samples = 12): string {
  const xs = new Set([0, 1]);
  for (const [a, b] of bands) {
    const lo = Math.max(0, Math.min(a, b));
    const hi = Math.min(1, Math.max(a, b));
    if (hi > lo) for (let i = 0; i <= samples; i++) xs.add(lo + ((hi - lo) * i) / samples);
  }
  const scale = unit === "deg" ? 360 : 100;
  return [...xs]
    .sort((a, b) => a - b)
    .map((x) => `rgb(0 0 0 / ${num(alpha(x))}) ${num(x * scale)}${unit}`)
    .join(", ");
}

/**
 * xfade's slices: ten strips, each letting the incoming side in from its start up to where `10x - strip` catches up
 * with smoothstep(-0.5, 0, x - 1.5 progress) (it always does once: it rises faster), as hard stops.
 */
function sliceStops(progress: number): string {
  const smooth = (x: number) => smoothstep(-0.5, 0, x - progress * 1.5);
  const out: string[] = [];
  for (let k = 0; k < 10; k++) {
    const [a, b] = [k / 10, (k + 1) / 10];
    let [lo, hi] = [a, b];
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (10 * mid - k - smooth(mid) < 0) lo = mid;
      else hi = mid;
    }
    const edge = (lo + hi) / 2;
    out.push(`#000 ${pct(a)}`, `#000 ${pct(edge)}`, `transparent ${pct(edge)}`, `transparent ${pct(b)}`);
  }
  return out.join(", ");
}

/** How a transition looks at a moment: each side's CSS, which is on top, and what's under them or drawn over them. */
export type XfadeLook = {
  out: CSSProperties;
  in: CSSProperties;
  /** The side drawn over the other. */
  top: "out" | "in";
  /** A colour under both sides (black when not given). */
  bg?: string;
  /** Drawn on a canvas over the sides: the incoming side through a mask (dissolve, diag*), or both sides (pixelize). */
  canvas?: "dissolve" | "diag" | "pixelize";
  /** hblur: both sides blurred sideways, the blur's box this share of the frame's width. */
  hblur?: number;
};

const HIDE: CSSProperties = { opacity: 0 };

/**
 * One of xfade's transitions at `progress` (1 at its start, 0 at its end): xfade's per-pixel formulas (vf_xfade.c, 4.4)
 * as CSS on the two sides, in shares of the frame so they fit any size. An unknown name crossfades.
 */
export function xfadeLook(name: string, progress: number): XfadeLook {
  const p = Math.min(1, Math.max(0, progress));
  switch (name) {
    // out·p + in·(1 − p)
    case "fade":
      return { out: {}, in: { opacity: 1 - p }, top: "in" };
    // mix(mix(out, bg, smoothstep(0.8, 1, p)), mix(bg, in, smoothstep(0.2, 1, p)), p): each side's share, over the colour.
    case "fadeblack":
    case "fadewhite": {
      const [s1, s2] = [smoothstep(0.8, 1, p), smoothstep(0.2, 1, p)];
      const [outShare, inShare] = [s1 * p, (1 - s2) * (1 - p)];
      return { bg: name === "fadeblack" ? "#000" : "#fff", out: { opacity: inShare < 1 ? outShare / (1 - inShare) : 0 }, in: { opacity: inShare }, top: "in" };
    }
    // The same, through each side in black and white (its luma) rather than a colour.
    case "fadegrays": {
      const [s1, s2] = [smoothstep(0.8, 1, p), smoothstep(0.2, 1, p)];
      return { out: { filter: `grayscale(${num(1 - s1)})` }, in: { filter: `grayscale(${num(s2)})`, opacity: 1 - p }, top: "in" };
    }
    // Hard edges: the incoming side past a line, or the outgoing one in a shrinking corner.
    case "wipeleft":
      return { out: {}, in: { clipPath: inset(0, 0, 0, p) }, top: "in" };
    case "wiperight":
      return { out: {}, in: { clipPath: inset(0, p, 0, 0) }, top: "in" };
    case "wipeup":
      return { out: {}, in: { clipPath: inset(p, 0, 0, 0) }, top: "in" };
    case "wipedown":
      return { out: {}, in: { clipPath: inset(0, 0, p, 0) }, top: "in" };
    case "wipetl":
      return { out: { clipPath: inset(0, 1 - p, 1 - p, 0) }, in: {}, top: "out" };
    case "wipetr":
      return { out: { clipPath: inset(0, 0, 1 - p, 1 - p) }, in: {}, top: "out" };
    case "wipebl":
      return { out: { clipPath: inset(1 - p, 1 - p, 0, 0) }, in: {}, top: "out" };
    case "wipebr":
      return { out: { clipPath: inset(1 - p, 0, 0, 1 - p) }, in: {}, top: "out" };
    // Both sides move a frame's width (or height) together.
    case "slideleft":
      return { out: { transform: `translateX(${pct(-(1 - p))})` }, in: { transform: `translateX(${pct(p)})` }, top: "in" };
    case "slideright":
      return { out: { transform: `translateX(${pct(1 - p)})` }, in: { transform: `translateX(${pct(-p)})` }, top: "in" };
    case "slideup":
      return { out: { transform: `translateY(${pct(-(1 - p))})` }, in: { transform: `translateY(${pct(p)})` }, top: "in" };
    case "slidedown":
      return { out: { transform: `translateY(${pct(1 - p)})` }, in: { transform: `translateY(${pct(-p)})` }, top: "in" };
    // The incoming side's share is smoothstep(0, 1, 1 + x − 2p) along the way it comes from (a frame-wide soft edge).
    case "smoothleft":
    case "smoothright":
    case "smoothup":
    case "smoothdown": {
      const toward = { smoothleft: "to right", smoothright: "to left", smoothup: "to bottom", smoothdown: "to top" }[name];
      return { out: {}, in: masked(`linear-gradient(${toward}, ${alphaStops((x) => smoothstep(0, 1, 1 + x - 2 * p), [[2 * p - 1, 2 * p]])})`), top: "in" };
    }
    // From the middle, as a share r of the way to a corner: the incoming side's share is 1 − smoothstep(0, 1, r + q).
    case "circleopen": {
      const q = (p - 0.5) * 3;
      return { out: {}, in: masked(`radial-gradient(circle farthest-corner at 50% 50%, ${alphaStops((r) => 1 - smoothstep(0, 1, r + q), [[-q, 1 - q]])})`), top: "in" };
    }
    case "circleclose": {
      const q = (0.5 - p) * 3;
      return { out: {}, in: masked(`radial-gradient(circle farthest-corner at 50% 50%, ${alphaStops((r) => smoothstep(0, 1, r + q), [[-q, 1 - q]])})`), top: "in" };
    }
    // Mirrored about the middle line: a = |2x − 1| from it.
    case "vertopen":
    case "horzopen":
    case "vertclose":
    case "horzclose": {
      const open = name.endsWith("open");
      const share = (a: number) => smoothstep(0, 1, open ? 2 - a - 2 * p : 1 + a - 2 * p);
      const [a0, a1] = open ? [1 - 2 * p, 2 - 2 * p] : [2 * p - 1, 2 * p];
      const bands = [[(1 - a1) / 2, (1 - a0) / 2], [(1 + a0) / 2, (1 + a1) / 2]] as const;
      return { out: {}, in: masked(`linear-gradient(${name.startsWith("vert") ? "to right" : "to bottom"}, ${alphaStops((x) => share(Math.abs(2 * x - 1)), bands)})`), top: "in" };
    }
    // Round the middle: xfade's angle atan2(x, y) from straight down is 180° − CSS's (from straight up, clockwise).
    case "radial": {
      const offset = (p - 0.5) * Math.PI * 2.5;
      const share = (x: number) => smoothstep(0, 1, Math.PI - x * 2 * Math.PI - offset);
      const band = [(Math.PI - offset - 1) / (2 * Math.PI), (Math.PI - offset) / (2 * Math.PI)] as const;
      return { out: {}, in: masked(`conic-gradient(from 0deg at 50% 50%, ${alphaStops(share, [band], "deg", 16)})`), top: "in" };
    }
    case "hlslice":
    case "hrslice":
    case "vuslice":
    case "vdslice": {
      const toward = { hlslice: "to right", hrslice: "to left", vuslice: "to bottom", vdslice: "to top" }[name];
      return { out: {}, in: masked(`linear-gradient(${toward}, ${sliceStops(p)})`), top: "in" };
    }
    // Black round a box (or a circle) that closes on the outgoing side, then opens on the incoming one.
    case "rectcrop": {
      const edge = 0.5 - Math.abs(p - 0.5);
      const clip = { clipPath: inset(edge, edge, edge, edge) };
      return p >= 0.5 ? { bg: "#000", out: clip, in: HIDE, top: "out" } : { bg: "#000", out: HIDE, in: clip, top: "in" };
    }
    // A radius r of the half diagonal is r / √2 of what circle()'s percentages are of (√(w² + h²) / √2).
    case "circlecrop": {
      const clip = { clipPath: `circle(${pct((2 * Math.abs(p - 0.5)) ** 3 / Math.SQRT2)} at 50% 50%)` };
      return p >= 0.5 ? { bg: "#000", out: clip, in: HIDE, top: "out" } : { bg: "#000", out: HIDE, in: clip, top: "in" };
    }
    // The outgoing side squeezed to a line through the middle, over the incoming one.
    case "squeezeh":
      return { out: { transform: `scaleY(${num(p)})`, transformOrigin: "50% 50%" }, in: {}, top: "out" };
    case "squeezev":
      return { out: { transform: `scaleX(${num(p)})`, transformOrigin: "50% 50%" }, in: {}, top: "out" };
    case "dissolve":
    case "diagtl":
    case "diagtr":
    case "diagbl":
    case "diagbr":
      return { out: {}, in: HIDE, top: "in", canvas: name === "dissolve" ? "dissolve" : "diag" };
    case "pixelize":
      return { out: HIDE, in: HIDE, top: "in", canvas: "pixelize" };
    // A box blur half the frame wide at the middle, both sides crossfading.
    case "hblur":
      return { out: {}, in: { opacity: 1 - p }, top: "in", hblur: (p <= 0.5 ? p * 2 : (1 - p) * 2) / 2 };
    default:
      return { out: {}, in: { opacity: 1 - p }, top: "in" };
  }
}

/** The SVG filter for hblur's box `size` CSS pixels wide: a Gaussian of the box's spread, moved left by half the box. */
export const hblurFilter = (size: number) => ({ deviation: `${num(Math.max(0, size) / Math.sqrt(12))} 0`, dx: num(-Math.max(0, size - 1) / 2) });

/** The hblur filter, to put on the page (its numbers can also be set on its elements as they change). */
export function HblurSvg({ id, size, blurRef, shiftRef }: { id: string; size: number; blurRef?: RefObject<SVGFEGaussianBlurElement | null>; shiftRef?: RefObject<SVGFEOffsetElement | null> }) {
  const f = hblurFilter(size);
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation={f.deviation} edgeMode="duplicate" result="blur" />
        <feOffset ref={shiftRef} in="blur" dx={f.dx} result="moved" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="moved" />
        </feMerge>
      </filter>
    </svg>
  );
}

/* ---------- the canvas ones: dissolve, diag*, pixelize ---------- */

/** A picture to draw: a video (its current frame), an image or a canvas, and its own size. */
export type Picture = { source: CanvasImageSource; width: number; height: number };

export function pictureOf(el: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null): Picture | null {
  if (!el) return null;
  if (el instanceof HTMLVideoElement) return el.readyState >= 2 && el.videoWidth ? { source: el, width: el.videoWidth, height: el.videoHeight } : null;
  if (el instanceof HTMLImageElement) return el.complete && el.naturalWidth ? { source: el, width: el.naturalWidth, height: el.naturalHeight } : null;
  return el.width ? { source: el, width: el.width, height: el.height } : null;
}

/** Draws a picture filling (w × h) as object-fit: cover does. */
function drawCover(ctx: CanvasRenderingContext2D, pic: Picture, w: number, h: number) {
  const scale = Math.max(w / pic.width, h / pic.height);
  const [sw, sh] = [w / scale, h / scale];
  ctx.drawImage(pic.source, (pic.width - sw) / 2, (pic.height - sh) / 2, sw, sh, 0, 0, w, h);
}

/** Canvases and the dissolve's random numbers, kept between frames. */
export type XfadeScratch = { mask?: HTMLCanvasElement; small?: HTMLCanvasElement; noise?: { w: number; h: number; values: Float32Array; image: ImageData } };

const canvasIn = (scratch: XfadeScratch, key: "mask" | "small", w: number, h: number) => {
  const c = (scratch[key] ??= document.createElement("canvas"));
  if (c.width !== w || c.height !== h) [c.width, c.height] = [w, h];
  return c;
};

/**
 * A canvas transition's frame on `ctx` (its canvas `cssWidth` CSS pixels wide): dissolve and diag* draw the incoming
 * side where it shows (over the outgoing side, under the canvas); pixelize draws both.
 */
export function drawXfade(ctx: CanvasRenderingContext2D, mode: NonNullable<XfadeLook["canvas"]>, name: string, progress: number, out: Picture | null, inn: Picture | null, cssWidth: number, scratch: XfadeScratch) {
  const { width: cw, height: ch } = ctx.canvas;
  const p = Math.min(1, Math.max(0, progress));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, cw, ch);
  if (mode === "pixelize") {
    // Squares of 2 · dist · min(w, h) / 20, each its middle pixel's colour; out·p + in·(1 − p).
    const dist = Math.ceil(Math.min(p, 1 - p) * 50) / 50;
    const size = (dist * Math.min(cw, ch)) / 10;
    ctx.imageSmoothingEnabled = false;
    const layers = [[out, 1], [inn, 1 - p]] as const;
    if (size < 1) {
      for (const [pic, alpha] of layers) {
        if (!pic) continue;
        ctx.globalAlpha = alpha;
        drawCover(ctx, pic, cw, ch);
      }
    } else {
      const [cols, rows] = [Math.ceil(cw / size), Math.ceil(ch / size)];
      const small = canvasIn(scratch, "small", cols, rows);
      const sctx = small.getContext("2d")!;
      sctx.imageSmoothingEnabled = false;
      for (const [pic, alpha] of layers) {
        if (!pic) continue;
        sctx.clearRect(0, 0, cols, rows);
        // Stretched to the last square first, so a part square at the edge is never see-through.
        drawCover(sctx, pic, cols, rows);
        drawCover(sctx, pic, cw / size, ch / size);
        ctx.globalAlpha = alpha;
        ctx.drawImage(small, 0, 0, cols, rows, 0, 0, cols * size, rows * size);
      }
    }
  } else if (inn) {
    drawCover(ctx, inn, cw, ch);
    ctx.globalCompositeOperation = "destination-in";
    if (mode === "dissolve") {
      // Each pixel switches at its own random moment: in where frand(x, y) < 1 − p (on a grid of CSS pixels).
      const w = Math.max(1, Math.round(cssWidth));
      const h = Math.max(1, Math.round((cssWidth * ch) / cw));
      const mask = canvasIn(scratch, "mask", w, h);
      const mctx = mask.getContext("2d")!;
      if (scratch.noise?.w !== w || scratch.noise.h !== h) {
        const values = new Float32Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) values[y * w + x] = fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.545);
        scratch.noise = { w, h, values, image: mctx.createImageData(w, h) };
      }
      const { values, image } = scratch.noise;
      for (let i = 0; i < values.length; i++) image.data[i * 4 + 3] = values[i] < 1 - p ? 255 : 0;
      mctx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mask, 0, 0, cw, ch);
    } else {
      // smoothstep(0, 1, 1 + U·V − 2p), U and V the shares across from the corner it comes from; scaled up smoothly.
      const w = 48;
      const h = Math.max(2, Math.round((w * ch) / cw));
      const mask = canvasIn(scratch, "mask", w, h);
      const mctx = mask.getContext("2d")!;
      const image = mctx.createImageData(w, h);
      const [flipX, flipY] = [name === "diagtr" || name === "diagbr", name === "diagbl" || name === "diagbr"];
      for (let y = 0; y < h; y++) {
        const v = (y + 0.5) / h;
        for (let x = 0; x < w; x++) {
          const u = (x + 0.5) / w;
          image.data[(y * w + x) * 4 + 3] = Math.round(255 * smoothstep(0, 1, 1 + (flipX ? 1 - u : u) * (flipY ? 1 - v : v) - 2 * p));
        }
      }
      mctx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mask, 0, 0, cw, ch);
    }
  }
  ctx.restore();
}

/* ---------- the editor's preview ---------- */

/**
 * Where a side of a joint is on the upload's clock, `e` seconds into it: a short side keeps its edge frame where its own
 * footage runs out (the outgoing one after it, the incoming one before it).
 */
function sideAt(j: TransitionJoint, side: "out" | "in", e: number) {
  if (side === "out") return Math.min(j.out[1] - 1 / REEL_FPS, j.out[0] + e);
  return Math.max(j.in[0], j.in[1] - j.length + e);
}

/** Whether a side is on its held edge frame `e` seconds into the joint. */
function heldAt(j: TransitionJoint, side: "out" | "in", e: number) {
  return side === "out" ? j.out[0] + e > j.out[1] - 1 / REEL_FPS + 1e-6 : j.in[1] - j.length + e < j.in[0] - 1e-6;
}

/** Whether all of a side's own footage plays in the main video anyway (a cut inside the video): its video only holds. */
function onlyHolds(j: TransitionJoint, side: "out" | "in") {
  return side === "out" ? j.out[1] - j.out[0] <= j.joint - j.start + 1e-6 : j.in[1] - j.in[0] <= j.start + j.length - j.joint + 1e-6;
}

// The inline properties the layers use: each paint sets the ones it gives and clears the rest.
const PROPS = ["opacity", "transform", "transform-origin", "clip-path", "mask-image", "-webkit-mask-image", "filter", "z-index", "background"];
const painted = new WeakMap<HTMLElement, string>();
const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
/** Sets an element's inline style to `style` (when it changed): those properties, and none of the others in PROPS. */
function paint(el: HTMLElement, style: CSSProperties) {
  const set = new Map(Object.entries(style).flatMap(([k, v]) => (v === undefined || v === null ? [] : [[kebab(k), String(v)] as const])));
  const css = [...set].map(([k, v]) => `${k}:${v}`).join(";");
  if (painted.get(el) === css) return;
  painted.set(el, css);
  for (const k of PROPS) if (!set.has(k)) el.style.removeProperty(k);
  for (const [k, v] of set) el.style.setProperty(k, v);
}

// Each side's own video starts this long before it's needed while playing, so it's rolling in step when it shows.
const PREROLL = 0.5;

/**
 * The transitions on the preview: two more pictures of the recording (one for each side of a joint), a layer under them
 * and a canvas over them, composited with the preview video (`main`) inside its frame. The main video stays the clock
 * and the sound and jumps over cuts as always; wherever it already shows a side (the outgoing one before the joint, the
 * incoming one after), it shows it, and the side videos show the rest, playing along (started a moment early) or
 * parked on the exact frame while paused. Outside a transition, and paused inside a cut stretch, the main video is left
 * exactly as it was. Every frame is set from the main video's own time, so it follows playing, seeking and scrubbing.
 */
export function TransitionLayers({ main, src, joints, clock, trims }: { main: RefObject<HTMLVideoElement | null>; src: string; joints: readonly TransitionJoint[]; clock: CutClock; trims: readonly Trim[] }) {
  const sideOut = useRef<HTMLVideoElement>(null);
  const sideIn = useRef<HTMLVideoElement>(null);
  const under = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const blur = useRef<SVGFEGaussianBlurElement>(null);
  const shift = useRef<SVGFEOffsetElement>(null);
  const id = `reel-xfade-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const live = useRef({ joints, clock, trims });
  live.current = { joints, clock, trims };

  useEffect(() => {
    const F = 1 / REEL_FPS;
    const asked = new WeakMap<HTMLVideoElement, number>();
    const scratch: XfadeScratch = {};
    let drawn = "";
    let blurred = "";
    let frame = 0;

    // A side video parked on a frame (paused, sent there once), or playing along at `t` (nudged when it drifts, put back
    // when it's off).
    const park = (v: HTMLVideoElement, t: number) => {
      if (!v.paused) v.pause();
      if (v.playbackRate !== 1) v.playbackRate = 1;
      const target = Math.round(Math.max(0, t) * 1000) / 1000;
      if (asked.get(v) !== target && Math.abs(v.currentTime - target) > 0.004) {
        asked.set(v, target);
        v.currentTime = target;
      }
    };
    const run = (v: HTMLVideoElement, t: number) => {
      asked.delete(v);
      if (v.paused) void v.play().catch(() => {});
      if (v.seeking) return;
      const off = v.currentTime - Math.max(0, t);
      if (Math.abs(off) > 0.15) {
        v.playbackRate = 1;
        v.currentTime = Math.max(0, t);
      } else {
        const rate = Math.abs(off) < 0.012 ? 1 : Math.min(1.4, Math.max(0.7, 1 - off * 6));
        if (Math.abs(v.playbackRate - rate) > 0.01) v.playbackRate = rate;
      }
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const [m, a, b, bg, c] = [main.current, sideOut.current, sideIn.current, under.current, canvas.current];
      if (!m || !a || !b || !bg || !c) return;
      const { joints, clock, trims } = live.current;
      const u = m.currentTime;
      const playing = !m.paused && !m.ended;
      const t = clock.toCut(u);
      // The transition playing now, or the next one.
      const j = joints.find((x) => t < x.start + x.length - 1e-6);
      const e = j ? t - j.start : 0;
      const frames = j ? Math.max(1, Math.round(j.length * REEL_FPS)) : 1;
      const n = Math.min(frames - 1, Math.max(0, Math.floor(e * REEL_FPS + 0.01)));

      // Keep each side's video where it'll be needed.
      if (j) {
        for (const [v, side] of [[a, "out"], [b, "in"]] as const) {
          if (onlyHolds(j, side) || heldAt(j, side, Math.max(0, e))) park(v, side === "out" ? j.out[1] - F / 2 : j.in[0] + F / 2);
          else if (playing && e >= -PREROLL) run(v, sideAt(j, side, e));
          else if (playing) park(v, sideAt(j, side, -PREROLL));
          else park(v, sideAt(j, side, n / REEL_FPS) + F / 2);
        }
      } else {
        if (!a.paused) a.pause();
        if (!b.paused) b.pause();
      }

      // Paused inside a cut stretch, it shows as it is (with its "Put back").
      const inTrim = trimAt(trims, u) >= 0;
      if (!j || e < -1e-6 || (inTrim && !playing)) {
        paint(m, {});
        for (const el of [a, b, bg, c]) paint(el, HIDE);
        return;
      }

      const [w, h] = [m.clientWidth, m.clientHeight];
      const look = xfadeLook(j.xfade, 1 - n / frames);
      // The main video shows the side it's on, when it's showing a settled frame there (not mid-jump, not in a cut).
      const mainSide = !m.seeking && m.readyState >= 2 && !inTrim ? (u < j.at - 1e-4 ? "out" : "in") : null;
      const outEl = mainSide === "out" ? m : a;
      const inEl = mainSide === "in" ? m : b;
      const blurOn = look.hblur !== undefined;
      const sideStyle = (side: "out" | "in"): CSSProperties => ({ ...look[side], zIndex: look.top === side ? 2 : 1, ...(blurOn ? { filter: `url(#${id})` } : {}) });
      for (const v of [m, a, b]) paint(v, v === outEl ? sideStyle("out") : v === inEl ? sideStyle("in") : { opacity: 0, zIndex: 0 });
      paint(bg, { opacity: 1, background: look.bg ?? "#000", zIndex: 0 });
      if (blurOn) {
        const f = hblurFilter(look.hblur! * w);
        const key = `${f.deviation}|${f.dx}`;
        if (key !== blurred && blur.current && shift.current) {
          blurred = key;
          blur.current.setAttribute("stdDeviation", f.deviation);
          shift.current.setAttribute("dx", f.dx);
        }
      }
      if (look.canvas) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const [cw, ch] = [Math.max(1, Math.round(w * dpr)), Math.max(1, Math.round(h * dpr))];
        if (c.width !== cw || c.height !== ch) [c.width, c.height] = [cw, ch];
        const key = `${look.canvas}|${j.xfade}|${n}|${cw}x${ch}|${outEl.currentTime}|${outEl.seeking}|${outEl.readyState}|${inEl.currentTime}|${inEl.seeking}|${inEl.readyState}`;
        if (key !== drawn) {
          drawn = key;
          const ctx = c.getContext("2d");
          if (ctx) drawXfade(ctx, look.canvas, j.xfade, 1 - n / frames, pictureOf(outEl), pictureOf(inEl), w, scratch);
        }
        paint(c, { opacity: 1, zIndex: 3 });
      } else {
        drawn = "";
        paint(c, HIDE);
      }
    };
    frame = requestAnimationFrame(tick);
    const m = main.current;
    return () => {
      cancelAnimationFrame(frame);
      if (m) paint(m, {});
    };
  }, [main, id]);

  const layer = "pointer-events-none absolute inset-0 size-full";
  return (
    <>
      <HblurSvg id={id} size={0} blurRef={blur} shiftRef={shift} />
      <span ref={under} className={layer} style={HIDE} aria-hidden />
      <video ref={sideOut} src={src} muted playsInline preload="auto" tabIndex={-1} className={`${layer} object-cover`} style={HIDE} aria-hidden />
      <video ref={sideIn} src={src} muted playsInline preload="auto" tabIndex={-1} className={`${layer} object-cover`} style={HIDE} aria-hidden />
      <canvas ref={canvas} width={1} height={1} className={layer} style={HIDE} aria-hidden />
    </>
  );
}
