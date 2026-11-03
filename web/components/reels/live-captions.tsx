"use client";
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { CAPTION_OFFSET, captionPlace, captionY, lineAtTime, type CaptionLine as Line, type CaptionLook, type ReelStyle } from "@launchreel/core/captions";
import { bigWords, bigWordText, EMOJI_SIZE, type ReelEdit, type ReelFont } from "@launchreel/core/reel";
import { emojiShows, HOOK_END, HOOK_START } from "@launchreel/core/timeline";
import { cn } from "@/lib/cn";
import { CaptionLine, FRAME_9_16, sizeUnit, type Aspect } from "./caption-preview";
import { bigWordLook } from "./font-picker";

/** The parts of the reel's options the preview draws (captions false: none drawn, as a product video can turn them off). */
export type PreviewOptions = { style: ReelStyle; fonts: ReelFont[]; emojis: boolean; zooms: boolean; hook: boolean; captions?: boolean };

/** The line on screen at `time`, if any, and its index. */
export function lineAt(lines: Line[], time: number) {
  const index = lineAtTime(lines, time);
  return index < 0 ? null : { index, line: lines[index] };
}

/**
 * The editor's captions over the clean preview at `time`, as the render draws them: the hook for its first seconds,
 * the line being said with its spoken word and highlights, the emoji showing, and for "Behind you" the line's big word
 * (in front here: the editor has no cut-out). Words are clickable when `onWord` is given, and the captions can be
 * dragged up or down when `onMove` is (it gets the new offset, and `done` when the drag ends).
 */
