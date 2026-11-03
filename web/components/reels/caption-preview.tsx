"use client";
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  boxAlpha,
  CAPTION_FONT_CAP,
  CAPTION_FONT_EM,
  CAPTION_STROKES,
  captionWidth,
  captionY,
  GHOST_OPACITY,
  KEY_GLOW,
  keyFontScale,
  LINE_SLIDES,
  LOCKUP_LEADING,
  lockupKeys,
  lockupMaxHeight,
  lockupRows,
  REVEALING_ANIMATIONS,
  SHADOW,
  TYPEWRITER_LETTER,
  WAVE,
  WEIGHTED_FONTS,
  weightOf,
  WORD_KEYS,
  wordKeyValues,
  wordMotion,
  type CaptionFont,
  type CaptionLook,
  type CaptionWeight,
  type ReelStyle,
  type WordKey,
} from "@launchreel/core/captions";
import { cn } from "@/lib/cn";
import { CAPTION_FONT_CLASS } from "./caption-fonts";
import { CAPTION_FONT_ASCENT } from "./caption-metrics";

// A sample line, said a word at a time, with two key words. Twelve words split evenly into lines of 1, 2, 3, 4 or 6.
const SAMPLE = ["Here's", "how", "I", "doubled", "my", "sales", "in", "30", "days", "without", "any", "ads"];
const KEYWORDS = new Set([3, 7]);
const WEIGHT: Record<CaptionWeight, number> = { black: 900, extrabold: 800, semibold: 600, medium: 500, light: 300 };

/** "#RRGGBB" at an opacity, as CSS. */
const rgba = (hex: string, opacity: number) => `rgb(${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)} / ${opacity})`;

/** A word in a casing. */
const cased = (word: string, casing: CaptionLook["casing"]) => (casing === "upper" ? word.toUpperCase() : casing === "lower" ? word.toLowerCase() : word);

/**
 * The class that sets a key word's own font inside a caption in another (Inter is the page's own font, put back). It
 * goes inside an element that sets italics off: the italic fonts' classes set them on again.
 */
const keyFontClass = (font: CaptionFont) => (font === "inter" ? "font-sans" : CAPTION_FONT_CLASS[font]);

/** The characters libass spaces out: all but combining marks (letterCount in runner/src/reel.ts). */
const letterCount = (text: string) => [...text].filter((ch) => !/\p{M}/u.test(ch)).length;

/**
 * A line of a lockup as the render places it, in container units (cqw) across the frame and from the caption line
 * down: its words [from, to), whether it's a key word's, how it lines up on `x` (an ASS alignment: 4 from the left, 5
 * centred, 6 to the right), its font and CSS font size, and the top of its line box (line-height 1) that puts its
 * baseline where libass puts it. `offset` and `ascent` are how far the baseline is below the line box's top and below
 * a word's top in it (in em: the browser's own metrics, measured), for a marker band behind a word.
 */
type LockupLine = { from: number; to: number; key: boolean; an: 4 | 5 | 6; x: number; font: CaptionFont; size: number; top: number; offset: number; ascent: number };
/** A lockup as measured (for `key`): its lines, the box round it, the size its outline, shadow and glow go by (cqw), and its height in lines of the look's size. */
type LockupFit = { key: string; lines: LockupLine[]; box: { left: number; top: number; width: number; height: number; radius: number } | null; unit: number; rows: number };

let canvas: CanvasRenderingContext2D | null = null;

/** A frame's shape: its width and height (any units). */
export type Aspect = { width: number; height: number };
export const FRAME_9_16: Aspect = { width: 9, height: 16 };
/** Container-width percent (cqw) per 1.0 of an ASS size, which is a share of sqrt(width × height): 133.33 on 9:16. */
export const sizeUnit = (aspect: Aspect) => 100 * Math.sqrt(aspect.height / aspect.width);

/** The frame the render draws a shape on: fitted to 1080×1920 (or 1920×1080), its sides even (outputSize in runner/src/reel.ts). */
function renderFrame(aspect: Aspect) {
  const even = (n: number) => Math.max(2, 2 * Math.round(n / 2));
  const s = Math.min(1080 / Math.min(aspect.width, aspect.height), 1920 / Math.max(aspect.width, aspect.height));
  return { width: even(aspect.width * s), height: even(aspect.height * s) };
}

/**
 * Where a caption breaks and how far it shrinks, the way the render does (lineBreak in runner/src/reel.ts): one line if
 * it fits, else the two most even lines, smaller if even those are too wide. From each word's width in the real font.
 */
function fitLines(widths: number[], space: number, max: number): { breakAt: number | null; scale: number } {
  if (!widths.length) return { breakAt: null, scale: 1 };
  const width = (from: number, to: number) => widths.slice(from, to).reduce((w, x, i) => w + x + (i > 0 ? space : 0), 0);
  const all = width(0, widths.length);
  if (widths.length < 2 || all <= max) return { breakAt: null, scale: Math.min(1, max / all) };
  let best = { breakAt: 1, widest: Infinity };
  for (let k = 1; k < widths.length; k++) {
    const widest = Math.max(width(0, k), width(k, widths.length));
    if (widest < best.widest) best = { breakAt: k, widest };
  }
  return { breakAt: best.breakAt, scale: Math.min(1, max / best.widest) };
}

/**
 * fitLines for words with gaps of their own after them (a space, and the word's last letter spacing, which differs by
 * font and size), as the render fits letter-spaced lines and lockup rows (lineBreakGaps in runner/src/reel.ts).
 */
