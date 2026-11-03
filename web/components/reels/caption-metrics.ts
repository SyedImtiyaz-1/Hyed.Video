import type { CaptionFont } from "@launchreel/core/captions";

/**
 * Each caption font's Windows ascent as a share of its ascent plus descent (from runner/src/fonts.ts, which the render
 * measures with): libass puts a line's baseline that far down its line box, which is the ASS font size tall. Browsers
 * lay text out by other metrics (Anton's CSS ascent is 1.18 em, its Windows one 1.404), so the previews place a
 * lockup's lines by this baseline rather than by CSS line boxes. (It belongs beside CAPTION_FONT_EM in captions.ts.)
 */
export const CAPTION_FONT_ASCENT: Record<CaptionFont, number> = {
  inter: 0.8008, montserrat: 0.71, poppins: 0.6442, tiktok: 0.8221, roboto: 0.7917, rubik: 0.6958, anton: 0.8102,
  bebas: 0.7308, oswald: 0.7785, archivo: 0.7684, bangers: 0.7974, luckiest: 0.7992, abril: 0.7843, dmserif: 0.7557,
  instrument: 0.7615, kaushan: 0.7471, caveat: 0.7556, marker: 0.7777, playfair: 0.822, instrumentupright: 0.7615,
  archivowide: 0.7285, fredoka: 0.7986, lilita: 0.8075, poppinsitalic: 0.6442, dancing: 0.7817, greatvibes: 0.6629,
  gochi: 0.6539, courier: 0.7036, pixel: 0.7614, pressstart: 0.7278,
};
