"use client";
import { AudioLines, Captions, Eye, EyeOff, Film, Magnet, Maximize, Minimize, Music, Pause, Play, Redo2, Scissors, SkipBack, SkipForward, Smile, Sparkles, Undo2, Video, X, ZoomIn, ZoomOut, type LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CaptionLine } from "@launchreel/core/captions";
import { EFFECTS, effectSpan } from "@launchreel/core/effects";
import { REEL_MUSIC } from "@launchreel/core/music-beds";
import type { ReelEdit } from "@launchreel/core/reel";
import { REEL_SOUNDS } from "@launchreel/core/sounds";
import { emojiShows, type ZoomWindow } from "@launchreel/core/timeline";
import { cn } from "@/lib/cn";

export type TimelineItem =
  | { kind: "line"; word: number }
  | { kind: "effect"; index: number }
  | { kind: "zoom"; word: number }
  | { kind: "emoji"; word: number }
  | { kind: "sound"; index: number }
  | { kind: "trim"; index: number }
  | { kind: "broll"; index: number }
  | { kind: "music" };
/** A B-roll shot's span on the recording's clock (it plays straight over any cut inside it). */
export type BrollSpan = { index: number; start: number; end: number; query: string };
/** A piece being dragged: by its body (moved) or by an edge (resized), `delta` seconds from where the drag began. */
export type TimelineDrag = { item: TimelineItem; mode: "move" | "start" | "end"; delta: number };
/**
 * The header's controls, where Cardboard's editor has them: the time and undo, redo and snap on the left; back, play and
 * forward in the middle (back and forward go a caption line); zoom and full screen on the right.
 */
export type TimelineControls = {
  now: string;
  total: string;
  playing: boolean;
  onPlay: () => void;
  onBack: () => void;
  onForward: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  snap: boolean;
  onSnap: () => void;
  full: boolean;
  onFull: () => void;
};

const TRIM_NAME = { pause: "Pause", filler: "Filler", retake: "Retake", cut: "Cut" } as const;

