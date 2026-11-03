"use client";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { CAPTION_FONTS, CAPTION_OFFSET, CAPTION_STROKES, LOCKUP_KEY, resolveLook, type CaptionAnimation, type CaptionFont, type CaptionLook, type CaptionPosition, type ReelLookChanges, type ReelStyle } from "@launchreel/core/captions";
import type { ReelFont } from "@launchreel/core/reel";
import { cn } from "@/lib/cn";
import { CAPTION_FONT_CLASS, CAPTION_FONT_LABEL } from "./caption-fonts";
import { StyleFrame, useTick } from "./style-picker";

const TEXT_COLORS = ["#FFFFFF", "#FFF4D6", "#FFE135", "#C6FF3D", "#5CE1E6", "#FF4FD8"];
const HIGHLIGHTS = ["#FFD60A", "#3BF26B", "#C6FF3D", "#FF8A00", "#FF4FD8", "#4C9BFF", "#F2462E"];
const SIZES: [string, number][] = [
  ["S", 0.85],
  ["M", 1],
  ["L", 1.2],
  ["XL", 1.4],
];
const WORDS = [1, 2, 3, 4, 6];
// The spoken word's, then words appearing as they're said, then the line's.
const ANIMATIONS: [string, CaptionAnimation, string][] = [
  ["Pop", "pop", "The spoken word swells and settles"],
  ["Bounce", "bounce", "The spoken word springs up and back"],
  ["Stomp", "stomp", "The spoken word slams down from big"],
  ["Rise", "rise", "The spoken word grows up from its line"],
  ["Jelly", "jelly", "The spoken word squashes and wobbles"],
  ["Stretch", "stretch", "The spoken word stretches tall, then settles"],
  ["Heartbeat", "heartbeat", "The spoken word beats twice"],
  ["Flash", "flash", "The spoken word flashes white"],
  ["Wave", "wave", "The spoken word's letters pop in a ripple"],
  ["Typewriter", "typewriter", "Words type in, letter by letter, as they're said"],
  ["Reveal", "reveal", "Words appear as they're said"],
  ["Blur in", "blurin", "Words sharpen out of a blur as they're said"],
  ["Drop", "drop", "Words drop in from big as they're said"],
  ["Flicker", "flicker", "Words flicker on like neon"],
  ["Fade", "fade", "Each line fades in"],
  ["Slide up", "slideup", "Each line slides up into place"],
  ["Slide down", "slidedown", "Each line drops into place"],
  ["None", "none", "No animation"],
];
const BACKS: [string, NonNullable<ReelLookChanges["back"]>][] = [
  ["None", "none"],
  ["Spoken word", "word"],
  ["Whole line", "line"],
];
const STROKES: [string, NonNullable<ReelLookChanges["stroke"]>][] = [
  ["None", "none"],
  ["Thin", "thin"],
  ["Thick", "thick"],
];
const SHADOWS: [string, NonNullable<ReelLookChanges["shadow"]>][] = [
  ["None", "none"],
  ["Soft", "soft"],
  ["Hard", "hard"],
];
const STROKE_COLORS = ["#000000", "#FFFFFF", "#FFD60A", "#FF4FD8"];
const KEY_COLORS = ["#FFFFFF", ...HIGHLIGHTS];
const BOX_COLORS = ["#000000", "#111318", "#FFFFFF", "#FFD60A", "#2F6BFF", "#F2462E"];
const LAYOUTS: [string, CaptionLook["layout"]][] = [
  ["Line", "line"],
  ["Lockup", "lockup"],
];
const SPACINGS: [string, NonNullable<ReelLookChanges["spacing"]>][] = [
  ["Tight", "tight"],
  ["Normal", "normal"],
  ["Wide", "wide"],
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] text-gray-900">{label}</p>
      {children}
    </div>
  );
}