function fitLinesGaps(widths: number[], gaps: number[], max: number): { breakAt: number | null; scale: number } {
  const width = (from: number, to: number) => {
    let w = 0;
    for (let i = from; i < to; i++) w += widths[i] + (i + 1 < to ? gaps[i] : 0);
    return w;
  };
  const all = width(0, widths.length);
  if (widths.length < 2 || all <= max) return { breakAt: null, scale: Math.min(1, max / all) };
  let best = { breakAt: 1, widest: Infinity };
  for (let k = 1; k < widths.length; k++) {
    const widest = Math.max(width(0, k), width(k, widths.length));
    if (widest < best.widest) best = { breakAt: k, widest };
  }
  return { breakAt: best.breakAt, scale: Math.min(1, max / best.widest) };
}

/**
 * A word-by-word animation (wordMotion, shared with the render) as CSS keyframes, named for what they do. A word that
 * rises in comes from nothing, or with ghost from faint.
 */
function motionKeyframes(look: CaptionLook, isKey: boolean): { name: string; css: string; ms: number; rises: boolean } | null {
  const motion = wordMotion(look, isKey);
  if (!motion) return null;
  const ms = motion.scale[motion.scale.length - 1][0];
  const name = `reel-w-${motion.scale.map(([t, v]) => `${t}-${v}`).join("-")}-${motion.fromY ?? 0}${motion.fromY && look.ghost ? "-g" : ""}`;
  const frames = motion.fromY
    ? `0%{transform:scaleY(${motion.fromY / 100});opacity:${look.ghost ? GHOST_OPACITY : 0}}100%{transform:scaleY(1);opacity:1}`
    : motion.scale.map(([t, v]) => `${((t / ms) * 100).toFixed(1)}%{transform:scale(${v / 100})}`).join("");
  return { name, css: `@keyframes ${name}{${frames}}`, ms, rises: Boolean(motion.fromY) };
}