export function LiveCaptions({
  look,
  options,
  edit,
  lines,
  time,
  onWord,
  onHook,
  onMove,
  selected = null,
  aspect = FRAME_9_16,
}: {
  look: CaptionLook;
  options: PreviewOptions;
  edit: ReelEdit;
  lines: Line[];
  time: number;
  onWord?: (word: number) => void;
  onHook?: () => void;
  onMove?: (offset: number, done: boolean) => void;
  selected?: number | null;
  /** The frame's shape (sizes and places follow it, as in the render). */
  aspect?: Aspect;
}) {
  const unit = sizeUnit(aspect);
  // An ASS size (a share of sqrt(width × height)) as a share of the height: 0.75 on 9:16.
  const ofHeight = Math.sqrt(aspect.width / aspect.height);
  const behind = options.style === "behind";
  const hookOn = options.hook && Boolean(edit.hook) && time >= HOOK_START && time < HOOK_END;
  const current = lineAt(lines, time);
  const keywords = new Set(edit.keywords);
  // How tall the caption is, in lines at the look's size (CaptionLine measures it: 1 or 2 lines, or a lockup's
  // height), for the emoji beside it.
  const [rows, setRows] = useState(1);

  // Dragging the captions: past a few pixels it's a drag (the click on a word is dropped), else a click.
  const frame = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ y: number; offset: number; moved: boolean } | null>(null);
  const dropClick = useRef(false);
  const offsetAt = (e: ReactPointerEvent) => {
    const height = frame.current?.clientHeight ?? 1;
    const d = drag.current!;
    return Math.max(-CAPTION_OFFSET, Math.min(CAPTION_OFFSET, Math.round((d.offset + (e.clientY - d.y) / height) * 1000) / 1000));
  };
  const dragging = onMove
    ? {
        onPointerDown: (e: ReactPointerEvent) => {
          if (e.button !== 0) return;
          drag.current = { y: e.clientY, offset: look.offset, moved: false };
        },
        onPointerMove: (e: ReactPointerEvent) => {
          const d = drag.current;
          if (!d) return;
          if (!d.moved && Math.abs(e.clientY - d.y) < 5) return;
          if (!d.moved)
            try {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {}
          d.moved = true;
          onMove(offsetAt(e), false);
        },
        onPointerUp: (e: ReactPointerEvent) => {
          const d = drag.current;
          drag.current = null;
          if (!d?.moved) return;
          dropClick.current = true;
          onMove(offsetAt(e), true);
        },
        onClickCapture: (e: React.MouseEvent) => {
          if (!dropClick.current) return;
          dropClick.current = false;
          e.stopPropagation();
          e.preventDefault();
        },
      }
    : {};

  let caption = null;
  let big: { text: string; font: ReelFont; turn: number; word: number } | null = null;
  if (current && !(behind && hookOn) && options.captions !== false) {
    const { index, line } = current;
    const texts = line.words.map((w) => w.text);
    const spoken = line.words.reduce((last, w, k) => (w.start <= time ? k : last), -1);
    const local = selected === null ? null : line.words.findIndex((w) => w.i === selected);
    if (behind) {
      // The line's big word as the render picks and times it (bigWords: its first highlight, else its strongest), in
      // the font and colour of its turn; the rest stays small. A line the render gives no big word stays whole.
      const shot = bigWords(lines, keywords, options.hook && edit.hook ? HOOK_END : null).find((s) => s.line === index);
      const hero = shot ? shot.word : null;
      if (shot && time >= shot.start && time < shot.end) big = { text: texts[shot.word], font: options.fonts[shot.turn % options.fonts.length], turn: shot.turn, word: line.words[shot.word].i };
      const rest = texts.map((_, k) => k).filter((k) => k !== hero);
      if (rest.length)
        caption = (
          <CaptionLine
            look={look}
            style={options.style}
            words={rest.map((k) => texts[k])}
            active={rest.findLastIndex((k) => k <= spoken)}
            keywords={new Set()}
            lineKey={`${index}`}
            tick={`${index}-${spoken}`}
            onWord={onWord && ((k) => onWord(line.words[rest[k]].i))}
            selected={local === null || local < 0 ? null : rest.indexOf(local)}
            onRows={setRows}
            aspect={aspect}
          />
        );
    } else {
      caption = (
        <CaptionLine
          look={look}
          style={options.style}
          words={texts}
          active={spoken}
          keywords={new Set(line.words.flatMap((w, k) => (keywords.has(w.i) ? [k] : [])))}
          lineKey={`${index}`}
          tick={`${index}-${spoken}`}
          onWord={onWord && ((k) => onWord(line.words[k].i))}
          selected={local === null || local < 0 ? null : local}
          onRows={setRows}
          aspect={aspect}
        />
      );
    }
  }

  // The emoji showing, sized and placed as the render does: above the caption (or below it), 8.6% of the height tall
  // at medium on 9:16. Heights are shares of the frame's height; a caption line is look.size × 0.75 of it on 9:16.
  const show = options.emojis && !behind ? emojiShows(edit, lines).find((s) => time >= s.start && time < s.end) : undefined;
  let emoji: { char: string; style: CSSProperties; word: number } | null = null;
  if (show) {
    const size = EMOJI_SIZE[edit.emojiStyle.size] * ofHeight;
    const y = captionY(aspect.width, aspect.height, look);
    const block = look.size * ofHeight * (show.line === current?.index && caption ? rows : 1);
    const anchorTop = look.position !== "bottom";
    const below = edit.emojiStyle.place === "below" || (edit.emojiStyle.place === "auto" && look.position === "top");
    const top = below ? (anchorTop ? y + block + 0.015 : y + 0.015) : anchorTop ? y - 0.012 - size : y - block - 0.01 - size;
    emoji = { char: show.emoji, word: show.word, style: { top: `${(Math.min(1 - size, Math.max(0, top)) * 100).toFixed(2)}%`, height: `${(size * 100).toFixed(2)}%`, fontSize: `${(EMOJI_SIZE[edit.emojiStyle.size] * unit * 0.86).toFixed(2)}cqw` } };
  }

  const hookTop = look.position === "top" ? captionPlace(aspect.width, aspect.height, "middle") * 0.9 : 0.15;
  // "Behind you"'s hook is turn 0 (the first font and colour); each big word its own turn.
  const hookBig = hookOn && behind ? bigWordLook(options.fonts[0], 0, look) : null;
  const bigSample = big ? bigWordLook(big.font, big.turn, look) : null;
  // Clickable text on the video: a button for screen readers and keyboards, outlined on hover.
  const editable = (onClick: (() => void) | undefined, label: string) =>
    onClick
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-label": label,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onClick();
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          },
        }
      : {};
  const hoverable = "pointer-events-auto cursor-text hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

  return (
    <span ref={frame} className="pointer-events-none absolute inset-0 [container-type:inline-size]" aria-hidden={onWord ? undefined : true}>
      {hookOn && !behind && (
        <span className="absolute inset-x-0 flex justify-center" style={{ top: `${hookTop * 100}%` }}>
          <span {...editable(onHook, "Edit the hook title")} className={cn("max-w-[80%] rotate-[-1.5deg] rounded-[0.2em] bg-[#FFD60A] px-[0.22em] py-[0.08em] text-center font-black uppercase leading-[1.1] text-[#0A0A0A]", onHook && hoverable)} style={{ fontSize: `${((6.2 * unit) / 133.33).toFixed(2)}cqw` }}>
            {edit.hook}
          </span>
        </span>
      )}
      {hookBig && (
        <span {...editable(onHook, "Edit the hook title")} className={cn("absolute inset-x-[6%] top-[19%] text-center leading-[0.95]", hookBig.className, onHook && hoverable)} style={{ ...hookBig.style, fontSize: "11cqw", textShadow: "0 0.6cqw 2.5cqw rgb(0 0 0 / 0.45)" }}>
          {edit.hook
            .split(" ")
            .map((w) => bigWordText(w, hookBig.casing))
            .filter(Boolean)
            .join(" ")}
        </span>
      )}
      {big && bigSample && (
        <span
          key={big.text}
          {...editable(onWord && (() => onWord(big!.word)), `Edit “${big.text}”`)}
          className={cn("absolute inset-x-[4%] top-[21%] truncate text-center leading-none", bigSample.className, onWord && hoverable, selected === big.word && "outline outline-2 outline-offset-2 outline-white")}
          style={{ ...bigSample.style, fontSize: `${Math.min(19, 150 / Math.max(4, big.text.length))}cqw`, textShadow: "0 0.6cqw 2.5cqw rgb(0 0 0 / 0.45)", animation: "reel-fade 0.1s ease-out" }}
        >
          {bigWordText(big.text, bigSample.casing)}
        </span>
      )}
      {caption && (
        <span className={cn("absolute inset-0", onMove && "[&_[role=button]]:cursor-grab")} {...dragging} style={{ touchAction: onMove ? "none" : undefined }}>
          {caption}
        </span>
      )}
      {emoji && (
        <span
          key={`${emoji.word}-${emoji.char}`}
          {...editable(onWord && (() => onWord(emoji!.word)), `Change the emoji ${emoji.char}`)}
          className={cn("absolute inset-x-0 mx-auto flex w-fit items-center justify-center leading-none", onWord && hoverable)}
          style={{ ...emoji.style, animation: "reel-pop 0.2s ease-out" }}
        >
          {emoji.char}
        </span>
      )}
    </span>
  );
}
