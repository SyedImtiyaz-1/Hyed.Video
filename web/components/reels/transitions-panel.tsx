"use client";
import { ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpLeft, ArrowUpRight, Ban, ChevronLeft, ChevronRight, Play, Scissors, SeparatorHorizontal, SeparatorVertical, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { EFFECTS, effectsAt, NO_EFFECT } from "@launchreel/core/effects";
import { PICTURE_DEFAULTS } from "@launchreel/core/picture";
import { REEL_SOUNDS } from "@launchreel/core/sounds";
import { zoomAim } from "@launchreel/core/timeline";
import { REEL_TRANSITIONS, TRANSITION_LENGTH, TRANSITIONS, transitionDirs, transitionJoints, xfadeName, type PlacedTransition, type TransitionDir, type TransitionJoint, type TransitionKind } from "@launchreel/core/transitions";
import type { CutClock, Trim } from "@launchreel/core/trims";
import { cn } from "@/lib/cn";
import { PictureLayers, useVideoFilter, viewTransform } from "./picture-layers";
import { drawXfade, HblurSvg, pictureOf, xfadeLook, type XfadeScratch } from "./transition-layers";

const clock = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
const near = (a: number, b: number) => Math.abs(a - b) < 0.001;

/**
 * Which way each direction goes, as a button. "h" and "v" are the line it splits or squeezes along: a vertical split
 * opens sideways, a horizontal squeeze closes up and down.
 */
const DIRS: Record<TransitionDir, { label: string; icon: LucideIcon }> = {
  left: { label: "Left", icon: ArrowLeft },
  right: { label: "Right", icon: ArrowRight },
  up: { label: "Up", icon: ArrowUp },
  down: { label: "Down", icon: ArrowDown },
  tl: { label: "To the top left", icon: ArrowUpLeft },
  tr: { label: "To the top right", icon: ArrowUpRight },
  bl: { label: "To the bottom left", icon: ArrowDownLeft },
  br: { label: "To the bottom right", icon: ArrowDownRight },
  h: { label: "Horizontal", icon: SeparatorHorizontal },
  v: { label: "Vertical", icon: SeparatorVertical },
};

/* ---------- thumbnails: the transition between two sample shots ---------- */

type ThumbSides = { out: HTMLImageElement; in: HTMLCanvasElement; inUrl: string };
let thumbSides: Promise<ThumbSides> | null = null;
/** The sample frame, and a second shot to go to: the sample person on a warm colour. Made once a page. */
function loadThumbSides() {
  thumbSides ??= (async () => {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    const [frame, person] = await Promise.all([load("/reels/sample-frame.jpg"), load("/reels/sample-person.webp")]);
    const c = document.createElement("canvas");
    [c.width, c.height] = [180, 320];
    const ctx = c.getContext("2d")!;
    const warm = ctx.createLinearGradient(0, 0, c.width, c.height);
    warm.addColorStop(0, "#ffb347");
    warm.addColorStop(1, "#e8466f");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(person, 0, 0, c.width, c.height);
    return { out: frame, in: c, inUrl: c.toDataURL("image/jpeg", 0.85) };
  })();
  thumbSides.catch(() => (thumbSides = null));
  return thumbSides;
}

// Still, each shows a telling moment (seconds from the cut): mid-way for most, the next shot coming out of black, white
// or a closing box or circle, the flash half up.
const STILL: Partial<Record<TransitionKind, number>> = { black: 0.06, white: 0.05, iris: 0.18, box: 0.18, flash: -0.03 };

/** A transition between two sample shots: on a loop while `playing` (a telling moment when still), its effect too. */
export function TransitionThumb({ kind, dir, playing, className }: { kind: TransitionKind; dir?: TransitionDir; playing: boolean; className?: string }) {
  const spec = TRANSITIONS[kind];
  const name = xfadeName(kind, dir);
  const [sides, setSides] = useState<ThumbSides | null>(null);
  const [t, setT] = useState(0);
  const box = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scratch = useRef<XfadeScratch>({});
  const [width, setWidth] = useState(90);
  const id = `xfade-thumb-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  useEffect(() => {
    let on = true;
    loadThumbSides()
      .then((s) => on && setSides(s))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const resize = new ResizeObserver(() => setWidth(el.clientWidth || 90));
    resize.observe(el);
    return () => resize.disconnect();
  }, []);
  // From a moment before the transition to a moment after it, then again.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const began = performance.now();
    const loop = () => {
      const span = spec.length + 1;
      setT((((performance.now() - began) / 1000) % span) - spec.length / 2 - 0.45);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, spec.length]);
  const at = playing ? t : (STILL[kind] ?? 0);
  const progress = Math.min(1, Math.max(0, 0.5 - at / spec.length));
  const look = xfadeLook(name, progress);
  const fx = spec.effect ? effectsAt([{ at: 0, effect: spec.effect, length: EFFECTS[spec.effect].length }], at) : NO_EFFECT;
  const { filter, svg } = useVideoFilter(PICTURE_DEFAULTS, fx, width);
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !sides || !look.canvas) return;
    const h = Math.round((width * 16) / 9);
    if (c.width !== Math.round(width * 2) || c.height !== h * 2) [c.width, c.height] = [Math.round(width * 2), h * 2];
    drawXfade(ctx, look.canvas, name, progress, pictureOf(sides.out), pictureOf(sides.in), width, scratch.current);
  }, [sides, look.canvas, name, progress, width]);
  const blur = look.hblur !== undefined ? { filter: `url(#${id})` } : {};
  return (
    <span ref={box} className={cn("relative block aspect-[9/16] w-full overflow-hidden rounded-md bg-[#1a1d24]", className)}>
      {svg}
      {look.hblur !== undefined && <HblurSvg id={id} size={look.hblur * width} />}
      <span className="absolute inset-0 isolate" style={{ ...viewTransform(1 + fx.zoom, fx.dx, fx.dy, zoomAim(9, 16), fx.rot), filter }}>
        <span className="absolute inset-0" style={{ background: look.bg ?? "#000" }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- the shared sample still */}
        <img src="/reels/sample-frame.jpg" alt="" className="absolute inset-0 size-full object-cover" style={{ ...look.out, ...blur, zIndex: look.top === "out" ? 2 : 1 }} loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element -- made on the page */}
        {sides && <img src={sides.inUrl} alt="" className="absolute inset-0 size-full object-cover" style={{ ...look.in, ...blur, zIndex: look.top === "in" ? 2 : 1 }} />}
        {look.canvas && <canvas ref={canvas} className="absolute inset-0 z-[3] size-full" />}
      </span>
      <PictureLayers picture={PICTURE_DEFAULTS} fx={fx} animate={playing} />
    </span>
  );
}

/* ---------- the panel ---------- */

export type TransitionActions = {
  /** Puts a transition at a place (null takes it away), with its sound when `withSound`. */
  put: (at: number, kind: TransitionKind | null, withSound: boolean) => void;
  change: (at: number, patch: { dir?: TransitionDir; length?: number }) => void;
  /** The same transition at every place. */
  putAll: (kind: TransitionKind, withSound: boolean) => void;
  removeAll: () => void;
  /** Picks a place and shows it (paused on the cut). */
  select: (at: number) => void;
  /** Plays a place's transition from a moment before it. */
  play: (at: number) => void;
};

/**
 * Transitions between shots: at every jump cut (where a stretch was cut out) and every cut in the video. Pick a cut,
 * then a transition for it; each has its way, its length and its sound. Or the same one at every cut.
 */
export function TransitionsPanel({
  places,
  edit,
  transitions,
  joints,
  cutAt,
  time,
  selected,
  sfxOn,
  actions,
  noun = "reel",
}: {
  /** Where transitions can go, on the upload's clock (transitionPlaces). */
  places: readonly number[];
  /** The edit's length, cuts and shot changes (to tell why one won't play). */
  edit: { duration: number; trims: readonly Trim[]; cuts: readonly number[] };
  transitions: readonly PlacedTransition[];
  joints: readonly TransitionJoint[];
  cutAt: CutClock;
  /** The playhead, on the upload's clock. */
  time: number;
  selected: number | null;
  sfxOn: boolean;
  actions: TransitionActions;
  noun?: "reel" | "video";
}) {
  const [hover, setHover] = useState<TransitionKind | null>(null);
  const [withSound, setWithSound] = useState(true);
  const [forAll, setForAll] = useState<TransitionKind>("mix");
  if (!places.length) {
    return (
      <div className="rounded-lg border border-gray-alpha-400 p-3 text-sm">
        <p className="font-medium text-gray-1000">No cuts yet</p>
        <p className="mt-0.5 text-[13px] text-gray-900">Transitions go where the video jumps. Cut a pause in the Cuts tab, or cut words in the Text tab, and they can go there.</p>
      </div>
    );
  }
  // The place picked, or the one nearest the playhead.
  const now = cutAt.toCut(time);
  const nearest = places.reduce((best, p) => (Math.abs(cutAt.toCut(p) - now) < Math.abs(cutAt.toCut(best) - now) ? p : best), places[0]);
  const at = selected !== null && places.some((p) => near(p, selected)) ? places.find((p) => near(p, selected))! : nearest;
  const index = places.findIndex((p) => near(p, at));
  const jump = (p: number) => edit.trims.some((t) => near(t.end, p));
  const placed = transitions.find((t) => near(t.at, at)) ?? null;
  const joint = joints.find((j) => near(j.at, at)) ?? null;
  const spec = placed ? TRANSITIONS[placed.kind] : null;
  const dirs = placed ? transitionDirs(placed.kind) : [];
  const count = transitions.filter((t) => places.some((p) => near(p, t.at))).length;
  // One that won't play: on its own it would (it runs into the one before), or there's no room for it here.
  const why = placed && !joint ? (transitionJoints({ ...edit, transitions: [placed] }).length ? "It runs into the transition before, so it won't play. Shorten one of them." : "It won't play here: a shot beside it is too short.") : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <button type="button" onClick={() => actions.select(places[index - 1])} disabled={index <= 0} aria-label="The cut before" className="flex size-7 items-center justify-center rounded-md text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000 disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-0 truncate text-[13px] text-gray-900">
              Cut {index + 1} of {places.length}, at <span className="tabular-nums text-gray-1000">{clock(cutAt.toCut(at))}</span> ({jump(at) ? "a jump cut" : "a shot change"})
            </p>
            <button type="button" onClick={() => actions.select(places[index + 1])} disabled={index >= places.length - 1} aria-label="The cut after" className="flex size-7 items-center justify-center rounded-md text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000 disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-gray-1000">
            <input type="checkbox" checked={withSound} onChange={(e) => setWithSound(e.target.checked)} className="size-3.5 accent-[var(--ds-gray-1000)]" />
            With sound
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => actions.put(at, null, withSound)}
            aria-pressed={!placed}
            title="A straight cut, no transition"
            className={cn("rounded-lg border p-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-1000", !placed ? "border-gray-1000" : "border-gray-alpha-400 hover:border-gray-alpha-600")}
          >
            <span className="flex aspect-[9/16] w-full items-center justify-center rounded-md bg-gray-alpha-100 text-gray-900">
              <Ban className="size-5" />
            </span>
            <span className="mt-1 block truncate text-[13px] font-medium text-gray-1000">None</span>
          </button>
          {REEL_TRANSITIONS.map((kind) => {
            const on = placed?.kind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => actions.put(at, kind, withSound)}
                onMouseEnter={() => setHover(kind)}
                onMouseLeave={() => setHover((h) => (h === kind ? null : h))}
                onFocus={() => setHover(kind)}
                onBlur={() => setHover((h) => (h === kind ? null : h))}
                aria-pressed={on}
                title={TRANSITIONS[kind].hint}
                className={cn("rounded-lg border p-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-1000", on ? "border-gray-1000" : "border-gray-alpha-400 hover:border-gray-alpha-600")}
              >
                <TransitionThumb kind={kind} dir={on ? placed?.dir : undefined} playing={hover === kind} />
                <span className="mt-1 block truncate text-[13px] font-medium text-gray-1000">{TRANSITIONS[kind].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {placed && spec && (
        <div className="space-y-3 rounded-lg border border-gray-alpha-400 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-1000">{spec.label}</p>
            <p className="min-w-0 flex-1 text-xs text-gray-900">{spec.hint}.</p>
            <button type="button" onClick={() => actions.play(at)} className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000">
              <Play className="size-3.5" />
              Play it
            </button>
            <button type="button" onClick={() => actions.put(at, null, false)} aria-label={`Remove the ${spec.label.toLowerCase()} at ${clock(cutAt.toCut(at))}`} className="flex size-8 items-center justify-center rounded-md text-gray-900 hover:bg-gray-alpha-100 hover:text-red-900">
              <Trash2 className="size-4" />
            </button>
          </div>
          {dirs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-gray-900">Way</span>
              {dirs.map((d) => {
                const { label, icon: Icon } = DIRS[d];
                const on = (placed.dir ?? dirs[0]) === d;
                return (
                  <button key={d} type="button" onClick={() => actions.change(at, { dir: d })} aria-pressed={on} title={label} aria-label={label} className={cn("flex h-8 items-center gap-1 rounded-md border px-2 text-xs", on ? "border-gray-1000 bg-gray-alpha-200 text-gray-1000" : "border-gray-alpha-400 text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000")}>
                    <Icon className="size-3.5" />
                    {(d === "h" || d === "v") && label}
                  </button>
                );
              })}
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-gray-900">
            Length
            <input type="range" min={TRANSITION_LENGTH.min} max={TRANSITION_LENGTH.max} step={0.05} value={placed.length} onChange={(e) => actions.change(at, { length: Number(e.target.value) })} className="h-1 min-w-0 flex-1 accent-[var(--ds-gray-1000)]" aria-label="Length in seconds" />
            <span className="w-10 text-right tabular-nums text-gray-1000">{placed.length.toFixed(2)}s</span>
          </label>
          <p className="text-xs text-gray-900">
            {why ??
              (joint!.length < placed.length - 0.02
                ? `Plays ${joint!.length.toFixed(2)}s here: it has to fit the shots either side. `
                : "Half before the cut, half after. ")}
            {joint && spec.sound && sfxOn ? `Goes well with ${REEL_SOUNDS[spec.sound].label.toLowerCase()} (Audio tab).` : ""}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-gray-alpha-400 p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-1000">
          <Scissors className="size-3.5" />
          At every cut
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-[13px] text-gray-900">
            Your {noun} has {places.length} {places.length === 1 ? "cut" : "cuts"}
            {count ? `, ${count} with a transition` : ""}. Put
          </p>
          <select value={forAll} onChange={(e) => setForAll(e.target.value as TransitionKind)} aria-label="Transition for every cut" className="h-8 rounded-md border border-gray-alpha-400 bg-background-100 px-2 text-[13px] text-gray-1000">
            {REEL_TRANSITIONS.map((k) => (
              <option key={k} value={k}>
                {TRANSITIONS[k].label}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => actions.putAll(forAll, withSound)} className="h-8 rounded-md bg-gray-1000 px-3 text-[13px] font-medium text-background-100">
            On every cut
          </button>
          {transitions.length > 0 && (
            <button type="button" onClick={actions.removeAll} className="flex h-8 items-center gap-1.5 rounded-md border border-gray-alpha-400 px-2.5 text-[13px] text-gray-1000 hover:bg-gray-alpha-100">
              <Trash2 className="size-3.5" />
              Remove all
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-1000">Cuts in this {noun}</p>
        <ul className="space-y-1">
          {places.map((p) => {
            const t = transitions.find((x) => near(x.at, p));
            const j = joints.find((x) => near(x.at, p));
            return (
              <li key={p}>
                <button type="button" onClick={() => actions.select(p)} className={cn("flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left", near(p, at) ? "bg-gray-alpha-100 ring-1 ring-gray-alpha-400" : "hover:bg-gray-alpha-100")}>
                  <span className="w-12 shrink-0 text-xs tabular-nums text-gray-900">{clock(cutAt.toCut(p))}</span>
                  <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", jump(p) ? "bg-red-200 text-red-1000" : "bg-amber-200 text-amber-1000")}>{jump(p) ? "Jump cut" : "Shot change"}</span>
                  <span className={cn("min-w-0 truncate text-[13px]", t ? "text-gray-1000" : "text-gray-900")}>
                    {t ? `${TRANSITIONS[t.kind].label}${t.dir && transitionDirs(t.kind).length > 1 ? `, ${DIRS[t.dir].label.toLowerCase()}` : ""}` : "Straight cut"}
                  </span>
                  {t && <span className="ml-auto shrink-0 text-xs tabular-nums text-gray-900">{j ? `${j.length.toFixed(2)}s` : "won't play"}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