/** "#RRGGBB" moved toward another by `amount` (0-1), as the render mixes it (mixHex in runner/src/reel.ts). */
const mixHex = (from: string, to: string, amount: number) =>
  `#${[1, 3, 5].map((i) => Math.round(parseInt(from.slice(i, i + 2), 16) + (parseInt(to.slice(i, i + 2), 16) - parseInt(from.slice(i, i + 2), 16)) * amount).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

/**
 * A newer word animation (WORD_KEYS, shared with the render) as CSS keyframes: each step at its share of the whole,
 * moving there in a straight line, or jumping there for a cut step (held until just before). As in the render, a word on
 * a marker band keeps its size, a blur is a share of the font size (`em` is the font's, so it becomes CSS em), a flash
 * goes from white back to `color`, the spoken word's, and with ghost a fade goes from faint (0.3 + 0.7 × its
 * visibility). Named for what differs, as the style tags are global.
 */
function keyedKeyframes(look: CaptionLook, color: string, em: number): { name: string; css: string; ms: number } | null {
  const keys = WORD_KEYS[look.animation];
  if (!keys) return null;
  const band = look.background === "band";
  const scales = !band && keys.some((q) => (q.sx ?? 100) !== 100 || (q.sy ?? 100) !== 100);
  const blurs = keys.some((q) => q.blur);
  const fades = keys.some((q) => (q.alpha ?? 1) < 1);
  const whitens = keys.some((q) => q.white);
  // On a band a size-only animation changes nothing.
  if (!scales && !blurs && !fades && !whitens) return null;
  const ms = keys[keys.length - 1].at;
  const frame = (percent: number, q: WordKey) => {
    const v = wordKeyValues(q);
    const css = scales ? [`transform:scale(${v.sx / 100},${v.sy / 100})`] : [];
    if (blurs) css.push(`filter:blur(${(v.blur / em).toFixed(3)}em)`);
    if (fades) css.push(`opacity:${look.ghost ? +(GHOST_OPACITY + (1 - GHOST_OPACITY) * v.alpha).toFixed(3) : v.alpha}`);
    // White 0 still names the colour, so the word ends in its own.
    if (whitens) css.push(`color:${mixHex(color, "#FFFFFF", v.white)}`);
    return `${+percent.toFixed(2)}%{${css.join(";")}}`;
  };
  const frames = keys.map((q, n) => {
    const percent = (q.at / ms) * 100;
    return (q.cut && n > 0 ? frame(percent - 0.01, keys[n - 1]) : "") + frame(percent, q);
  });
  const name = `reel-k-${look.animation}${scales ? "" : "-flat"}${blurs ? `-${Math.round(em * 1000)}` : ""}${whitens ? `-${color.slice(1)}` : ""}${fades && look.ghost ? "-g" : ""}`;
  return { name, css: `@keyframes ${name}{${frames.join("")}}`, ms };
}

/** Wave's letters (WAVE, shared with the render): each up to its peak and back, in straight lines. */
const WAVE_KEYFRAMES = `@keyframes reel-wave{0%{transform:scale(1)}${+((WAVE.up / (WAVE.up + WAVE.down)) * 100).toFixed(2)}%{transform:scale(${WAVE.peak / 100})}100%{transform:scale(1)}}`;
/** Reveal with ghost: a word comes in from faint. */
const REVEAL_GHOST_KEYFRAMES = `@keyframes reel-reveal-g{from{opacity:${GHOST_OPACITY};transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`;

/**
 * A line sliding in (LINE_SLIDES, shared with the render) as CSS keyframes: from its share of the font size below its
 * place (above, for a negative one), fading in, in a straight line. `em` is the font's, so the share becomes CSS em.
 */
function slideKeyframes(look: CaptionLook, em: number): { name: string; css: string; ms: number } | null {
  const slide = LINE_SLIDES[look.animation];
  if (!slide) return null;
  const dy = slide.dy / em;
  const name = `reel-${look.animation}-${Math.round(Math.abs(dy) * 1000)}`;
  return { name, css: `@keyframes ${name}{from{transform:translateY(${dy.toFixed(3)}em);opacity:0}to{transform:none;opacity:1}}`, ms: slide.ms };
}

/** The sample line in a look, a word per `tick`, for the style previews. Put it inside a positioned 9:16 box. */
export function CaptionPreview({ look, style, tick, className }: { look: CaptionLook; style: ReelStyle; tick: number; className?: string }) {
  const per = Math.max(1, look.words);
  const i = tick % SAMPLE.length;
  const from = Math.floor(i / per) * per;
  const words = SAMPLE.slice(from, from + per);
  const keywords = new Set(words.map((_, k) => k).filter((k) => KEYWORDS.has(from + k)));
  return <CaptionLine look={look} style={style} words={words} active={i - from} keywords={keywords} lineKey={from} tick={tick} className={className} />;
}

/**
 * One caption line drawn in CSS over a frame (9:16 unless `aspect` says otherwise), `active` being the word that's
 * being said: a stand-in for what libass draws in the render, from the same numbers (packages/core/src/captions.ts):
 * size, position, line width and line breaks, the word-by-word animations, the boxes, stroke and shadow, key words in
 * their own font, colour and glow, words to come shown faintly, letter spacing, and the lockup layout (key words big on
 * rows of their own), which is laid out exactly as the render lays it out. Sizes are in container units, so it scales
 * with the frame. `lineKey` changes when a new line starts (it fades in), `tick` when the spoken word changes (it
 * animates). Put it inside a positioned box of that shape.
 */
export function CaptionLine({
  look,
  style,
  words,
  active,
  keywords,
  lineKey,
  tick,
  className,
  onWord,
  selected = null,
  onRows,
  aspect = FRAME_9_16,
}: {
  look: CaptionLook;
  style: ReelStyle;
  words: string[];
  active: number;
  keywords: Set<number>;
  lineKey: string | number;
  tick: string | number;
  className?: string;
  /** Makes the words clickable (the editor: click a word on the video to edit it). */
  onWord?: (k: number) => void;
  /** The word being edited, outlined. */
  selected?: number | null;
  /** Told how tall the caption is, in lines at the look's size: 1 or 2 for a line, a lockup's own height. */
  onRows?: (rows: number) => void;
  /** The frame's shape. */
  aspect?: Aspect;
}) {
  const em = CAPTION_FONT_EM[look.font];
  const stroke = CAPTION_STROKES[style];
  // ASS sizes are shares of sqrt(width × height): for 9:16 that's 1.333 widths, so 1 cqw of width is 0.75% of it.
  const unit = sizeUnit(aspect);
  const outlineEm = (look.strokeWidth ?? (look.fill === "hollow" ? 0.045 : stroke.outline)) / em;
  const bar = look.background === "bar";
  const band = look.background === "band";
  const weight = weightOf(look.font, look.weight);
  const boldFill = look.fill === "bold" && weight !== null;
  // Karaoke lines fill word by word and never animate a word or hide the ones to come, in the render as here.
  const animates = look.fill !== "karaoke";
  const revealing = animates && REVEALING_ANIMATIONS.includes(look.animation);

  // A lockup's key words are the line's own, else its longest word; each goes big on a row of its own, the words
  // between them small on rows above and below (lockupKeys and lockupRows, shared with the render).
  const lockup = look.layout === "lockup";
  const keys = lockup ? new Set(lockupKeys(words, [...keywords])) : keywords;
  const rows = lockup ? lockupRows(words.length, [...keys]) : [];
  // Key words: in a font of their own (at the look's weight where it has weights, sized to the rest's capital height:
  // keyFontScale), else in the light weighted styles in the font's extra-bold (keyFaceOf in runner/src/reel.ts), else
  // as the rest. Words in the look's own font are letter spaced by its tracking; a key word in a font of its own isn't.
  const keyFont = look.keyFont;
  const keyEm = keyFont ? CAPTION_FONT_EM[keyFont] : em;
  const lightKeys = !keyFont && Boolean(WEIGHTED_FONTS[look.font]) && (look.weight === "semibold" || look.weight === "medium" || look.weight === "light");
  const keyWeight = keyFont ? weightOf(keyFont, look.weight) : lightKeys ? weightOf(look.font, "extrabold") : weight;
  const keyWeightCss = keyWeight ? WEIGHT[keyWeight] : 400;
  const keySize = keyFontScale(look);
  const inLookFont = (k: number) => !(keyFont && keys.has(k));

  // Line breaks, measured once the text has its font and size: each word at its size (key words bigger, when they
  // are, and in their own font), in the heavier weight when the spoken word turns bold (the widest it gets).
  const frame = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const keyProbe = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<{ breakAt: number | null; scale: number }>({ breakAt: null, scale: 1 });
  const [lock, setLock] = useState<LockupFit | null>(null);
  const shown = words.map((w, k) => cased(w, keys.has(k) && look.keyCasing ? look.keyCasing : look.casing));
  const key = `${shown.join(" ")}|${look.font}|${look.weight}|${look.size}|${bar}|${look.keyScale}|${[...keys].join(",")}|${boldFill}|${aspect.width}x${aspect.height}|${look.layout}|${keyFont}|${look.tracking}|${look.align}|${look.position}|${look.offset}|${look.background}`;
  useLayoutEffect(() => {
    const measure = () => {
      if (!frame.current || !text.current) return;
      canvas ??= document.createElement("canvas").getContext("2d");
      if (!canvas) return;
      const ctx = canvas;
      // At the look's own size (not the shrunk one on screen), so shrinking doesn't feed back into the measurement.
      const css = getComputedStyle(text.current);
      const frameWidth = frame.current.clientWidth;
      // The faces words are measured in: the look's, its extra-bold (the spoken word turning bold), and key words'.
      const probe = keyFont && keyProbe.current ? getComputedStyle(keyProbe.current) : null;
      const face = { style: css.fontStyle, weight: css.fontWeight, family: css.fontFamily, em };
      const bold = { ...face, weight: "800" };
      const keyFace = probe ? { style: probe.fontStyle, weight: String(keyWeightCss), family: probe.fontFamily, em: keyEm } : { ...face, weight: String(keyWeightCss) };
      // Text's advance in a face at ASS size `px` (in any pixels: its CSS size is px × the font's em), without kerning,
      // as the render measures it (and libass draws it: the render's scripts don't turn kerning on).
      const advance = (f: typeof face, s: string, px: number) => {
        ctx.font = `${f.style} ${f.weight} ${(px * f.em).toFixed(2)}px ${f.family}`;
        ctx.fontKerning = "none";
        return ctx.measureText(s).width;
      };
      const fitFace = (k: number) => (boldFill && inLookFont(k) ? bold : keys.has(k) ? keyFace : face);
      // A word's width at ASS size `px`, letter spaced (after its last letter too), and that last letter's spacing.
      const spacingOf = (k: number) => (inLookFont(k) ? look.tracking : 0);
      const widthAt = (k: number, f: typeof face, px: number) => advance(f, shown[k], px) + letterCount(shown[k]) * spacingOf(k) * px;
      const trailAt = (k: number, px: number) => (letterCount(shown[k]) ? spacingOf(k) * px : 0);
      const spaceAt = (px: number) => advance(face, " ", px) + look.tracking * px;

      if (!lockup) {
        const max = frameWidth * captionWidth(aspect.width, aspect.height, bar);
        let next: { breakAt: number | null; scale: number };
        if (keyFont || look.tracking) {
          // As the render fits these: each word in its face, at its size, letter spaced but for its last letter's
          // spacing, which goes in the gap after it with the space.
          const ass = (look.size * unit * frameWidth) / 100;
          const scaleOf = (k: number) => (keys.has(k) ? look.keyScale * keySize : 1);
          next = fitLinesGaps(
            shown.map((_, k) => (widthAt(k, fitFace(k), ass) - trailAt(k, ass)) * scaleOf(k)),
            shown.map((_, k) => trailAt(k, ass) * scaleOf(k) + spaceAt(ass)),
            max,
          );
        } else {
          const px = (look.size * unit * em * frameWidth) / 100;
          ctx.font = `${css.fontStyle} ${boldFill ? 800 : css.fontWeight} ${px.toFixed(2)}px ${css.fontFamily}`;
          ctx.fontKerning = "auto";
          const widths = shown.map((w, k) => ctx.measureText(w).width * (keys.has(k) ? look.keyScale : 1));
          next = fitLines(widths, ctx.measureText(" ").width, max);
        }
        setFit((f) => (f.breakAt === next.breakAt && Math.abs(f.scale - next.scale) < 0.005 ? f : next));
        onRows?.(next.breakAt === null ? 1 : 2);
        return;
      }

      // A lockup, laid out as the render lays it out (buildAss in runner/src/reel.ts), in the pixels of the frame it
      // draws on. Rows are fitted at their own sizes: a key word shrunk to the caption width, the others on one or two
      // balanced lines (shrunk as a line is); then all of it together, when the block is taller than lockupMaxHeight.
      const R = renderFrame(aspect);
      const size = Math.round(look.size * Math.sqrt(R.width * R.height));
      const max = R.width * captionWidth(R.width, R.height);
      const x = Math.round(R.width / 2);
      const leftEdge = Math.round(R.width / 2 - max / 2);
      const anchorY = Math.round(captionY(R.width, R.height, look) * R.height);
      const fitted = rows.map((r) => {
        if (r.key) {
          const px = size * look.keyScale * keySize;
          const wide = widthAt(r.from, fitFace(r.from), px) - trailAt(r.from, px);
          return { lines: [[r.from, r.to]] as [number, number][], px: px * Math.min(1, max / wide) };
        }
        const span = Array.from({ length: r.to - r.from }, (_, m) => r.from + m);
        const f = fitLinesGaps(
          span.map((k) => widthAt(k, fitFace(k), size) - trailAt(k, size)),
          span.map((k) => trailAt(k, size) + spaceAt(size)),
          max,
        );
        const lines: [number, number][] = f.breakAt === null ? [[r.from, r.to]] : [[r.from, r.from + f.breakAt], [r.from + f.breakAt, r.to]];
        return { lines, px: size * f.scale };
      });
      const tall = fitted.reduce((h, r) => h + r.lines.length * LOCKUP_LEADING * r.px, 0);
      const shrink = Math.min(1, (lockupMaxHeight(R.width, R.height, look) * R.height) / tall);
      // Every line of every row at a whole-pixel size, in a slot LOCKUP_LEADING of it tall, its line box (ascent plus
      // descent: its size) centred in it; the block hanging from the caption line or standing on it.
      const sized = fitted.flatMap((r, n) => r.lines.map(([a, b]) => ({ a, b, px: Math.max(1, Math.floor(r.px * shrink)), key: rows[n].key, side: rows[n].side })));
      const lineWidth = (ln: { a: number; b: number; px: number }) => {
        let w = 0;
        for (let i = ln.a; i < ln.b; i++) w += widthAt(i, keys.has(i) ? keyFace : face, ln.px) + (i > ln.a ? spaceAt(ln.px) : 0);
        return w - trailAt(ln.b - 1, ln.px);
      };
      const block = sized.reduce((h, ln) => h + LOCKUP_LEADING * ln.px, 0);
      let slotTop = look.position === "bottom" ? anchorY - block : anchorY;
      // Centred; from the caption area's left edge; or staggered in a block as wide as its widest line, centred.
      const widest = Math.max(...sized.map(lineWidth));
      const blockLeft = x - widest / 2;
      const placed = sized.map((ln) => {
        const y = Math.round(slotTop + (LOCKUP_LEADING * ln.px) / 2);
        slotTop += LOCKUP_LEADING * ln.px;
        const [an, at]: [4 | 5 | 6, number] = look.align === "left" ? [4, leftEdge] : look.align === "stagger" ? (ln.side === "left" ? [4, Math.round(blockLeft)] : [6, Math.round(blockLeft + widest)]) : [5, x];
        return { ...ln, an, x: at, y };
      });
      const cqw = (pixels: number) => (pixels * 100) / R.width;
      const unitPx = size * shrink;
      // One box round the block, as a line's box goes round its lines: from the first line's line box to the last one's,
      // each at its own size, padded at the block's; its corners on whole pixels, as roundedRect draws them.
      let box: LockupFit["box"] = null;
      if (look.background === "box" || bar) {
        const leftOf = (ln: (typeof placed)[number]) => (ln.an === 4 ? ln.x : ln.an === 6 ? ln.x - lineWidth(ln) : ln.x - lineWidth(ln) / 2);
        const pad = [0.28 * unitPx, 0.14 * unitPx];
        const [first, last] = [placed[0], placed[placed.length - 1]];
        const [x0, y0, x1, y1] = [
          Math.min(...placed.map(leftOf)) - pad[0],
          first.y - first.px / 2 + 0.06 * first.px - pad[1],
          Math.max(...placed.map((ln) => leftOf(ln) + lineWidth(ln))) + pad[0],
          last.y + last.px / 2 - 0.02 * last.px + pad[1],
        ].map(Math.round);
        box = { left: cqw(x0), top: cqw(y0 - anchorY), width: cqw(x1 - x0), height: cqw(y1 - y0), radius: cqw(Math.round(Math.min(0.22 * size, (x1 - x0) / 2, (y1 - y0) / 2))) };
      }
      // Where the browser puts the baseline in a line of a font at a size (line-height 1): below the line's top, and
      // below a word's top, in em. Measured on a hidden line like the real one, as browsers lay text out by metrics of
      // their own (and round them); as shares of the line's own height, its font size, so a zoomed page measures alike.
      const baselineIn = (f: typeof face, size: string) => {
        const line = document.createElement("span");
        const word = document.createElement("span");
        const mark = document.createElement("span");
        Object.assign(line.style, { position: "absolute", visibility: "hidden", display: "block", whiteSpace: "nowrap", fontFamily: f.family, fontStyle: f.style, fontWeight: f.weight, fontSize: size, lineHeight: "1" });
        Object.assign(mark.style, { display: "inline-block", width: "0", height: "0", overflow: "hidden" });
        word.textContent = "H";
        line.append(word, mark);
        frame.current!.append(line);
        const base = mark.getBoundingClientRect().bottom;
        const box = line.getBoundingClientRect();
        const measured = { line: (base - box.top) / box.height, word: (base - word.getBoundingClientRect().top) / box.height };
        line.remove();
        return measured;
      };
      const lines = placed.map((ln): LockupLine => {
        const font = ln.key && keyFont ? keyFont : look.font;
        const f = ln.key ? keyFace : face;
        const size = Math.round(cqw(ln.px) * f.em * 1000) / 1000;
        // libass centres the line box (ascent plus descent: the ASS size) on its point, the baseline the font's own
        // (Windows) ascent down it.
        const baseline = cqw(ln.y - ln.px / 2 + CAPTION_FONT_ASCENT[font] * ln.px - anchorY);
        const at = baselineIn(f, `${size}cqw`);
        return { from: ln.a, to: ln.b, key: ln.key, an: ln.an, x: cqw(ln.x), font, size, top: baseline - at.line * size, offset: at.line, ascent: at.word };
      });
      const next: LockupFit = { key, lines, box, unit: cqw(unitPx), rows: block / (look.size * Math.sqrt(R.width * R.height)) };
      setLock((l) => (l && JSON.stringify(l) === JSON.stringify(next) ? l : next));
      onRows?.(next.rows);
    };
    measure();
    document.fonts?.ready.then(measure);
    const resize = new ResizeObserver(measure);
    if (frame.current) resize.observe(frame.current);
    return () => resize.disconnect();
    // `key` covers everything the measurement reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const laid = lockup && lock?.key === key ? lock : null;

  // Around and under the letters: the customer's stroke and shadow when they chose them, else the style's, in the
  // render's two layers: on the words (the soft halo, their shadow), and under them (a soft shadow, the glow), a key
  // word's glow going between. `length` turns a share of the font size into CSS.
  const strokeColor = look.strokeColor ?? (look.fill === "hollow" ? look.color : "#000000");
  const shadowsIn = (length: (share: number) => string) => {
    const on: string[] = [];
    const under: string[] = [];
    if (look.stroke === "soft") on.push(`0 0 ${length(0.14)} ${rgba(look.strokeColor ?? "#000000", 0.8)}`);
    if (look.shadowKind === "hard") on.push(`0 ${length(SHADOW.offset)} 0 rgb(0 0 0 / 0.9)`);
    else if (look.shadowKind === "soft") under.push(`0 ${length(SHADOW.offset)} ${length(SHADOW.blur)} rgb(0 0 0 / 0.75)`);
    else if (!look.shadowKind) {
      if (look.stroke === "soft") on.push(`0 ${length(stroke.shadow)} ${length(0.1)} rgb(0 0 0 / 0.55)`);
      else if (look.hardShadow) on.push(`${length(stroke.shadow)} ${length(stroke.shadow)} 0 ${look.keyword}`);
      else if (stroke.shadow > 0) on.push(`0 ${length(stroke.shadow)} 0 rgb(0 0 0 / ${((255 - stroke.back) / 255).toFixed(2)})`);
    }
    if (look.glow) under.push(`0 0 ${length(0.12)} ${look.accent}`, `0 0 ${length(0.3)} ${look.accent}`);
    return { on, under };
  };
  const layers = shadowsIn((share) => `${share / em}em`);
  const shadows = [...layers.on, ...layers.under];

  // The line's size on screen (cqw per 1.0 of an ASS size): shrunk to fit, or a lockup's base size (the block shrunk).
  const sized = laid ? laid.unit : look.size * unit * fit.scale;
  const textStyle: CSSProperties = {
    fontSize: laid ? `${(sized * em).toFixed(3)}cqw` : `${(look.size * unit * em * fit.scale).toFixed(2)}cqw`,
    fontWeight: weight ? WEIGHT[weight] : 400,
    lineHeight: 1.12,
    color: look.color,
    whiteSpace: "nowrap",
    textShadow: shadows.join(", ") || undefined,
    WebkitTextStroke: (look.stroke === "hard" || look.fill === "hollow") && outlineEm > 0 ? `${(2 * outlineEm).toFixed(3)}em ${strokeColor}` : undefined,
    paintOrder: "stroke fill",
    // Letter spacing as a share of the font size (bigger words and a lockup's lines set their own, at their size).
    letterSpacing: look.tracking ? `${look.tracking / em}em` : undefined,
  };
  // A key word's glow (KEY_GLOW, softer than the line glow), in the key colour, at the key word's own size (its em),
  // over the line's soft shadow and glow and under the words' own shadow. It's drawn as the line glow is drawn here (a
  // libass outline 0.1 wide, blurred 0.12, alpha 0x30, as shadows blurred 0.12 and 0.3: the blur, and the blur plus
  // 1.8 widths), as much fainter as its alpha makes it. A word's own text-shadow replaces the one it inherits, so those
  // are written again, in container units at the line's size.
  const keyGlow = look.keyGlow
    ? (() => {
        const abs = shadowsIn((share) => `${(share * sized).toFixed(3)}cqw`);
        const color = rgba(look.keyword, +Math.min(1, (255 - KEY_GLOW.alpha) / (255 - 0x30)).toFixed(3));
        const glow = [KEY_GLOW.blur, KEY_GLOW.blur + 1.8 * KEY_GLOW.width].map((share) => `0 0 ${(share / keyEm).toFixed(4)}em ${color}`);
        return [...abs.on, ...glow, ...abs.under].join(", ");
      })()
    : undefined;
  // Top and middle hang the lines from their height; bottom stands them on it.
  const place = captionY(aspect.width, aspect.height, look);
  const position: CSSProperties = look.position === "bottom" ? { bottom: `${((1 - place) * 100).toFixed(1)}%` } : { top: `${(place * 100).toFixed(1)}%` };

  // The spoken word's animation, as keyframes in the style tag below: the older ones from their sizes (wordMotion), the
  // newer ones from their steps (WORD_KEYS), flashing back to the colour the render gives the word (wordColor in
  // runner/src/reel.ts: a key word's own, else the accent; on a band, the band's text colour).
  // (Hollow letters never pop, as in the render.)
  const motion = active >= 0 && animates && !revealing && !(look.fill === "hollow" && look.animation === "pop") ? motionKeyframes(look, keys.has(active)) : null;
  const keyed = active >= 0 && animates ? keyedKeyframes(look, !band && keys.has(active) && look.keyword !== look.color ? look.keyword : look.accent, keyFont && keys.has(active) ? keyEm : em) : null;
  // The line comes in: a fade (longer for "fade"), a slide up or down as it fades in (its box or bar too, being inside
  // it, as in the render), none for the animations that bring words in one by one. A lockup's marker band fades in
  // with its word as long.
  const slide = slideKeyframes(look, em);
  const lineFade = look.animation === "none" || revealing ? undefined : slide ? `${slide.name} ${slide.ms}ms linear` : `reel-fade ${look.animation === "fade" ? 0.12 : 0.06}s ease-out`;
  const bandFade = look.animation === "none" || revealing ? undefined : `reel-fade ${look.animation === "fade" ? 120 : slide ? slide.ms : 60}ms linear`;

  // A word's letters: one by one for typewriter (from faint, with ghost), popping in turn for wave (not on a band,
  // which doesn't grow), inside the band for a keyed animation; and with no letter spacing after a line's last letter,
  // as the render writes it (\fsp0), so a spaced line sits centred and its box fits its letters.
  const lettersOf = (k: number, said: boolean, keyedAnimation: string | undefined, untrail: boolean): ReactNode => {
    const chars = [...shown[k]];
    const last = chars.length - 1;
    const tight = (i: number): CSSProperties => (untrail && i === last ? { letterSpacing: 0 } : {});
    if (look.animation === "typewriter" && said && animates)
      return chars.map((ch, i) => (
        <span key={i} style={{ opacity: look.ghost ? GHOST_OPACITY : 0, animation: `reel-type 1ms linear ${Math.round(i * TYPEWRITER_LETTER * 1000)}ms forwards`, ...tight(i) }}>
          {ch}
        </span>
      ));
    if (look.animation === "wave" && said && animates && !band)
      return chars.map((ch, i) => (
        <span key={i} style={{ display: "inline-block", transformOrigin: "50% 80%", animation: `reel-wave ${WAVE.up + WAVE.down}ms linear ${i * WAVE.stagger}ms both`, ...tight(i) }}>
          {ch}
        </span>
      ));
    const plain = untrail && last >= 0 ? (
      <>
        {chars.slice(0, last).join("")}
        <span style={tight(last)}>{chars[last]}</span>
      </>
    ) : (
      shown[k]
    );
    return keyedAnimation && band ? <span style={{ display: "inline-block", animation: keyedAnimation }}>{plain}</span> : plain;
  };

  /** Word k, in a line (`line` null) or on a lockup's line. */
  const wordSpan = (k: number, line: LockupLine | null) => {
    const isKey = keys.has(k);
    const said = k === active;
    // With words to come shown faintly, the words already said keep the spoken word's look (its colour, its band).
    const lit = said || (look.ghost && k < active);
    const ownFont = isKey && keyFont ? keyFont : null;
    const keyColor = isKey && look.keyword !== look.color ? look.keyword : null;
    let color = lit ? (keyColor ?? look.accent) : (keyColor ?? look.color);
    if (look.fill === "karaoke") color = k <= active ? (keyColor ?? look.accent) : look.color;
    const css: CSSProperties = { color };
    // In a line a key word is bigger, and in its own font at that font's size; a lockup's lines have their own sizes.
    const grow = look.keyScale * (ownFont ? (keySize * keyEm) / em : 1);
    if (!line && isKey && grow !== 1) css.fontSize = `${grow}em`;
    // A key word in a font of its own, at its weight (its italics set inside, by its class; a lockup's line sets both);
    // in the light weighted styles, extra-bold.
    if (ownFont) Object.assign(css, line ? { fontWeight: keyWeightCss } : { fontWeight: keyWeightCss, fontStyle: "normal" });
    else if (isKey && lightKeys) css.fontWeight = keyWeightCss;
    // Spacing is a share of the word's own size, and the look's font's only: a key word in a font of its own has none.
    if (!line && isKey && look.tracking) css.letterSpacing = ownFont ? "normal" : `${look.tracking / em}em`;
    if (isKey && keyGlow) css.textShadow = keyGlow;
    if (look.fill === "dim" && !lit) css.opacity = 0.6;
    if (look.fill === "hollow") css.color = lit ? look.accent : "transparent";
    // The spoken word turns bold in the look's own font only.
    if (boldFill && said && !ownFont) css.fontWeight = 800;
    // On a box behind the spoken word, the word reads in the box's own text colour, printed flat. A lockup draws the box
    // as the render does (below), a line as the word's background.
    if (band && lit)
      Object.assign(
        css,
        line
          ? { color: look.accent, WebkitTextStroke: "0", textShadow: "none", position: "relative" }
          : { color: look.accent, background: look.backgroundColor, padding: "0 0.12em", borderRadius: "0.14em", WebkitTextStroke: "0", textShadow: "none" },
      );
    if (said && motion) Object.assign(css, { display: "inline-block", animation: `${motion.name} ${motion.ms}ms ease-out`, transformOrigin: motion.rises ? "50% 80%" : "50% 50%" });
    // The newer ones grow from about the baseline, as libass scales, and hold their first step from the start (a word
    // that comes in starts unseen). On a band only the letters change: the render draws the band on its own.
    const keyedAnimation = said && keyed ? `${keyed.name} ${keyed.ms}ms linear both` : undefined;
    if (keyedAnimation && !band) Object.assign(css, { display: "inline-block", transformOrigin: "50% 80%", animation: keyedAnimation });
    // Words not said yet keep their place, unseen; or faint, with ghost on (every layer of them, a glow too).
    if (k > active && (revealing || look.ghost)) css.opacity = look.ghost ? GHOST_OPACITY : 0;
    if (look.animation === "reveal" && said && animates) Object.assign(css, { display: "inline-block", animation: `reel-reveal${look.ghost ? "-g" : ""} 80ms ease-out` });
    const untrail = Boolean(look.tracking) && inLookFont(k) && (line ? k === line.to - 1 : k === words.length - 1 || (fit.breakAt !== null && k === fit.breakAt - 1));
    const letters = lettersOf(k, said, keyedAnimation, untrail);
    // A key word's own font in a line, inside the word (which sets italics off).
    const content = !line && ownFont ? <span className={keyFontClass(ownFont)}>{letters}</span> : letters;
    // A lockup's marker band, as the render draws it: from the word's capitals' top to just under its baseline, a
    // little wider than its letters (not their last letter spacing), under the line's words, fading in with its word.
    let marker: ReactNode = null;
    if (line && band && lit) {
      const lineEm = CAPTION_FONT_EM[line.font];
      const wordFont = ownFont ?? look.font;
      const cap = CAPTION_FONT_CAP[wordFont] * CAPTION_FONT_EM[wordFont];
      const trail = !untrail && inLookFont(k) && letterCount(shown[k]) ? look.tracking : 0;
      const at = (share: number) => `${(share / lineEm).toFixed(4)}em`;
      // The word's top is its line's for a word that animates (an inline block), its letters' own otherwise.
      const below = css.display === "inline-block" ? line.offset : line.ascent;
      marker = (
        <span
          aria-hidden
          className="absolute"
          style={{ zIndex: -1, left: at(-0.12), right: at(trail - 0.12), top: `${(below - (cap + 0.16) / lineEm).toFixed(4)}em`, height: at(cap + 0.32), borderRadius: at(0.14), background: look.backgroundColor, animation: said ? bandFade : undefined }}
        />
      );
    }
    return onWord ? (
      <span
        key={said ? tick : "still"}
        role="button"
        tabIndex={0}
        aria-label={`Edit “${words[k]}”`}
        onClick={(e) => {
          e.stopPropagation();
          onWord(k);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onWord(k);
          }
        }}
        className={cn("pointer-events-auto cursor-text rounded-[0.12em] outline-offset-[0.06em] hover:outline hover:outline-[0.06em] hover:outline-white/80 focus-visible:outline focus-visible:outline-[0.06em] focus-visible:outline-white", k === selected && "outline outline-[0.08em] outline-white")}
        style={css}
      >
        {content}
        {marker}
      </span>
    ) : (
      <span key={said ? tick : "still"} style={css}>
        {content}
        {marker}
      </span>
    );
  };

  const styles = (
    <style>{`@keyframes reel-pop{from{transform:scale(1.14)}to{transform:scale(1)}}@keyframes reel-fade{from{opacity:0}to{opacity:1}}@keyframes reel-reveal{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}@keyframes reel-type{to{opacity:1}}${WAVE_KEYFRAMES}${look.ghost ? REVEAL_GHOST_KEYFRAMES : ""}${motion?.css ?? ""}${keyed?.css ?? ""}${slide?.css ?? ""}`}</style>
  );
  // The key font as a key word has it, for measuring.
  const probe = keyFont && (
    <span className="invisible absolute" style={{ fontStyle: "normal", fontWeight: keyWeightCss }}>
      <span ref={keyProbe} className={keyFontClass(keyFont)} />
    </span>
  );

  if (!lockup) {
    // Lined up at the left: from the caption area's left edge (a box keeps its padding outside it; a bar stays where it
    // is, its words from that edge).
    const leftEdge = 50 - captionWidth(aspect.width, aspect.height, bar) * 50;
    const align: CSSProperties = look.align !== "left" ? {} : bar ? { textAlign: "left" } : { textAlign: "left", left: look.background === "box" ? `calc(${leftEdge.toFixed(3)}cqw - 0.28em)` : `${leftEdge.toFixed(3)}cqw` };
    return (
      <span ref={frame} className={cn("pointer-events-none absolute inset-x-0 flex justify-center [container-type:inline-size]", className)} style={{ ...position, height: 0 }} aria-hidden={onWord ? undefined : true}>
        {styles}
        {probe}
        <span
          ref={text}
          key={lineFade ? lineKey : "line"}
          className={cn("absolute text-center", look.position === "bottom" ? "bottom-0" : "top-0", CAPTION_FONT_CLASS[look.font])}
          style={{ ...textStyle, ...(bar ? { width: "90%" } : {}), ...align, animation: lineFade }}
        >
          {/* One box around the whole caption, or a bar across the frame with an accent stripe, as the render draws them. */}
          <span
            className={cn(look.background === "box" && "inline-block")}
            style={
              look.background === "box"
                ? { background: rgba(look.backgroundColor, (255 - boxAlpha(look.backgroundColor)) / 255), padding: "0.14em 0.28em", borderRadius: "0.22em" }
                : bar
                  ? { display: "block", background: rgba(look.backgroundColor, 0.88), padding: "0.2em 0.4em", borderRadius: "0.12em", borderLeft: `0.16em solid ${look.accent}`, ...(look.align === "left" ? { paddingLeft: `calc(${(leftEdge - 5).toFixed(3)}cqw - 0.16em)` } : {}) }
                  : undefined
            }
          >
            {words.map((_, k) => (
              <Fragment key={`${lineKey}-${k}`}>
                {k > 0 && k !== fit.breakAt ? " " : ""}
                {k > 0 && k === fit.breakAt && <br />}
                {wordSpan(k, null)}
              </Fragment>
            ))}
          </span>
        </span>
      </span>
    );
  }

  // A lockup, as measured: each line placed on its baseline and lined up on its point (from the left, centred, or to the
  // right), in its own stacking context so a marker band goes under its words; the box round the block under all.
  const boxOpacity = (255 - (bar ? 0x20 : boxAlpha(look.backgroundColor))) / 255;
  return (
    <span ref={frame} className={cn("pointer-events-none absolute inset-x-0 flex justify-center [container-type:inline-size]", className)} style={{ ...position, height: 0 }} aria-hidden={onWord ? undefined : true}>
      {styles}
      {probe}
      <span ref={text} key={lineFade ? lineKey : "line"} className={cn("absolute inset-x-0 top-0", CAPTION_FONT_CLASS[look.font])} style={{ ...textStyle, height: 0, animation: lineFade }}>
        {laid?.box && (
          <span
            className="absolute"
            style={{ left: `${laid.box.left.toFixed(3)}cqw`, top: `${laid.box.top.toFixed(3)}cqw`, width: `${laid.box.width.toFixed(3)}cqw`, height: `${laid.box.height.toFixed(3)}cqw`, borderRadius: `${laid.box.radius.toFixed(3)}cqw`, background: rgba(look.backgroundColor, boxOpacity) }}
          />
        )}
        {laid?.lines.map((line, n) => {
          const ownFont = line.key && keyFont;
          const at: CSSProperties = line.an === 4 ? { left: `${line.x.toFixed(3)}cqw` } : line.an === 6 ? { right: `${(100 - line.x).toFixed(3)}cqw` } : { left: `${line.x.toFixed(3)}cqw`, transform: "translateX(-50%)" };
          // Without kerning, as libass draws the render's captions.
          return (
            <span key={n} className="absolute isolate" style={{ ...at, top: `${line.top.toFixed(3)}cqw`, ...(ownFont ? { fontStyle: "normal" } : {}) }}>
              <span className={cn("block", ownFont && keyFontClass(keyFont))} style={{ fontSize: `${line.size}cqw`, lineHeight: 1, fontKerning: "none", letterSpacing: look.tracking && !ownFont ? `${look.tracking / CAPTION_FONT_EM[line.font]}em` : undefined }}>
                {Array.from({ length: line.to - line.from }, (_, j) => line.from + j).map((k) => (
                  <Fragment key={`${lineKey}-${k}`}>
                    {k > line.from ? " " : ""}
                    {wordSpan(k, line)}
                  </Fragment>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
