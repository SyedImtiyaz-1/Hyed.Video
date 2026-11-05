# Portrait format (1080×1350)

1080×1350 pixels, 4:5, 30 fps: the feed frame for Instagram, Facebook and LinkedIn, and the shape Meta's feed ads
want. It's the tallest frame those feeds show whole, a quarter more screen than a square at the same width, and it
autoplays muted while people scroll. Build each scene page at exactly 1080×1350 CSS px; every size below is in those
pixels.

## Where it plays

| Place | How it's watched | Shown at | 1 frame px ≈ |
|---|---|---|---|
| Instagram feed on a phone (a video post there is a Reel) | autoplay muted, mid-scroll | full width, ~390 pt | 0.36 pt |
| Facebook feed on a phone | autoplay muted, mid-scroll | full width, ~390 pt | 0.36 pt |
| Meta feed ads (Facebook and Instagram) | autoplay muted; the ad's text sits above the video, its button below | full width, ~390 pt | 0.36 pt |
| LinkedIn and X on a phone | autoplay muted | ~360–390 pt | 0.35 pt |
| Facebook, LinkedIn and X on a desktop | autoplay muted; a click for sound | ~440–550 px wide | 0.4–0.5 px |

What that changes:
- It's as wide as a square, so type sizes are the square's; the extra 270 px of height goes to the product, or to a
  headline above it.
- Muted is the default. Text carries every point; a voiceover is extra for the few who tap for sound, and Hyped's
  captions carry it for everyone else.
- People are scrolling. The hook must read in the 1–2 s the video crosses the screen, so it is readable at frame 0
  and fully in by 1 s. Frame 0 is also the poster feeds show before playback starts.
- Pacing sits between square and vertical: scenes of 2–3.5 s; ads faster.
- One idea per scene. The frame is narrow: stack things top and bottom rather than side by side.
- It's a feed frame, not a full-screen one. When the same file shows in a 9:16 place (a Meta ad with no vertical
  version, or the post opened in Instagram's Reels tab), it sits in the middle of the tall screen and the platform's
  caption, name and button cover roughly its bottom 29%. Keep the hook and the end card above that line (below).

## Safe zones

Nothing covers the top of a feed video, and only small buttons sit on its bottom corners; Hyped adds captions (with a
voiceover) and sometimes a mark.

| Zone | Pixels | Share | What's there |
|---|---|---|---|
| Sides | x < 86 and x > 994 | 8% each | feed crops, rounded corners (the captions keep the same margin) |
| Top | y < 95 | 7% | rounded corners |
| Bottom, no voiceover | y > 1242 | 8% | sound buttons (bottom-right), X's time badge and Instagram's tag icon (bottom-left), progress bars |
| Bottom, voiceover | y > 1026 | 24% | Hyped's captions |
| Top-right corner | x 800–1080, y 0–130 | — | on free plans, a "Made with Hyped" mark (≈ x 845–1037, y 68–111 with its dark box) |
| 9:16 placements | y > 965 | 29% | when the file plays inside a Reels or Stories screen: the platform's caption, name and button |
| Square crop | y < 135 and y > 1215 | 10% each | thumbnails and places that take only squares show the centre 1080×1080 |
| Profile grid | x < 34 and x > 1046 | 3% each | Instagram's grid shows a 3:4 tile; the side margins already clear it |

```
        0  86                                    994 1080
     0  +--------------------------------------------+
        |                           [mark 845-1037]  |
    95  |  +--------------------------------------+  |
   135  |  |- - - - - - - square crop - - - - - - |  |
        |  |                                      |  |
        |  |   TEXT-SAFE BOX                      |  |
        |  |   x 86-994 (908 px)                  |  |
        |  |   y 95-1242 (no voiceover)           |  |
        |  |   y 95-1026 (voiceover)              |  |
        |  |                                      |  |
   965  |  |. . . . 9:16 placements cover below . |  |
  1026  |  |- - - - - - - - - - - - - - - - - - - |  |
        |  |  [ captions 60 px, y ~1036-1168 ]    |  |
  1215  |  |- - - - - - - square crop - - - - - - |  |
  1242  |  +--------------------------------------+  |
        |  time badge, tag icon               sound  |
  1350  +--------------------------------------------+
```

