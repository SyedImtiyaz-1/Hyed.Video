# Vertical format (1080×1920)

1080×1920 pixels, 9:16, 30 fps: the full-screen phone frame for Reels, TikTok and YouTube Shorts, often watched muted
at first, with the platform's buttons over the edges and a thumb ready to swipe. Build each scene page at exactly
1080×1920 CSS px; every size below is in those pixels.

## Where it plays

| Place | How it's watched |
|---|---|
| Instagram and Facebook Reels, Stories | full screen; many viewers start muted; about 1 s before they swipe on |
| TikTok | full screen, mostly with sound, swiped fast |
| YouTube Shorts | full screen, sound on more often, loops |
| LinkedIn and X vertical feeds | autoplay muted |

The frame fills a phone 375–430 pt wide, so 1 frame px ≈ 0.37 pt: 34 px is ~12.5 pt (the smallest comfortable size),
96 px is ~36 pt. The viewer's thumb rests over the lower right.

What that changes:
- The first second decides. Frame 0 already shows the product or its result with the hook line readable: no fade
  from black, no logo. The hook is fully on screen by 1 s.
- Muted first: every point reads from the screen alone. With a voiceover, Hyped's captions carry the words, and the
  headlines still name each point.
- Faster than landscape: a visible change every 1.5–2 s, scenes of 1.5–3 s.
- Fewer words, bigger: one idea per screen, at most 4 words a line.
- It loops: the end card's last frame should sit calmly before frame 0 comes round again.

## Safe zones

The platforms draw over the frame. Hyped's box keeps clear of both Meta and YouTube Shorts; TikTok's overlays fall
within the same margins.

| Edge | Meta Reels | YouTube Shorts | Hyped keeps text out of |
|---|---|---|---|
| Top | 14% (269 px): header, camera icon | 10% (192 px) | y < 270 |
| Bottom | 35% (672 px): post caption, username, audio | 25% (480 px) | y > 1250 |
| Right | 6% (65 px): like, comment, share | 10% (108 px): the same buttons | x > 960 (11%) |
| Left | 6% (65 px) | — | x < 120 (11%, the same as the right, so centred text stays centred) |

```
        0    120                    960  1080
     0  +-----------------------------------+
        |   platform header: no text        |
   270  |    +-------------------------+    |
        |    |          [mark 700-950] |    |
   340  |    |  headlines start here   |  b |
        |    |                         |  u |
        |    |  TEXT-SAFE BOX          |  t |
        |    |  x 120-960, y 270-1250  |  t |
        |    |  840 x 980 px           |  o |
        |    |                         |  n |
  1250  |    +-------------------------+  s |
  1340  |    [ voiceover captions,      ]   |
  1498  |    [ x 144-936, stand on 1498 ]   |
        |   username, post caption, audio   |
  1920  +-----------------------------------+
```

- Everything the viewer must read or watch happen sits in the text-safe box (x 120–960, y 270–1250): headlines,
  labels, the field being typed in, the number, the button being clicked.
- The rest of the frame is not empty. Backgrounds and product UI run to all four edges; they just carry no text and
  no action.
- With a voiceover, Hyped burns captions in after you render: 72 px bold type on a dark box, centred, up to 792 px wide
  (x 144–936), standing on y 1498 (78%). One line reaches up to y ≈ 1410, two lines y ≈ 1340. The voice steps say to
  keep text out of the bottom 28% (y ≥ 1382); the box ending at 1250 clears both.
- On free plans Hyped adds a "Made with Hyped" mark, 30 px, at x ≈ 700–950, y ≈ 290–325. Start headlines at y 340 or
  lower, and keep logos out of that spot.
- Profile grids on Instagram and TikTok show the centre 1080×1440 (y 240–1680) as a 3:4 tile. The text-safe box sits
  inside it, so a poster that keeps the hook in the box survives the crop.
- Camera (`.hyped/camera.js`), when it fills the whole frame: pass
  `inset: { top: 0.14, right: 0.11, bottom: 0.35, left: 0.11 }`. It frames each target inside the text-safe box while
  the page fills the frame around it. This is stricter than the `bottom: 0.28` the voice steps ask for, so it meets
  them too. A layout with a headline panel raises `top` (below).

## Type scale

