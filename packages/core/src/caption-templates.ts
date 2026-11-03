// Caption templates: ready-made caption looks, each a style plus a set of the customer's changes (and, for "Behind
// you", its big-word fonts). Picking one fills the Style tab, where every setting stays editable; nothing here is
// drawn differently from what a customer could set by hand. The editor's gallery and the Ask AI chat read this list.
import { parseLookChanges, type ReelLookChanges, type ReelStyle } from "./captions";
import type { ReelFont } from "./reel";

export type CaptionTemplateGroup = "simple" | "bold" | "poster" | "glow" | "behind";
export const CAPTION_TEMPLATE_GROUPS: readonly { id: CaptionTemplateGroup; label: string; hint: string }[] = [
  { id: "simple", label: "Simple", hint: "Quiet subtitles that let the video talk" },
  { id: "bold", label: "Bold", hint: "Loud words and coloured boxes" },
  { id: "poster", label: "Poster", hint: "The key word huge, the rest small around it" },
  { id: "glow", label: "Glow", hint: "Words that light up" },
  { id: "behind", label: "Behind you", hint: "Big words behind the speaker" },
];

export type CaptionTemplate = {
  id: string;
  name: string;
  group: CaptionTemplateGroup;
  /** What it looks like, in a few words: the card's tooltip and what the chat reads. */
  hint: string;
  style: ReelStyle;
  look: ReelLookChanges;
  /** "Behind you"'s big-word fonts. */
  fonts?: ReelFont[];
};

// Colours used by more than one template.
const WHITE = "#FFFFFF";