/** A row of options as a radio group, like the language switch. */
function Segmented<T extends string | number>({ label, options, value, onChange }: { label: string; options: [string, T][]; value: T; onChange: (value: T) => void }) {
  return (
    <div className="flex h-9 w-full items-center gap-0.5 rounded-md border border-gray-alpha-400 bg-background-100 p-0.5" role="radiogroup" aria-label={label}>
      {options.map(([name, option]) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn("h-full flex-1 rounded px-1.5 text-[13px] transition-colors", value === option ? "bg-gray-alpha-200 font-medium text-gray-1000" : "text-gray-900 hover:text-gray-1000")}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/** Colour swatches, then any colour from the system picker. */
function Swatches({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (hex: string) => void }) {
  const custom = !options.includes(value.toUpperCase());
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
      {options.map((hex) => (
        <button
          key={hex}
          type="button"
          role="radio"
          aria-checked={value.toUpperCase() === hex}
          aria-label={hex}
          onClick={() => onChange(hex)}
          className={cn("size-6 rounded-full border border-gray-alpha-500", value.toUpperCase() === hex && "ring-2 ring-gray-1000 ring-offset-2 ring-offset-background-100")}
          style={{ background: hex }}
        />
      ))}
      <label className={cn("relative size-6 cursor-pointer overflow-hidden rounded-full border border-dashed border-gray-alpha-600", custom && "ring-2 ring-gray-1000 ring-offset-2 ring-offset-background-100")} title="Any colour" style={custom ? { background: value } : undefined}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label={`${label}: any colour`} />
        {!custom && <span className="flex size-full items-center justify-center text-[13px] leading-none text-gray-900">+</span>}
      </label>
    </div>
  );
}

/** The caption fonts, each in its own face, as a radio group; `same` names a first option for none of its own. */
function FontChoice({ label, value, onChange, same }: { label: string; value: CaptionFont | null; onChange: (font: CaptionFont | null) => void; same?: string }) {
  const button = (on: boolean) => (on ? "border-gray-1000 bg-gray-alpha-200 text-gray-1000" : "border-gray-alpha-400 text-gray-1000 hover:border-gray-alpha-500");
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {same && (
        <button type="button" role="radio" aria-checked={value === null} onClick={() => onChange(null)} className={cn("h-8 rounded-md border px-2.5 text-[13px] leading-none transition-colors", button(value === null))}>
          {same}
        </button>
      )}
      {CAPTION_FONTS.map((font) => (
        <button
          key={font}
          type="button"
          role="radio"
          aria-checked={value === font}
          onClick={() => onChange(font)}
          className={cn("h-8 rounded-md border px-2.5 text-[15px] leading-none transition-colors", button(value === font), font === "inter" ? "font-bold" : CAPTION_FONT_CLASS[font])}
        >
          {CAPTION_FONT_LABEL[font]}
        </button>
      ))}
    </div>
  );
}

/** An on/off choice. */
function Tick({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-1000">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--ds-gray-1000)]" />
      {children}
    </label>
  );
}

/**
 * Customizing a caption style: a live preview of the reel's captions on the sample frame, then font, colours, size,
 * position, words on screen, the layout (a line, or a lockup with key words big on rows of their own) and where it
 * lines up, animation, a box behind the words and its colour, stroke, shadow, letter spacing, key words' own font,
 * capitals, colour and glow, bigger key words, all capitals, and words shown faintly before they're said. Everything left
 * alone stays the style's own.
 */
export function LookEditor({ style, changes, onChange, fonts, showPreview = true }: { style: ReelStyle; changes: ReelLookChanges; onChange: (update: (changes: ReelLookChanges) => ReelLookChanges) => void; fonts: ReelFont[]; showPreview?: boolean }) {
  const tick = useTick();
  const look = resolveLook(style, changes);
  // Each change merges into the latest changes (two quick clicks both count); one set back to the style's own value is
  // dropped, so "Reset" only shows when something differs.
  const set = (patch: ReelLookChanges) => onChange((current) => Object.fromEntries(Object.entries({ ...current, ...patch }).filter(([, v]) => v !== undefined)) as ReelLookChanges);
  const highlight = look.background === "band" ? look.backgroundColor : look.accent;
  // What the style does now, for the controls that start from it: what's behind the words, the stroke and the shadow.
  const strokes = CAPTION_STROKES[style];
  const back = look.background === "band" ? "word" : look.background === "box" ? "line" : "none";
  const strokeNow = changes.stroke ?? (look.stroke === "none" || strokes.outline === 0 ? "none" : look.stroke === "soft" || strokes.outline <= 0.08 ? "thin" : "thick");
  const shadowNow = changes.shadow ?? (look.stroke === "soft" ? "soft" : look.hardShadow || (strokes.shadow > 0 && strokes.back < 0x80) ? "hard" : "none");
  // Captions at the top would meet "Behind you"'s big words.
  const positions: [string, CaptionPosition][] = style === "behind" ? [["Middle", "middle"], ["Bottom", "bottom"]] : [["Top", "top"], ["Middle", "middle"], ["Bottom", "bottom"]];
  // A lockup lines its rows up staggered too (a line's stagger is centred).
  const lockup = look.layout === "lockup";
  const aligns: [string, CaptionLook["align"]][] = [["Centre", "center"], ["Left", "left"], ...(lockup ? [["Stagger", "stagger"] as [string, CaptionLook["align"]]] : [])];
  // The colours the look has without the customer's own, so picking them again drops the change.
  const ownKeyColor = resolveLook(style, { ...changes, keyColor: undefined }).keyword;
  const ownBoxColor = resolveLook(style, { ...changes, backColor: undefined }).backgroundColor;
  const keyCaps = (look.keyCasing ?? look.casing) === "upper";
  return (
    <div className={cn("grid gap-4 rounded-lg border border-gray-alpha-400 p-3 sm:gap-5 sm:p-4", showPreview && "sm:grid-cols-[176px_minmax(0,1fr)]")}>
      {/* The editor has the reel itself as its preview. */}
      {showPreview && (
        <div>
          <StyleFrame style={style} changes={changes} fonts={fonts} tick={tick} className="mx-auto w-[150px] rounded-md sm:w-full" />
          <p className="mt-2 text-center text-xs text-gray-900">Live preview</p>
        </div>
      )}
      <div className="min-w-0 space-y-4">
        <Field label={style === "behind" ? "Caption font" : "Font"}>
          <FontChoice label="Font" value={look.font} onChange={(font) => font && set({ font })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Text colour">
            <Swatches label="Text colour" value={look.color} options={TEXT_COLORS} onChange={(color) => set({ color })} />
          </Field>
          <Field label={look.background === "band" ? "Box colour" : "Highlight colour"}>
            <Swatches label="Highlight colour" value={highlight} options={HIGHLIGHTS} onChange={(accent) => set({ accent })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Size">
            <Segmented label="Size" options={SIZES} value={changes.size ?? 1} onChange={(size) => set({ size: size === 1 ? undefined : size })} />
          </Field>
          <Field label="Position">
            <Segmented label="Position" options={positions} value={look.position === "top" && style === "behind" ? "middle" : look.position} onChange={(position) => set({ position, offset: undefined })} />
          </Field>
        </div>
        <Field label="Fine position">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["Up", -0.02, ChevronUp],
                ["Down", 0.02, ChevronDown],
              ] as const
            ).map(([name, step, Icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => set({ offset: Math.max(-CAPTION_OFFSET, Math.min(CAPTION_OFFSET, Math.round(((changes.offset ?? 0) + step) * 1000) / 1000)) || undefined })}
                className="flex h-8 items-center gap-1 rounded-md border border-gray-alpha-400 px-2.5 text-[13px] text-gray-1000 hover:bg-gray-alpha-100"
              >
                <Icon className="size-3.5" />
                {name}
              </button>
            ))}
            <span className="text-xs text-gray-900">{changes.offset ? `${changes.offset < 0 ? "Up" : "Down"} ${Math.round(Math.abs(changes.offset) * 100)}%` : "Or drag the captions on the video"}</span>
          </div>
        </Field>
        <Field label="Words on screen">
          <Segmented label="Words on screen" options={WORDS.map((n) => [String(n), n] as [string, number])} value={look.words} onChange={(words) => set({ words })} />
        </Field>
        {/* "Behind you" puts its key word behind the speaker: its captions stay a centred line. */}
        {style !== "behind" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Layout">
              <Segmented label="Layout" options={LAYOUTS} value={look.layout} onChange={(layout) => set(layout === "lockup" ? { layout } : { layout: undefined, keySize: undefined, align: changes.align === "stagger" ? undefined : changes.align })} />
            </Field>
            <Field label="Align">
              <Segmented label="Align" options={aligns} value={!lockup && look.align === "stagger" ? "center" : look.align} onChange={(align) => set({ align: align === "center" ? undefined : align })} />
            </Field>
          </div>
        )}
        {style !== "behind" && lockup && (
          <Field label="Key word size">
            <div className="flex h-8 items-center gap-3">
              <input
                type="range"
                min={LOCKUP_KEY.min}
                max={LOCKUP_KEY.max}
                step={0.1}
                value={look.keyScale}
                onChange={(e) => {
                  const keySize = Math.round(Number(e.target.value) * 10) / 10;
                  set({ keySize: keySize === LOCKUP_KEY.scale ? undefined : keySize });
                }}
                className="h-1 min-w-0 flex-1 accent-[var(--ds-gray-1000)]"
                aria-label="Key word size"
              />
              <span className="w-10 text-right text-[13px] tabular-nums text-gray-1000">{look.keyScale.toFixed(1)}×</span>
            </div>
          </Field>
        )}
        <Field label="Animation">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Animation">
            {ANIMATIONS.map(([name, animation, hint]) => (
              <button
                key={animation}
                type="button"
                role="radio"
                aria-checked={look.animation === animation}
                title={hint}
                onClick={() => set({ animation })}
                className={cn("h-8 rounded-md border px-2.5 text-[13px] transition-colors", look.animation === animation ? "border-gray-1000 bg-gray-alpha-200 font-medium text-gray-1000" : "border-gray-alpha-400 text-gray-1000 hover:border-gray-alpha-500")}
              >
                {name}
              </button>
            ))}
          </div>
        </Field>
        {style !== "behind" && (
          <Field label="Box behind">
            <Segmented label="Box behind" options={BACKS} value={back} onChange={(value) => set({ back: value })} />
          </Field>
        )}
        {(look.background === "box" || look.background === "bar") && (
          <Field label="Box colour">
            <Swatches label="Box colour" value={look.backgroundColor} options={BOX_COLORS} onChange={(backColor) => set({ backColor: backColor === ownBoxColor ? undefined : backColor })} />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stroke">
            <Segmented label="Stroke" options={STROKES} value={strokeNow} onChange={(stroke) => set({ stroke })} />
          </Field>
          <Field label="Shadow">
            <Segmented label="Shadow" options={SHADOWS} value={shadowNow} onChange={(shadow) => set({ shadow })} />
          </Field>
        </div>
        {strokeNow !== "none" && (
          <Field label="Stroke colour">
            <Swatches label="Stroke colour" value={look.strokeColor ?? "#000000"} options={STROKE_COLORS} onChange={(strokeColor) => set({ strokeColor: strokeColor === "#000000" ? undefined : strokeColor })} />
          </Field>
        )}
        <Field label="Letter spacing">
          <Segmented label="Letter spacing" options={SPACINGS} value={changes.spacing ?? "normal"} onChange={(spacing) => set({ spacing: spacing === "normal" ? undefined : spacing })} />
        </Field>
        {/* The highlighted words (in a lockup, each line's big word). */}
        {style !== "behind" && (
          <div className="space-y-4 border-t border-gray-alpha-400 pt-4">
            <p className="text-sm font-medium text-gray-1000">Key words</p>
            <Field label="Font">
              <FontChoice label="Key word font" value={look.keyFont ?? null} same="Same as text" onChange={(keyFont) => set({ keyFont: keyFont === null || keyFont === look.font ? undefined : keyFont })} />
            </Field>
            <Field label="Colour">
              <Swatches label="Key word colour" value={look.keyword} options={KEY_COLORS} onChange={(keyColor) => set({ keyColor: keyColor === ownKeyColor ? undefined : keyColor })} />
            </Field>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Tick checked={keyCaps} onChange={(on) => set({ keyCaps: on === (look.casing === "upper") ? undefined : on })}>
                Capitals
              </Tick>
              <Tick checked={look.keyGlow} onChange={(on) => set({ keyGlow: on || undefined })}>
                Glow
              </Tick>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Tick checked={look.casing === "upper"} onChange={(caps) => set({ caps })}>
              All capitals
            </Tick>
            {/* A lockup's key words are big already (Key word size). */}
            {!lockup && (
              <Tick checked={look.keyScale > 1} onChange={(on) => set({ bigKeys: on || undefined })}>
                Bigger key words
              </Tick>
            )}
            <Tick checked={look.ghost} onChange={(on) => set({ ghost: on || undefined })}>
              Show words before they&apos;re said
            </Tick>
          </div>
          {Object.keys(changes).length > 0 && (
            <button type="button" onClick={() => onChange(() => ({}))} className="flex items-center gap-1.5 text-[13px] text-gray-900 hover:text-gray-1000">
              <RotateCcw className="size-3.5" />
              Reset to the style&apos;s look
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