| Role | Size | Weight | Limits |
|---|---|---|---|
| Hook, big-type card | 112–160 px | 800 | ≤ 3 lines, ≤ 3 words a line, ≤ 12 characters a line at 140 px |
| Scene headline | 88–104 px | 700–800 | ≤ 2 lines, ≤ 4 words and ≤ 15 characters a line; ≤ 5 words in all with a voiceover |
| Sub-line | 52–64 px | 500–600 | ≤ 2 lines, ≤ 26 characters a line |
| Label, kicker | 40–48 px | 600–700 | 1 line, ≤ 4 words |
| Callout on the UI (camera label) | pass `size: 42` | 650 (the camera's) | ≤ 3 words |
| Smallest text anyone must read | 34 px | ≥ 500 | — |

- Lines are at most 840 px wide. Measure them in the real font: if a line overflows, cut words before shrinking type.
- Centre text by default. Left-align only in a column whose left edge is x 120.
- Leading 1.0–1.08 for big type, 1.25 for sub-lines. Tracking -0.02 to -0.03em at 88 px and above.
- Text over product UI sits on a solid (or ≥ 85% opaque) chip or panel, never straight on busy pixels.
- No weight below 500 under 48 px, and no line thinner than 3 px: compression and phone downscaling eat them.
- **The product's UI**: text the viewer must read renders at 32 px or more, so frame it at 2 frame px per CSS px or
  more (16 px UI text → 32 px).
  - A mobile capture (`--viewport mobile`, 390×844 at 3×) shown full-bleed (`frame: "none"`) fills the width at 2.77×:
    readable everywhere. In the phone frame, the whole phone is only ~1.1–1.6×: context. Zoom in for reading.
  - A desktop capture fits at 2× only for a target up to ~370×440 CSS px with `pad: 24` (370×240 under a headline
    panel): one card, a form, a chart. Capture it with `--scale 3` so the camera may go that close and further.

## Layouts

| Layout | Geometry | Use it for |
|---|---|---|
| **Headline over the product** (default) | A panel y 0–640 in the brand colour or the page's own background; the headline in it at y 340–600, centred. The camera fills the frame behind it with `inset: { top: 0.35, right: 0.11, bottom: 0.35, left: 0.11 }`, so targets land in y 670–1250. Best with a mobile capture full-bleed. | Most feature scenes. |
| **Phone under a headline** | Headline y 340–600. Camera (phone frame, default inset) in an element x 0–1080, y 620–1920: the phone is ~1120 px tall and 510 wide (y ≈ 710–1830), its lower part under the bottom zone. What matters sits in the top of its screen (y 790–1250). | Apps and mobile-first sites; the first look at the product. |
| **Phone hero** | Camera in an element x 0–1080, y 280–1840 with `inset: { top: 0.02, bottom: 0.02 }`: the phone is ~1500 px tall (78%) and 680 wide. No headline; at most a 3-word kicker chip overlapping the phone's top edge. | A big product reveal. Not for reading: zoom to a detail in another layout. |
| **Full-bleed product** | The mobile page fills the frame at 2.77× (`frame: "none"`, the full-frame inset above); the camera scrolls between elements. Text is camera labels plus at most a kicker chip at y 340. | Walkthroughs, voiceover demos, the product in use. |
| **Big-type card** | 1–6 words at 112–160 px centred in y 500–1150, over the brand colour or the product dimmed to ≤ 35% brightness. | The hook, a claim, a real number, the problem. ≤ 2 s. |
| **Split stack** | Two panels 840×460 at y 280–740 and 790–1250, each with a 40–48 px label chip at its top-left. | Before and after, problem and solution (ads). |

- **A desktop site**: capture `--viewport mobile` first. If the site's phone layout shows the product well, use it.
  If it's broken, thin, or the product is desktop-only (dashboards, editors), use a laptop capture at `--scale 3` and
  the "headline over the product" layout with the camera on one region at 2× or more. The whole desktop window shrinks
  to ~840×550 px in this frame: at most a 1 s establishing beat, never a scene.
- Never letterbox: no 16:9 picture with bars or a blurred copy filling the top and bottom.

## Pacing

| | |
|---|---|
| Length | ads 10–20 s; launches and tours 20–45 s |
| Hook | readable at frame 0, fully in by 1 s; the product or its result on screen by 1.5 s |
| Scene | 1.5–3 s; a feature 2–4 s |
| Changes | something visible changes every 1.5–2 s |
| Reading | a line holds 0.3 s per word + 0.5 s once fully in (a 4-word headline: 1.7 s) |

Transitions of 8–12 frames (0.25–0.4 s) suit a phone: a vertical push, a punch-in through an element of the next
scene, a whip pan with motion blur, a mask reveal in the accent colour. Avoid crossfades longer than 0.3 s, slow
zooms, and 3D flips: at phone size they read as mush.

## The end card

- A centred stack inside x 120–960, y 560–1180. Nothing below y 1250, where the platform's caption and username sit.
- Logo or wordmark 140–200 px tall (a wordmark ≤ 700 px wide). The product name at 80–96 px if the logo doesn't
  spell it. The URL at 64–88 px on one line ≤ 840 px wide (at 80 px about 18 characters fit; shrink to fit, never
  below 56 px). One call-to-action line at 44–52 px if the brief gives one.
- Everything is settled when the hold starts; it holds 2–3 s. End on that calm frame, not a fade to black, so the
  loop back to frame 0 isn't jarring. With a voiceover, the URL is on screen while its line is said.

## Checks for this format

- On check stills, draw the text-safe box (x 120–960, y 270–1250) as a 2 px outline (a debug flag in your scene page,
  off for the render). No text, typed field, click, ring or key number outside it, and nothing in the right column
  (x > 960).
- Scale a still down to 360×640, the size on a phone. Every line still reads; if not, enlarge or cut words.
- Frame 0: the hook is readable and the product is visible, both inside the 3:4 crop (y 240–1680).
- At full size: drawn text ≥ 34 px; UI text the viewer must read ≥ 32 px.
- No letterboxing, no desktop window floating small in empty space, nothing in the mark spot (x 700–950, y 290–325).
