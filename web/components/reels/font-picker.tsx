"use client";
import { Check } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { resolveLook, type CaptionLook, type ReelLookChanges } from "@launchreel/core/captions";
import { bigColorOf, bigWordText, REEL_FONTS, REEL_MAX_FONTS, type BigCasing, type ReelFont } from "@launchreel/core/reel";
import { cn } from "@/lib/cn";
import { abril, anton, archivo, archivoWide, bebas, dmSerif, fredoka, greatVibes, instrument, kaushan, lilita, luckiest, marker, playfair, poppins, pressStart, rubik } from "./caption-fonts";
import { REEL_FONT_INFO } from "./labels";

/** The letters' paint: filled in the colour, or (an outline style) only their outline in it, about as thick as the render's. */
const paint = (color: string, hollow?: boolean): CSSProperties => (hollow ? { color: "transparent", WebkitTextStroke: `max(1.5px, 0.035em) ${color}` } : { color });

/** The previews' sample big word, as said (each style, or the customer, cases it). */
export const BIG_SAMPLE_WORD = "money";

type BigSample = { word: string; casing: BigCasing; color: string; hollow?: boolean; className: string; style: CSSProperties };
const sample = (casing: BigCasing, color: string, className: string, extra: CSSProperties = {}, hollow?: boolean): BigSample => ({
  word: bigWordText(BIG_SAMPLE_WORD, casing),
  casing,
  color,
  hollow,
  className,
  style: { ...extra, ...paint(color, hollow) },
});

// Each style's sample word as the render writes it (BIG_LOOKS in runner/src/reel.ts): face, casing, colour and spacing.
export const BIG_SAMPLES: Record<ReelFont, BigSample> = {
  classic: sample("upper", "#FFFFFF", "font-black tracking-tight"),
  impact: sample("upper", "#FFE135", anton.className),
  editorial: sample("title", "#F2462E", abril.className),
  elegant: sample("lower", "#FFFFFF", dmSerif.className),
  script: sample("title", "#4C9BFF", kaushan.className),
  marker: sample("upper", "#FFFFFF", marker.className),
  outline: sample("upper", "#FFFFFF", "font-black tracking-tight", {}, true),
  pop: sample("upper", "#C6FF3D", archivo.className, { letterSpacing: "-0.02em" }),
  chunky: sample("upper", "#FF8A1E", luckiest.className),
  slim: sample("upper", "#FFD27A", instrument.className, { letterSpacing: "-0.01em" }),
  poster: sample("upper", "#FF5C8A", bebas.className, { letterSpacing: "0.01em" }),
  rounded: sample("lower", "#B39DFF", rubik.className, { letterSpacing: "-0.02em" }),
  geometric: sample("lower", "#38E1C6", poppins.className, { letterSpacing: "-0.02em" }),
  didone: sample("upper", "#E2C285", playfair.className, { letterSpacing: "-0.01em" }),
  bubbly: sample("lower", "#FF8FC7", fredoka.className, { letterSpacing: "-0.01em" }),
  calligraphy: sample("title", "#FFFFFF", greatVibes.className),
  arcade: sample("upper", "#FA6C98", pressStart.className),
  block: sample("upper", "#FFD800", lilita.className),
  wide: sample("upper", "#FFFFFF", archivoWide.className, { letterSpacing: "-0.01em" }),
};

/**
 * A big word's look on its turn, as the render draws it: the font style's face and spacing, the customer's casing
 * (else the style's), and the customer's colours in turn (else the style's own). Turns are bigWords' in
 * @launchreel/core/reel: the hook is turn 0, then each big word in order, so turn n takes fonts[n % fonts.length].
 */
export function bigWordLook(font: ReelFont, turn: number, look?: Pick<CaptionLook, "bigColors" | "bigCasing">): { casing: BigCasing; className: string; style: CSSProperties } {
  const s = BIG_SAMPLES[font];
  return { casing: look?.bigCasing ?? s.casing, className: s.className, style: { ...s.style, ...paint(bigColorOf(look?.bigColors, turn, s.color), s.hollow) } };
}