- Every word the viewer must read stays in the text-safe box: x 86–994, y 95–1242 without a voiceover (908×1147),
  y 95–1026 with one (908×931). Backgrounds and product UI run to all four edges.
- With a voiceover, Hyped burns captions in after you render: 60 px bold type on a dark box, centred, up to 853 px
  wide (x 114–967), standing on y 1161 (86%). One line's box spans y 1096–1168, two lines' y 1036–1168. Keep all
  other text out of y ≥ 1026, the bottom 24% the job prompt names; UI may continue behind the band, but nothing the
  viewer must read or watch happen sits there.
- The hook on frame 0 and the end card's URL stay above y 965, so they survive a 9:16 placement, and inside the
  square crop (y 135–1215), so the poster survives a square thumbnail.
- Camera (`.hyped/camera.js`): its default inset (top and bottom 7%, sides 6%) is close to the box without a
  voiceover. With one, pass `inset: { bottom: 0.24 }`. A layout with a headline band raises `top` (below). The inset
  is a share of the camera's own box: if the camera draws in a smaller element, set `bottom` to the share of that
  element below y 1026.

## Type scale

| Role | Size | Weight | Limits |
|---|---|---|---|
| Hook, big-type card | 96–136 px | 800 | ≤ 3 lines, ≤ 3 words a line, ≤ 12 characters a line at 120 px |
| Scene headline | 72–96 px | 700–800 | ≤ 2 lines, ≤ 4 words and ≤ 17 characters a line; ≤ 5 words in all with a voiceover |
| Sub-line | 44–52 px | 500 | ≤ 2 lines, ≤ 30 characters a line |
| Label, kicker | 34–42 px | 600–700 | 1 line, ≤ 4 words |
| Callout on the UI (camera label) | pass `size: 40` | 650 (the camera's) | ≤ 3 words |
| Smallest text anyone must read | 32 px (≈ 11.5 pt on a phone) | ≥ 500 | — |

- Lines are at most 908 px wide. Measure them in the real font; cut words before shrinking type.
- Centre text by default. Leading 1.0–1.08 for big type, 1.25 for sub-lines; tracking -0.02em at 72 px and above.
- Text over product UI sits on a solid (or ≥ 85% opaque) chip or band, never straight on busy pixels.
- No weight below 500 under 44 px, and no line thinner than 2 px.
- **The product's UI**: text the viewer must read renders at 28 px or more, so frame it at 1.75 frame px per CSS px
  or more (16 px UI text → 28 px).
  - A laptop capture fits at 1.75× for a target up to ~490×610 CSS px with `pad: 24` (~490×480 with the voiceover
    inset, ~490×460 under a headline band, ~490×330 under the band with a voiceover): a card, a panel, a form, a
    short list. Capture it with `--scale 3` to zoom past 2×. The whole laptop window fits only 950×620 px here
    (0.66×, 16 px text at 11 px) with ~365 px of empty background above and below: at most a 1 s establishing beat.
  - A mobile capture (`--viewport mobile`, 390×844 at 3×) shown full-bleed (`frame: "none"`) fills the width at
    2.77×, a 390×487 CSS px window onto the page: readable, and this frame's best view of a phone layout. In the phone
    frame the whole phone is ~1160 px tall (≈ 1.27×; ~930 px with the voiceover inset): context; zoom in for reading.

## Layouts

| Layout | Geometry | Use it for |
|---|---|---|
| **Headline band and UI** (default) | Headline in y 95–330, centred (1 line at 80–96 px or 2 at 72 px), on a band y 0–360 in the brand colour or the page's background. The camera fills the frame behind it with `inset: { top: 0.27 }` (and `bottom: 0.24` with a voiceover), so targets land in y 365–1255 (365–1026). | Most feature scenes. |
| **Full-bleed product** | A mobile capture fills the frame at 2.77× (`frame: "none"`), or the camera holds one panel of a laptop capture at ≥ 1.75×; it moves and scrolls between elements. Text is camera labels plus at most a kicker chip at x 86, y 95. | Demos with a voiceover, walkthroughs, the product in use. |
| **Big-type card** | 2–6 words at 96–136 px, centred in y 250–960, over the brand colour or the product dimmed to ≤ 35% brightness. | The hook, a claim, a real number, the problem. ≤ 2 s. |
| **Phone and text** | Camera (phone frame) in an element x 500–1060, full height: the phone is ~1090 px tall and ≈ 490 wide (~930×420 with a voiceover). Text column x 86–480, left-aligned: headline 64–76 px (≤ 3 lines, ≤ 10 characters a line at 72 px), sub-line 40 px. | Mobile apps and mobile-first sites. |
| **Split stack** | Two panels 908×520 at y 120–640 and 690–1210 (908×420 at y 110–530 and 580–1000 with a voiceover), each with a 36–42 px label chip at its top-left. | Before and after, problem and solution, two outputs. |
| **Proof card** | A real quote, review or number on a card ≤ 840 px wide, centred in y 250–960, over the product blurred or dimmed. | Social proof (only real quotes and numbers). |

- **A desktop site**: crop to the region that matters with a laptop capture at `--scale 3`, or capture
  `--viewport mobile` and show the phone layout full-bleed when it presents the product well. For a context shot
  that fills the frame, capture `--viewport 800x1000` (the site's narrow layout; the window fits at ~1.1×).
- A scenario recipe with no portrait note: follow its square note with this guide's numbers (the same width, 270 px
  more height, the bottom 24% kept clear for captions instead of 18%), and put the extra height into the product,
  not into empty bands.

## Pacing

| | |
|---|---|
| Length | feed posts 15–45 s; Meta feed ads 6–15 s (30 s at most); LinkedIn 30–45 s |
| Hook | readable at frame 0, fully in by 1 s; the product on screen by 2 s (1.5 s in an ad) |
| Scene | 2–3.5 s; 1.5–2.5 s in an ad |
| Changes | something visible changes at least every 2.5 s (every 2 s in an ad) |
| Reading | a line holds 0.3 s per word + 0.5 s once fully in (a 4-word headline: 1.7 s) |

Transitions of 9–15 frames (0.3–0.5 s) suit this frame: a vertical push (it moves the way the feed scrolls), a
zoom-through or scale from the centre, an iris or mask opening from the centre, a match cut on the same UI element.
Avoid crossfades longer than 0.4 s and long sideways travel.

## The end card

- A centred stack inside x 86–994, y 200–960: clear of the caption band, and above the line a 9:16 placement covers.
- Logo or wordmark 120–170 px tall (a wordmark ≤ 640 px wide). The product name at 72–96 px if the logo doesn't
  spell it. The URL at 56–80 px on one line ≤ 908 px wide (at 64 px about 22 characters fit). One call-to-action
  line at 40–48 px if the brief gives one; in an ad, the same action as the ad's button ("Start free" over a "Sign
  up" button), never a second, different ask.
- Everything is settled when the hold starts; it holds 2–3 s. Feeds loop, so end on that calm frame, not a fade to
  black. With a voiceover, the URL is on screen while its line is said.

## Checks for this format

- On check stills, draw the text-safe box as a 2 px outline (a debug flag in your scene page, off for the render).
  No text crosses it; with a voiceover, no text in y ≥ 1026.
- Scale a still down to 390×488 (a phone) and 440×550 (a desktop feed). The hook and headlines read at both.
- Frame 0: the hook and the product inside the square crop (y 135–1215), the hook above y 965.
- Bottom corners (x < 240 or x > 840, y > 1242) and the mark spot (x 845–1037, y 68–111) hold no text or logo.
- In product scenes the product covers at least 60% of the frame: no laptop window floating between empty bands,
  the easiest mistake in this frame.
- At full size: drawn text ≥ 32 px; UI text the viewer must read ≥ 28 px.
