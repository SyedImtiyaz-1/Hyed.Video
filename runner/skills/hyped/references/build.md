# Build: scenes as animated HTML, captured frame by frame

## How a video is made

- Each scene is an HTML page (or one page for the whole timeline) whose look is a **pure function of time**: a
  `render(t)` that sets every element from `t` alone (seconds on the final timeline). No CSS animations or timers that
  run on their own clock; compute positions, opacity and transforms from `t` so any frame can be drawn in any order.
- Capture with Playwright in headless Chromium (install the library in `brag-output/work/`, see
  [tools.md](tools.md)): a viewport of exactly the job's frame size and `deviceScaleFactor: 1`;
  `await document.fonts.ready` and every image's `decode()` before the first frame; then for each frame call
  `render(t)` and take a screenshot. 30 fps: frame n is at `t = n / 30`.
- Encode with ffmpeg: `-framerate 30 -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium`, then
  add the audio (`-c:a aac -b:a 192k -shortest`). Join scenes with ffmpeg's concat, or render one continuous page.
- Keep frames in `brag-output/work/frames/` (they're excluded from the archive). Render a few scenes in parallel
  browser pages if the video is long, but keep every command under a few minutes.

## Type

- The product's own fonts, from the files you downloaded, via `@font-face`. If you can't get them, use Inter (installed).
  Never let text fall back to a default system font: if a glyph is missing, the font isn't loading.
- One display face and one text face at most, plus the product's UI as it is.
- Sizes and line lengths come from the format guide. Headlines: short, set tight (line-height 1.0-1.1, letter-spacing
  -0.01 to -0.03 em for big bold type). Never more than one headline on screen.
- Contrast: text on footage or UI gets a solid or blurred backing, or sits in clear space. Check it in stills.

## Colour

- The brand's palette: its background, text and accent colours. Pick one accent for highlights (rings, the key word,
  progress) and write it to `brag-output/work/brand.json` as `{"accent":"#RRGGBB"}`.
- Backgrounds: the brand's own, or a deep neutral close to it, with subtle depth (a soft gradient, a faint grain or
  glow in the accent). Never a flat stock gradient unrelated to the brand.

## Motion

- **Entrances**: 300-600 ms, ease-out (a cubic-bezier like `0.16, 1, 0.3, 1`); items in a group stagger by 60-120 ms.
  Text arrives by line or by word, with a short rise (12-24 px) and fade, or a mask reveal. Never linear for UI.
- **Exits** are faster than entrances (200-350 ms), ease-in, and happen before the next scene's content arrives.
- **The product in use**: typing, cursor clicks, results appearing, lists filling in, numbers counting to the real
  value. Use the camera's marks for anything on a captured page (see [tools.md](tools.md)).
- **Camera**: each move goes to what's being shown or said, starts 0-0.2 s before the beat that names it, lands, then
  holds while it's read (a gentle push-in while holding is fine). At least 1.5 s between moves. No slow zoom through a
  whole scene, and nothing moves while the viewer is reading a line.
- **Background life**: a slow drift in a gradient or glow is fine; it never competes with the content.

## Transitions

- Designed, not default. Good ones: a push or slide in the story's direction; a mask or wipe in the accent colour; a
  zoom through an element into the next screen; a dip through the background; a match cut on a shared shape or word.
- Stagger them: old content out, then new content in. A plain crossfade between two busy layouts makes a muddy double
  exposure.
- 300-700 ms each. Fast cuts (100-200 ms) only for high-energy tones, and only between simple frames.
- Land major transitions on strong music cues when there's music ([sound.md](sound.md)).

## Layout

- Composition from the format guide: safe zones, the caption band when there's a voiceover, the layouts that work.
- The product's UI fills most of the frame. Crop or zoom to the part that matters, so small UI text is readable on a
  phone. A small screenshot floating in an empty frame is a failure.
- Device frames (a browser window, a phone) are good for context; drop them when you're close in on a detail.
- Nothing overlaps unless it's meant to; nothing is cut off at an edge unless it's moving through it.