// The tracks' names on the left, with the playhead's timecode over them.
const LABEL = 104;
// 1×: the whole reel fits (Fit); up to 16× closer. The buttons step by half again; the slider is on a log scale.
const MAX_ZOOM = 16;
const ZOOM_STEP = 1.5;
// The ruler's spacing: the closest of these that leaves room for its labels.
const TICK_STEPS = [0.5, 1, 2, 5, 10, 30, 60];
const TICK_PX = 56;
// A press that moves less than this is a click, not a drag.
const DRAG_PX = 3;
// Whether empty tracks are hidden, remembered in this browser.
const HIDE_EMPTY_KEY = "hyped:timeline-hide-empty";
const TRACK_ICON: Record<string, LucideIcon> = { Cuts: Scissors, Captions, "B-roll": Film, Zooms: ZoomIn, Effects: Sparkles, Emojis: Smile, Sounds: AudioLines, Music };
// The playhead as a timecode, 00:00:01.250.
const timecode = (t: number) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`;
};
// A header button: an icon, its name in the tooltip.
const TOOL = "flex size-7 items-center justify-center rounded-md text-gray-900 transition-colors hover:bg-gray-alpha-200 hover:text-gray-1000 disabled:opacity-40 disabled:hover:bg-transparent";

const same = (a: TimelineItem | null | undefined, b: TimelineItem) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The reel along time, CapCut-style, on the recording's clock: the video, what's cut (hatched across every track), the
 * captions, the B-roll, the effects and punch-ins, the emojis, the sounds and the music, the shot changes marked across
 * them, and the playhead. Click or drag the ruler to move the playhead; click a piece to select it and edit it.
 *
 * Editing on it, as Cardboard's and CapCut's timelines do: drag a B-roll shot, an effect, a sound or a cut to move it,
 * and the edge of a shot, an effect or a cut to change its length (`onDrag` while it moves, live; `onDragEnd` after);
 * drag across the video to select a stretch (`onRange`) and cut it out (`onCutRange`).
 */
export function ReelTimeline({
  edit,
  lines,
  windows,
  broll,
  time,
  duration,
  showEmojis,
  showZooms,
  showSounds,
  selected,
  range,
  onSeek,
  onPick,
  onDrag,
  onDragEnd,
  onRange,
  onCutRange,
  controls,
  video: clip,
}: {
  edit: ReelEdit;
  lines: CaptionLine[];
  windows: ZoomWindow[];
  broll: BrollSpan[];
  time: number;
  duration: number;
  showEmojis: boolean;
  showZooms: boolean;
  showSounds: boolean;
  selected?: TimelineItem | null;
  range?: [number, number] | null;
  onSeek: (t: number) => void;
  onPick: (item: TimelineItem) => void;
  onDrag?: (drag: TimelineDrag) => void;
  onDragEnd?: () => void;
  onRange?: (range: [number, number] | null) => void;
  onCutRange?: () => void;
  controls?: TimelineControls;
  /** The clip itself, for the Video track's filmstrip and its name on it, as Cardboard's track shows them. */
  video?: { src: string; name: string };
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const resize = new ResizeObserver(() => setWidth(el.clientWidth));
    resize.observe(el);
    setWidth(el.clientWidth);
    return () => resize.disconnect();
  }, []);
  const perSecond = (Math.max(200, width - LABEL - 8) / Math.max(1, duration)) * zoom;
  const frames = useFilmstrip(clip?.src, FILMSTRIP_FRAMES);
  const x = (t: number) => t * perSecond;
  const full = x(duration);

  // Zooming keeps one moment where it is on screen: the pointer's (scrolling with ⌘ or Ctrl, or a trackpad pinch), or
  // the playhead's (the buttons and the slider; the middle when the playhead is out of view). Fit shows the whole reel.
  const anchor = useRef<{ t: number; px: number } | null>(null);
  const zoomTo = (next: number, px?: number) => {
    const el = box.current;
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    if (!el || z === zoom) return;
    const head = LABEL + x(time) - el.scrollLeft;
    const at = px ?? (head > LABEL && head < el.clientWidth ? head : el.clientWidth / 2);
    anchor.current = { t: Math.max(0, Math.min(duration, (el.scrollLeft + at - LABEL) / perSecond)), px: at };
    setZoom(z);
  };
  useLayoutEffect(() => {
    const el = box.current;
    const a = anchor.current;
    if (!el || !a) return;
    anchor.current = null;
    el.scrollLeft = Math.max(0, LABEL + a.t * perSecond - a.px);
  }, [perSecond]);
  // React listens to the wheel passively, so it can't stop the page zooming: this listener isn't.
  const zoomer = useRef(zoomTo);
  zoomer.current = zoomTo;
  const zoomNow = useRef(zoom);
  zoomNow.current = zoom;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomer.current(zoomNow.current * Math.exp(-e.deltaY * 0.0025), e.clientX - el.getBoundingClientRect().left);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keep the playhead in view while it plays (not when the scale changes: zooming keeps its own moment in place).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const at = LABEL + x(time);
    if (at < el.scrollLeft + LABEL + 16 || at > el.scrollLeft + el.clientWidth - 24) el.scrollLeft = Math.max(0, at - LABEL - el.clientWidth * 0.3);
    // Only when the time moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  const [hideEmpty, setHideEmpty] = useState(true);
  useEffect(() => {
    try {
      setHideEmpty(localStorage.getItem(HIDE_EMPTY_KEY) !== "0");
    } catch {}
  }, []);
  const toggleEmpty = () => {
    setHideEmpty((h) => {
      try {
        localStorage.setItem(HIDE_EMPTY_KEY, h ? "0" : "1");
      } catch {}
      return !h;
    });
  };

  const seeking = useRef(false);
  const timeAt = (e: ReactPointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.max(0, Math.min(duration, (e.clientX - rect.left) / perSecond));
  };
  const capture = (e: ReactPointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };
  const scrub = {
    onPointerDown: (e: ReactPointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-piece]")) return;
      seeking.current = true;
      capture(e);
      onSeek(timeAt(e));
    },
    onPointerMove: (e: ReactPointerEvent) => seeking.current && onSeek(timeAt(e)),
    onPointerUp: () => (seeking.current = false),
  };

  // The video track: a click moves the playhead, a drag selects the stretch to cut.
  const selecting = useRef<{ from: number; x0: number; moved: boolean } | null>(null);
  const video = {
    onPointerDown: (e: ReactPointerEvent) => {
      capture(e);
      selecting.current = { from: timeAt(e), x0: e.clientX, moved: false };
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const s = selecting.current;
      if (!s) return;
      if (!s.moved && Math.abs(e.clientX - s.x0) < DRAG_PX) return;
      s.moved = true;
      const to = timeAt(e);
      onRange?.([Math.min(s.from, to), Math.max(s.from, to)]);
    },
    onPointerUp: (e: ReactPointerEvent) => {
      const s = selecting.current;
      selecting.current = null;
      if (s && !s.moved) {
        onRange?.(null);
        onSeek(timeAt(e));
      }
    },
  };

  // A piece: a click picks it; a drag of its body moves it, of an edge resizes it (where `edges` allows).
  const dragging = useRef<{ item: TimelineItem; mode: TimelineDrag["mode"]; x0: number; moved: boolean } | null>(null);
  const grip = (item: TimelineItem, moves: boolean, edges: { start?: boolean; end?: boolean }) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.stopPropagation();
      const edge = (e.target as HTMLElement).dataset.edge as "start" | "end" | undefined;
      const mode = edge && edges[edge] ? edge : "move";
      if (mode === "move" && !moves) return void (dragging.current = { item, mode, x0: e.clientX, moved: false });
      capture(e);
      dragging.current = { item, mode, x0: e.clientX, moved: false };
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const d = dragging.current;
      if (!d || !onDrag || (d.mode === "move" && !moves)) return;
      if (!d.moved && Math.abs(e.clientX - d.x0) < DRAG_PX) return;
      d.moved = true;
      onDrag({ item: d.item, mode: d.mode, delta: (e.clientX - d.x0) / perSecond });
    },
    onPointerUp: () => {
      const d = dragging.current;
      dragging.current = null;
      if (!d) return;
      if (d.moved) onDragEnd?.();
      else onPick(d.item);
    },
  });

  const step = TICK_STEPS.find((s) => x(s) >= TICK_PX) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const ticks = Array.from({ length: Math.floor(duration / step) + 1 }, (_, k) => k * step);
  // Seconds, as Cardboard's ruler counts them (5s, 10s; 1m 5s past a minute).
  const tickLabel = (t: number) => (t < 60 ? `${step < 1 ? t.toFixed(1) : Math.round(t)}s` : `${Math.floor(t / 60)}m${Math.round(t % 60) ? ` ${Math.round(t % 60)}s` : ""}`);
  const piece = (
    item: TimelineItem,
    left: number,
    w: number,
    className: string,
    title: string,
    children: React.ReactNode,
    editable: { moves?: boolean; start?: boolean; end?: boolean } = {},
  ) => {
    const on = same(selected, item);
    const canEdit = Boolean(onDrag) && (editable.moves || editable.start || editable.end);
    return (
      <div
        key={JSON.stringify(item)}
        role="button"
        tabIndex={0}
        data-piece
        title={title}
        aria-label={title}
        aria-pressed={on}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(item))}
        {...grip(item, Boolean(editable.moves), editable)}
        className={cn(
          "absolute top-1 flex h-5 touch-none select-none items-center overflow-hidden whitespace-nowrap rounded px-1 text-[11px] leading-none outline-none focus-visible:ring-2 focus-visible:ring-gray-1000",
          editable.moves && onDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          on && "z-10 ring-2 ring-brand",
          className,
        )}
        style={{ left, width: Math.max(w, 6) }}
      >
        {canEdit && editable.start && <span data-edge="start" className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-black/0 hover:bg-black/20" />}
        <span className="pointer-events-none truncate">{children}</span>
        {canEdit && editable.end && <span data-edge="end" className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-black/0 hover:bg-black/20" />}
      </div>
    );
  };
  const shows = showEmojis ? emojiShows(edit, lines) : [];
  const music = edit.audio.music;
  // Every track this reel can have; the empty ones show only when the customer asks for them (the toggle), Captions always.
  const all: { name: string; items: React.ReactNode[]; always?: boolean }[] = [
    {
      name: "Cuts",
      items: edit.trims.map((t, i) =>
        piece({ kind: "trim", index: i }, x(t.start), x(t.end) - x(t.start), "bg-red-700/20 text-red-900 shadow-[inset_2px_0_0_var(--color-red-700)] hover:bg-red-700/30", `${TRIM_NAME[t.reason]} cut, ${(t.end - t.start).toFixed(1)} s at ${t.start.toFixed(1)} s`, TRIM_NAME[t.reason], { moves: true, start: true, end: true }),
      ),
    },
    {
      name: "Captions",
      always: true,
      items: lines.map((l) => piece({ kind: "line", word: l.words[0].i }, x(l.start), x(l.end) - x(l.start) - 1, "bg-gray-alpha-200 text-gray-1000 shadow-[inset_2px_0_0_var(--color-gray-600)] hover:bg-gray-alpha-300", l.text, l.text)),
    },
    {
      name: "B-roll",
      items: broll.map((b) =>
        piece({ kind: "broll", index: b.index }, x(b.start), x(b.end) - x(b.start) - 1, "bg-green-700/20 text-green-900 shadow-[inset_2px_0_0_var(--color-green-700)] hover:bg-green-700/30", `B-roll: ${b.query || "stock clip"} at ${b.start.toFixed(1)} s`, b.query || "B-roll", { moves: true, start: true, end: true }),
      ),
    },
    ...(showZooms ? [{ name: "Zooms", items: windows.map((z) => piece({ kind: "zoom", word: z.word ?? 0 }, x(z.start), x(z.end + 0.45) - x(z.start), "bg-blue-700/20 text-blue-900 shadow-[inset_2px_0_0_var(--color-blue-700)] hover:bg-blue-700/30", `Punch-in at ${z.start.toFixed(1)} s`, "Zoom")) }] : []),
    {
      name: "Effects",
      items: edit.effects.map((e, i) => {
        const [a, b] = effectSpan(e);
        const left = x(Math.max(0, a));
        // Up to the next effect, so neighbours don't cover each other (the full name is in the tooltip).
        const room = (edit.effects[i + 1] ? x(Math.max(0, effectSpan(edit.effects[i + 1])[0])) : Infinity) - left - 2;
        return piece({ kind: "effect", index: i }, left, Math.min(Math.max(x(b) - left, 34), Math.max(10, room)), "bg-purple-700/20 text-purple-900 shadow-[inset_2px_0_0_var(--color-purple-700)] hover:bg-purple-700/30", `${EFFECTS[e.effect].label} at ${e.at.toFixed(1)} s`, EFFECTS[e.effect].label, { moves: true, end: true });
      }),
    },
    ...(showEmojis ? [{ name: "Emojis", items: shows.map((s) => piece({ kind: "emoji", word: s.word }, x(s.start), x(s.end) - x(s.start), "bg-amber-700/20 shadow-[inset_2px_0_0_var(--color-amber-700)] hover:bg-amber-700/30", `${s.emoji} at ${s.start.toFixed(1)} s`, <span className="text-[13px]">{s.emoji}</span>)) }] : []),
    ...(showSounds
      ? [
          {
            name: "Sounds",
            items: edit.sounds.map((s, i) =>
              piece({ kind: "sound", index: i }, x(s.at), Math.max(12, Math.min(60, (edit.sounds[i + 1] ? x(edit.sounds[i + 1].at) : Infinity) - x(s.at) - 2)), "bg-teal-700/20 text-teal-900 shadow-[inset_2px_0_0_var(--color-teal-700)] hover:bg-teal-700/30", `${REEL_SOUNDS[s.sound].label} at ${s.at.toFixed(1)} s`, `♪ ${REEL_SOUNDS[s.sound].label}`, { moves: true }),
            ),
          },
        ]
      : []),
    { name: "Music", items: music ? [piece({ kind: "music" }, 0, full - 1, "bg-pink-700/20 text-pink-900 shadow-[inset_2px_0_0_var(--color-pink-700)] hover:bg-pink-700/30", `Music: ${REEL_MUSIC[music.track].label}, ${Math.round(music.volume * 100)}%`, `♫ ${REEL_MUSIC[music.track].label} · ${Math.round(music.volume * 100)}%`)] : [] },
  ];
  const tracks = hideEmpty ? all.filter((t) => t.always || t.items.length) : all;
  const hidden = all.length - tracks.length;

  return (
    <div className="rounded-xl border border-editor-line bg-editor-panel lg:rounded-none lg:border-0">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-editor-line px-2 py-1">
        <div className="flex min-w-0 items-center gap-0.5">
          {controls && (
            <>
              <span className="mr-1.5 shrink-0 pl-1 text-xs tabular-nums text-gray-1000">
                {controls.now} <span className="text-gray-900">/ {controls.total}</span>
              </span>
              <button type="button" onClick={controls.onUndo} disabled={!controls.canUndo} aria-label="Undo" title="Undo  ⌘Z" className={TOOL}>
                <Undo2 className="size-3.5" />
              </button>
              <button type="button" onClick={controls.onRedo} disabled={!controls.canRedo} aria-label="Redo" title="Redo  ⇧⌘Z" className={TOOL}>
                <Redo2 className="size-3.5" />
              </button>
              <span className="mx-1 h-4 w-px bg-gray-alpha-400" aria-hidden />
              <button type="button" onClick={controls.onSnap} aria-pressed={controls.snap} aria-label="Snap to the playhead" title={controls.snap ? "Snapping to the playhead: on" : "Snapping to the playhead: off"} className={cn(TOOL, controls.snap && "bg-brand/15 text-brand hover:bg-brand/20 hover:text-brand")}>
                <Magnet className="size-3.5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {controls && (
            <>
              <button type="button" onClick={controls.onBack} aria-label="Previous caption line" title="Previous caption line  ↑" className={TOOL}>
                <SkipBack className="size-3.5" />
              </button>
              <button type="button" onClick={controls.onPlay} aria-label={controls.playing ? "Pause" : "Play"} title={controls.playing ? "Pause  Space" : "Play  Space"} className="flex size-8 items-center justify-center rounded-full text-gray-1000 transition-colors hover:bg-gray-alpha-200">
                {controls.playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
              </button>
              <button type="button" onClick={controls.onForward} aria-label="Next caption line" title="Next caption line  ↓" className={TOOL}>
                <SkipForward className="size-3.5" />
              </button>
            </>
          )}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={toggleEmpty}
            aria-pressed={!hideEmpty}
            title={hideEmpty ? `Show empty tracks${hidden ? ` (${hidden} hidden)` : ""}` : "Hide empty tracks"}
            aria-label={hideEmpty ? "Show empty tracks" : "Hide empty tracks"}
            className={TOOL}
          >
            {hideEmpty ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
          <div className="mx-1 hidden items-center gap-1 rounded-full border border-gray-alpha-400 px-1.5 py-0.5 sm:flex">
            <button type="button" onClick={() => zoomTo(zoom / ZOOM_STEP)} disabled={zoom === 1} aria-label="Zoom the timeline out" title="Zoom out" className="flex size-5 items-center justify-center text-gray-900 hover:text-gray-1000 disabled:opacity-40">
              <ZoomOut className="size-3.5" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={Math.log(zoom) / Math.log(MAX_ZOOM)}
              onChange={(e) => zoomTo(MAX_ZOOM ** Number(e.target.value))}
              aria-label="Timeline zoom"
              aria-valuetext={`${zoom.toFixed(1)} times`}
              className="h-1 w-24 accent-[var(--ds-gray-1000)]"
            />
            <button type="button" onClick={() => zoomTo(zoom * ZOOM_STEP)} disabled={zoom === MAX_ZOOM} aria-label="Zoom the timeline in" title="Zoom in" className="flex size-5 items-center justify-center text-gray-900 hover:text-gray-1000 disabled:opacity-40">
              <ZoomIn className="size-3.5" />
            </button>
          </div>
          <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1} title="Fit the whole reel" className="h-7 rounded-md px-2 text-xs text-gray-900 hover:bg-gray-alpha-200 hover:text-gray-1000 disabled:opacity-40 disabled:hover:bg-transparent">
            Fit
          </button>
          {controls && (
            <button type="button" onClick={controls.onFull} aria-label={controls.full ? "Exit full screen" : "Full screen"} title={controls.full ? "Exit full screen  F" : "Full screen  F"} className={TOOL}>
              {controls.full ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
            </button>
          )}
        </div>
      </div>
      {/* No scrollbar under the tracks, as Cardboard's: a trackpad, Shift+wheel, the ruler and the playhead move along. */}
      <div ref={box} className="relative overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative" style={{ width: LABEL + full + 16 }}>
          {/* The ruler. */}
          <div className="flex h-6 border-b border-gray-alpha-400">
            <div className="sticky left-0 z-20 flex shrink-0 items-center bg-editor-panel px-2 text-[10px] tabular-nums text-gray-900" style={{ width: LABEL }}>
              {timecode(time)}
            </div>
            <div className="relative cursor-pointer touch-none" style={{ width: full }} {...scrub}>
              {ticks.map((t) => (
                <span key={t} className="absolute top-0 h-full border-l border-gray-alpha-400 pl-1 text-[10px] tabular-nums leading-6 text-gray-900" style={{ left: x(t) }}>
                  {tickLabel(t)}
                </span>
              ))}
            </div>
          </div>
          {/* The video: the recording, from start to end. */}
          <div className="flex h-9 border-b border-gray-alpha-200">
            <div className="sticky left-0 z-20 flex shrink-0 items-center gap-1.5 bg-editor-panel px-2 text-[11px] text-gray-1000" style={{ width: LABEL }}>
              <Video className="size-3.5 shrink-0 text-gray-900" />
              Video
            </div>
            <div className="relative cursor-text touch-none" style={{ width: full }} {...video}>
              <div className="absolute inset-y-1 left-0 right-0 flex overflow-hidden rounded bg-[repeating-linear-gradient(90deg,var(--ds-gray-alpha-300)_0_2px,var(--ds-gray-alpha-200)_2px_6px)]">
                {/* The clip's frames along it (the pattern shows until they're in), its name over them. */}
                {frames.map((f, i) => (
                  <img key={i} src={f} alt="" draggable={false} className="pointer-events-none h-full min-w-0 flex-1 select-none object-cover" />
                ))}
                {clip && <span className="pointer-events-none absolute left-1 top-0.5 max-w-[90%] truncate rounded bg-black/55 px-1 text-[10px] leading-4 text-white">{clip.name}</span>}
              </div>
            </div>
          </div>
          {tracks.map((track) => (
            <div key={track.name} className="flex h-7 border-b border-gray-alpha-200 last:border-b-0">
              <div className="sticky left-0 z-20 flex shrink-0 items-center gap-1.5 bg-editor-panel px-2 text-[11px] text-gray-1000" style={{ width: LABEL }}>
                <TrackIcon name={track.name} />
                {track.name}
              </div>
              <div className="relative cursor-pointer touch-none" style={{ width: full }} {...scrub}>
                {track.items}
              </div>
            </div>
          ))}
          {/* What's cut, hatched across every track; shot changes and the playhead. */}
          {edit.trims.map((t) => (
            <span
              key={`trim-${t.start}`}
              className="pointer-events-none absolute bottom-0 top-6 z-[5] bg-[repeating-linear-gradient(135deg,rgb(229_72_77/0.16)_0_4px,transparent_4px_8px)]"
              style={{ left: LABEL + x(t.start), width: Math.max(2, x(t.end) - x(t.start)) }}
              aria-hidden
            />
          ))}
          {edit.cuts.map((c) => (
            <span key={c} className="pointer-events-none absolute bottom-0 top-6 z-10 border-l border-dashed border-amber-700" style={{ left: LABEL + x(c) }} title={`Cut at ${c.toFixed(1)} s`} />
          ))}
          {/* The stretch selected on the video, and what to do with it. */}
          {range && (
            <>
              <span className="pointer-events-none absolute bottom-0 top-6 z-[6] border-x-2 border-blue-700 bg-blue-700/15" style={{ left: LABEL + x(range[0]), width: Math.max(2, x(range[1]) - x(range[0])) }} aria-hidden />
              <div className="absolute top-7 z-30 flex items-center gap-1 rounded-md border border-gray-alpha-400 bg-background-100 p-0.5 shadow-lg" style={{ left: LABEL + x((range[0] + range[1]) / 2), transform: "translateX(-50%)" }}>
                <button type="button" onClick={onCutRange} className="flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium text-gray-1000 hover:bg-gray-alpha-200">
                  <Scissors className="size-3" /> Cut out {(range[1] - range[0]).toFixed(1)} s
                </button>
                <button type="button" onClick={() => onRange?.(null)} aria-label="Clear the selection" className="flex size-6 items-center justify-center rounded text-gray-900 hover:bg-gray-alpha-200">
                  <X className="size-3" />
                </button>
              </div>
            </>
          )}
          <span className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 bg-brand" style={{ left: LABEL + x(time) - 1 }} aria-hidden />
          <span className="pointer-events-none absolute top-0 z-10 h-2.5 w-2.5 rounded-b-[3px] bg-brand" style={{ left: LABEL + x(time) - 5 }} aria-hidden />
        </div>
      </div>
    </div>
  );
}

// How many frames the Video track's filmstrip has, spread along the clip.
const FILMSTRIP_FRAMES = 14;

/**
 * Frames of a video along its length, small, made in the browser from a hidden copy of it (seek, draw, next), for the
 * Video track's filmstrip. They come in one by one; none when the video can't be read.
 */
function useFilmstrip(src: string | undefined, count: number) {
  const [frames, setFrames] = useState<string[]>([]);
  useEffect(() => {
    if (!src) return;
    let stopped = false;
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    video.src = src;
    const made: string[] = [];
    const run = async () => {
      await new Promise((ok, fail) => {
        video.addEventListener("loadedmetadata", ok, { once: true });
        video.addEventListener("error", fail, { once: true });
      });
      const canvas = document.createElement("canvas");
      canvas.height = 64;
      canvas.width = Math.max(1, Math.round((64 * video.videoWidth) / Math.max(1, video.videoHeight)));
      const ctx = canvas.getContext("2d");
      for (let i = 0; i < count && !stopped && ctx; i++) {
        video.currentTime = Math.min(Math.max(0, video.duration - 0.05), ((i + 0.5) * video.duration) / count);
        await new Promise((ok) => video.addEventListener("seeked", ok, { once: true }));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        made.push(canvas.toDataURL("image/jpeg", 0.6));
        if (!stopped) setFrames([...made]);
      }
    };
    run().catch(() => {});
    return () => {
      stopped = true;
      video.removeAttribute("src");
      video.load();
    };
  }, [src, count]);
  return frames;
}

/** A track's icon, by its name. */
function TrackIcon({ name }: { name: string }) {
  const Icon = TRACK_ICON[name];
  return Icon ? <Icon className="size-3.5 shrink-0 text-gray-900" /> : null;
}