export const CAPTION_TEMPLATES: readonly CaptionTemplate[] = [
  // Simple
  { id: "plain-line", name: "Plain Line", group: "simple", hint: "White subtitles, no fuss", style: "clean", look: { accent: WHITE, words: 4, animation: "none", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "quiet-caps", name: "Quiet Caps", group: "simple", hint: "Small white capitals that stay still", style: "clean", look: { caps: true, accent: WHITE, words: 4, size: 0.8, animation: "none", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "ghost-type", name: "Ghost Type", group: "simple", hint: "The line shows faintly and fills in as it's said", style: "clean", look: { accent: WHITE, words: 4, animation: "none", ghost: true, stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "drift-up", name: "Drift Up", group: "simple", hint: "Each word fades up as it's said", style: "clean", look: { accent: WHITE, words: 4, animation: "reveal", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "amber-word", name: "Amber Word", group: "simple", hint: "The spoken word turns amber", style: "clean", look: { font: "montserrat", accent: "#F4AC2E", words: 4, animation: "none", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "credits", name: "Credits", group: "simple", hint: "Widely spaced capitals, like a film title", style: "clean", look: { font: "montserrat", caps: true, spacing: "wide", accent: WHITE, words: 4, size: 0.8, animation: "fade", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "violet-haze", name: "Violet Haze", group: "simple", hint: "Flat violet capitals, no outline", style: "clean", look: { font: "montserrat", caps: true, spacing: "wide", color: "#8A54DA", accent: "#8A54DA", words: 4, size: 0.8, animation: "none", stroke: "none", shadow: "none", position: "bottom" } },
  { id: "notebook", name: "Notebook", group: "simple", hint: "Neat white handwriting", style: "clean", look: { font: "caveat", accent: WHITE, words: 4, animation: "fade", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "bitmap", name: "Bitmap", group: "simple", hint: "One pixel-font word at a time", style: "single", look: { font: "pixel", accent: WHITE, size: 0.8, animation: "none", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "murmur", name: "Murmur", group: "simple", hint: "Bold sans with key words in a serif italic", style: "clean", look: { keyFont: "instrument", accent: WHITE, words: 5, ghost: true, animation: "blurin", stroke: "none", shadow: "soft", position: "bottom" } },

  // Bold
  { id: "lime-slab", name: "Lime Slab", group: "bold", hint: "Tall lime capitals with a thin outline", style: "hustle", look: { font: "anton", color: "#9CE34F", accent: "#9CE34F", words: 4, animation: "none", stroke: "thin", strokeColor: "#000000", shadow: "soft", position: "bottom" } },
  { id: "gold-drop", name: "Gold Drop", group: "bold", hint: "Yellow comic capitals, heavy black edge", style: "bold", look: { font: "luckiest", color: "#F9D801", accent: "#F9D801", words: 4, size: 0.8, animation: "none", stroke: "thick", strokeColor: "#000000", shadow: "hard", position: "bottom" } },
  { id: "highlighter", name: "Highlighter", group: "bold", hint: "A yellow marker behind the spoken word", style: "highlight", look: { font: "montserrat", accent: "#FFE500", words: 3, stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "mint-pill", name: "Mint Pill", group: "bold", hint: "The spoken word on a green pill", style: "highlight", look: { font: "montserrat", caps: false, accent: "#47A483", words: 4, size: 0.8, stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "ink-steps", name: "Ink Steps", group: "bold", hint: "Each word gets a black box as it's said", style: "highlight", look: { accent: "#000000", words: 4, size: 0.8, ghost: true, animation: "none", stroke: "none", shadow: "soft", position: "bottom" } },

  // Poster
  { id: "cyan-stack", name: "Cyan Stack", group: "poster", hint: "Huge cyan key word, small words either side", style: "clean", look: { layout: "lockup", align: "stagger", keySize: 2.3, keyCaps: true, keyColor: "#05B4D1", accent: WHITE, words: 4, animation: "none", stroke: "none", shadow: "none", position: "bottom" } },
  { id: "modular", name: "Modular", group: "poster", hint: "Capitals stacked, key word in yellow", style: "clean", look: { layout: "lockup", align: "stagger", keySize: 2, caps: true, keyColor: "#EED007", accent: WHITE, words: 5, animation: "fade", stroke: "none", shadow: "soft", position: "middle" } },
  { id: "mirage", name: "Mirage", group: "poster", hint: "A very big soft key word that blurs in", style: "clean", look: { layout: "lockup", align: "stagger", keySize: 2.5, accent: WHITE, words: 4, animation: "blurin", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "couture", name: "Couture", group: "poster", hint: "A giant serif italic word with tiny spaced capitals", style: "clean", look: { layout: "lockup", align: "stagger", keySize: 2.6, font: "montserrat", caps: true, spacing: "wide", keyFont: "instrument", keyCaps: false, color: "#F5F2EE", accent: "#F5F2EE", words: 4, animation: "fade", stroke: "none", shadow: "soft", position: "bottom" } },
  { id: "margin", name: "Margin", group: "poster", hint: "Flush left, key word big in soft blue", style: "clean", look: { layout: "lockup", align: "left", keySize: 2.5, keyColor: "#9AC2FF", accent: WHITE, words: 4, ghost: true, animation: "blurin", stroke: "none", shadow: "soft", position: "bottom" } },

  // Glow
  { id: "afterglow", name: "Afterglow", group: "glow", hint: "A glowing cyan key word over small white words", style: "clean", look: { layout: "lockup", align: "stagger", keySize: 2.3, keyCaps: true, keyColor: "#05B5D2", keyGlow: true, accent: WHITE, words: 4, animation: "blurin", stroke: "none", shadow: "none", position: "bottom" } },
  { id: "soft-halo", name: "Soft Halo", group: "glow", hint: "White words with a faint bloom", style: "neon", look: { caps: false, accent: WHITE, words: 4, size: 0.8, animation: "none", position: "bottom" } },
  { id: "magenta-bloom", name: "Magenta Bloom", group: "glow", hint: "Each word lights up magenta as it's said", style: "neon", look: { font: "montserrat", color: "#F902F9", accent: "#F902F9", words: 4, size: 0.8, ghost: true, animation: "none", position: "bottom" } },
  { id: "ice-glow", name: "Ice Glow", group: "glow", hint: "Key words glow icy blue", style: "clean", look: { layout: "lockup", keySize: 1.6, keyColor: "#BFEFF5", keyGlow: true, accent: WHITE, words: 4, animation: "blurin", stroke: "none", shadow: "none", position: "middle" } },
  { id: "ember-serif", name: "Ember Serif", group: "glow", hint: "A fat serif with warm glowing key words", style: "clean", look: { font: "abril", layout: "lockup", keySize: 1.6, color: "#F4EEE6", accent: "#F4EEE6", keyColor: "#F4AA92", keyGlow: true, words: 4, animation: "blurin", stroke: "none", shadow: "none", position: "middle" } },
  { id: "lilac-glow", name: "Lilac Glow", group: "glow", hint: "Round letters, key words glow lavender", style: "clean", look: { font: "poppins", layout: "lockup", keySize: 1.6, keyColor: "#C4ACF2", keyGlow: true, accent: WHITE, words: 4, animation: "blurin", stroke: "none", shadow: "none", position: "middle" } },

  // Behind you
  { id: "lime-punch", name: "Lime Punch", group: "behind", hint: "Acid lime capitals behind you", style: "behind", look: { accent: "#A6EA14", position: "bottom", bigColors: ["#A6EA14"] }, fonts: ["pop"] },
  { id: "headliner", name: "Headliner", group: "behind", hint: "Heavy white lowercase behind you", style: "behind", look: { position: "bottom", bigCase: "as-said" }, fonts: ["classic"] },
  { id: "marquee", name: "Marquee", group: "behind", hint: "Lemon poster capitals, small serif captions", style: "behind", look: { font: "instrumentupright", color: "#FFE800", accent: "#FFE800", size: 0.8, position: "bottom", bigColors: ["#FFE800"] }, fonts: ["impact"] },
  { id: "billboard", name: "Billboard", group: "behind", hint: "Poster capitals in orange, yellow and white", style: "behind", look: { caps: true, size: 0.8, words: 4, animation: "reveal", position: "bottom", bigColors: ["#FF5828", "#FFD33B", "#F7F6F1"] }, fonts: ["impact"] },
  { id: "headline", name: "Headline", group: "behind", hint: "Big white and red capitals in turn", style: "behind", look: { caps: true, size: 0.8, words: 4, animation: "reveal", position: "bottom", bigColors: ["#FFFFFF", "#FF3929"] }, fonts: ["wide"] },
  { id: "stack-up", name: "Stack Up", group: "behind", hint: "Golden capitals behind you, tiny captions", style: "behind", look: { size: 0.8, position: "bottom", bigColors: ["#FFD800"] }, fonts: ["block"] },
  { id: "scarlet", name: "Scarlet", group: "behind", hint: "A tall red serif behind you", style: "behind", look: { font: "instrumentupright", accent: "#F0180C", position: "bottom", bigColors: ["#F0180C"], bigCase: "lower" }, fonts: ["slim"] },
  { id: "runway", name: "Runway", group: "behind", hint: "Ivory italic capitals, spaced small captions", style: "behind", look: { font: "montserrat", caps: true, spacing: "wide", size: 0.8, words: 4, animation: "blurin", bigColors: ["#FCEEE3"], bigCase: "upper" }, fonts: ["slim"] },
  { id: "tangerine", name: "Tangerine", group: "behind", hint: "Chunky orange cartoon capitals", style: "behind", look: { font: "montserrat", accent: "#FF6A1E", position: "bottom", bigColors: ["#FF6A1E"] }, fonts: ["chunky"] },
  { id: "sunny", name: "Sunny", group: "behind", hint: "Warm yellow rounded capitals", style: "behind", look: { font: "rubik", accent: "#FDD43C", position: "bottom", bigColors: ["#FDD43C"], bigCase: "upper" }, fonts: ["rounded"] },
  { id: "brushstroke", name: "Brushstroke", group: "behind", hint: "Royal blue brush script behind you", style: "behind", look: { font: "montserrat", accent: "#1E40C6", position: "bottom", bigColors: ["#1E40C6"], bigCase: "as-said" }, fonts: ["script"] },
  { id: "royal-script", name: "Royal Script", group: "behind", hint: "Fine royal blue calligraphy behind you", style: "behind", look: { font: "montserrat", accent: "#2448D8", position: "bottom", bigColors: ["#2448D8"], bigCase: "lower" }, fonts: ["calligraphy"] },
  { id: "rose-script", name: "Rose Script", group: "behind", hint: "Pastel pink script and a light serif", style: "behind", look: { font: "instrumentupright", size: 0.8, bigColors: ["#F0AFC4"], bigCase: "as-said" }, fonts: ["script"] },
  { id: "gold-leaf", name: "Gold Leaf", group: "behind", hint: "Gold serif capitals, a luxury feel", style: "behind", look: { font: "instrumentupright", bigColors: ["#D9AE62", "#FFFFFF"] }, fonts: ["didone", "elegant"] },
  { id: "gilded", name: "Gilded", group: "behind", hint: "Soft gold serif behind you", style: "behind", look: { font: "instrumentupright", color: "#F3EBDD", accent: "#F3EBDD", size: 0.8, words: 4, animation: "fade", bigColors: ["#E2C285", "#F5EFE4"], bigCase: "lower" }, fonts: ["didone"] },
  { id: "butter", name: "Butter", group: "behind", hint: "Butter yellow didone, captions to match", style: "behind", look: { font: "playfair", color: "#FFEC8E", accent: "#FFEC8E", size: 1.3, words: 2, position: "bottom", bigColors: ["#FFEC8E"] }, fonts: ["didone"] },
  { id: "arcade", name: "Arcade", group: "behind", hint: "Pink 8-bit pixels, typewriter captions", style: "behind", look: { font: "courier", accent: "#FA6C98", position: "bottom", bigColors: ["#FA6C98"] }, fonts: ["arcade"] },
  { id: "gumdrop", name: "Gumdrop", group: "behind", hint: "Bubbly olive lowercase behind you", style: "behind", look: { font: "montserrat", accent: "#9DB04A", position: "bottom", bigColors: ["#9DB04A"], bigCase: "lower" }, fonts: ["bubbly"] },
  { id: "scarlet-stack", name: "Scarlet Stack", group: "behind", hint: "Deep red poster capitals and a white marker", style: "behind", look: { size: 0.8, bigColors: ["#B8100A", "#FFFFFF"] }, fonts: ["impact", "marker"] },
  { id: "sour-candy", name: "Sour Candy", group: "behind", hint: "Lime and pink candy capitals, script captions", style: "behind", look: { font: "kaushan", size: 0.8, bigColors: ["#A7D930", "#F94E9C"] }, fonts: ["pop", "marker"] },
  { id: "spectrum", name: "Spectrum", group: "behind", hint: "A new bold colour for every big word", style: "behind", look: { font: "poppins", caps: false, words: 4, animation: "blurin", bigColors: ["#8E41C3", "#2E8FC8", "#3FC43F", "#E8B200"], bigCase: "lower" }, fonts: ["geometric"] },
  { id: "pastel-line", name: "Pastel Line", group: "behind", hint: "Pastel outline letters, typed on", style: "behind", look: { size: 0.8, words: 4, animation: "typewriter", bigColors: ["#AFF0FF", "#B9A9FF", "#BAF8E0", "#FAD2F5"], bigCase: "lower" }, fonts: ["outline"] },
  { id: "sketchbook", name: "Sketchbook", group: "behind", hint: "Pastel handwriting, written on", style: "behind", look: { font: "caveat", size: 0.9, words: 4, animation: "typewriter", stroke: "none", shadow: "soft", bigColors: ["#FEFDFD", "#FFD4A1", "#CEE7C2", "#FFC4DD"], bigCase: "lower" }, fonts: ["script"] },
  { id: "cartoon", name: "Cartoon", group: "behind", hint: "Candy-coloured comic capitals", style: "behind", look: { font: "bangers", caps: true, size: 0.9, words: 4, animation: "bounce", stroke: "thin", strokeColor: "#111111", bigColors: ["#FED504", "#FF4A6F", "#49C8F2", "#7CF199"] }, fonts: ["chunky"] },
  { id: "mixtape", name: "Mixtape", group: "behind", hint: "Yellow capitals and a white serif in turn", style: "behind", look: { font: "montserrat", size: 0.8, caps: false }, fonts: ["impact", "elegant"] },
];

/** A template by its id. */
export const captionTemplate = (id: string) => CAPTION_TEMPLATES.find((t) => t.id === id);

/** The template these settings are, if they're exactly one (its look as the editor stores it, and its fonts). */
export function matchingTemplate(style: ReelStyle, look: ReelLookChanges, fonts: readonly ReelFont[]): CaptionTemplate | undefined {
  const key = (l: ReelLookChanges) => JSON.stringify(Object.entries(parseLookChanges(l)).sort(([a], [b]) => a.localeCompare(b)));
  const mine = key(look);
  return CAPTION_TEMPLATES.find((t) => t.style === style && key(t.look) === mine && (style !== "behind" || !t.fonts || t.fonts.join() === fonts.join()));
}