/**
 * "Behind you"'s font styles for the big words, each previewing its word behind a speaker's head. One by default (a
 * radio group); with "Mix fonts" on, up to REEL_MAX_FONTS that the big words take turns in, numbered in that order.
 * With the customer's look changes, the samples take their big-word casing and colours: each style in the colour of
 * its first turn (its place in the order; one not picked yet, the place it would take).
 */
export function FontPicker({ value, onChange, changes }: { value: ReelFont[]; onChange: (fonts: ReelFont[]) => void; changes?: ReelLookChanges }) {
  const [mixing, setMixing] = useState(value.length > 1);
  const look = resolveLook("behind", changes);
  const pick = (font: ReelFont) => {
    if (!mixing) onChange([font]);
    else if (value.includes(font)) onChange(value.length > 1 ? value.filter((f) => f !== font) : value);
    else if (value.length < REEL_MAX_FONTS) onChange([...value, font]);
  };
  const names = value.map((f) => REEL_FONT_INFO[f].label);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" role={mixing ? "group" : "radiogroup"} aria-label="Font">
        {REEL_FONTS.map((font) => {
          const order = value.indexOf(font);
          const selected = order >= 0;
          const full = mixing && !selected && value.length >= REEL_MAX_FONTS;
          const sample = bigWordLook(font, selected ? order : mixing ? value.length : 0, look);
          return (
            <button
              key={font}
              type="button"
              role={mixing ? "checkbox" : "radio"}
              aria-checked={selected}
              aria-disabled={full || undefined}
              aria-label={`${REEL_FONT_INFO[font].label}: ${REEL_FONT_INFO[font].hint}`}
              onClick={() => pick(font)}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-lg border text-left transition-colors",
                selected ? "border-gray-1000 ring-1 ring-gray-1000" : "border-gray-alpha-400 hover:border-gray-alpha-500",
                full && "cursor-not-allowed opacity-50 hover:border-gray-alpha-400",
              )}
            >
              <span
                className="relative flex h-20 w-full items-center justify-center overflow-hidden sm:h-24"
                style={{
                  background: "radial-gradient(60% 55% at 50% 30%, #6b7aa1 0%, transparent 70%), linear-gradient(160deg, #273150, #10141f)",
                }}
                aria-hidden
              >
                <span
                  className={cn("-mt-3 text-[30px] leading-none sm:text-[34px]", sample.className)}
                  style={{
                    ...sample.style,
                    textShadow: "0 2px 10px rgb(0 0 0 / 0.5)",
                  }}
                >
                  {bigWordText(BIG_SAMPLE_WORD, sample.casing)}
                </span>
                {/* The speaker's head, in front of the word, as the render puts their cut-out back on top. */}
                <span className="absolute left-1/2 top-[52%] aspect-square w-[22%] -translate-x-1/2 rounded-full bg-[#0b1020]" />
              </span>
              <span className="block border-t border-gray-alpha-400 bg-background-100 px-2.5 py-2 sm:px-3">
                <span className="block text-sm font-medium text-gray-1000">{REEL_FONT_INFO[font].label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-900">{REEL_FONT_INFO[font].hint}</span>
              </span>
              {selected && (
                <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold tabular-nums text-black">
                  {mixing && value.length > 1 ? order + 1 : <Check className="size-3" strokeWidth={3} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={mixing}
          onChange={(e) => {
            setMixing(e.target.checked);
            if (!e.target.checked) onChange(value.slice(0, 1));
          }}
          className="mt-0.5 size-4 shrink-0 accent-[var(--ds-gray-1000)]"
        />
        <span className="min-w-0">
          <span className="block font-medium text-gray-1000">Mix fonts in one reel</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-gray-900">
            {!mixing
              ? `Pick up to ${REEL_MAX_FONTS} styles and the big words take turns.`
              : value.length > 1
                ? `The big words take turns: ${names.join(", then ")}. The hook title uses ${names[0]}.`
                : `Pick up to ${REEL_MAX_FONTS - 1} more. The big words take turns in the order you pick them.`}
          </span>
        </span>
      </label>
    </div>
  );
}
