# Square format (1080×1080)

1080×1080 pixels, 1:1, 30 fps: the feed frame for X, LinkedIn, Instagram and Facebook, where the video autoplays muted
while people scroll and fills more of a phone screen than a 16:9 video does. Build each scene page at exactly
1080×1080 CSS px; every size below is in those pixels.

## Where it plays

| Place | How it's watched | Shown at | 1 frame px ≈ |
|---|---|---|---|
| Instagram and Facebook feeds on a phone | autoplay muted, mid-scroll | full width, ~390 pt | 0.36 pt |
| X and LinkedIn on a phone | autoplay muted | ~360–390 pt | 0.35 pt |
| X and LinkedIn on a desktop | autoplay muted; a click for sound | ~500–550 px | 0.5 px |

What that changes:
- Muted is the default. Text carries every point; a voiceover is extra for the few who tap for sound, and Hyped's
  captions carry it for everyone else.
- People are scrolling. The hook must read in the 1–2 s the video crosses the screen, so it is readable at frame 0
  and fully in by 1 s. Frame 0 is also the poster feeds show before playback starts.
- Pacing sits between landscape and vertical: scenes of 2–4 s.
- One centred idea per scene. A square has no room for wide side-by-side layouts.

## Safe zones

| Zone | Pixels | Share | What's there |
|---|---|---|---|
| Sides | x < 76 and x > 1004 | 7% each | feed crops, rounded corners |
| Top | y < 86 | 8% | — |
| Bottom, no voiceover | y > 972 | 10% | X's time badge (bottom-left), mute buttons (bottom-right), LinkedIn's controls |
| Bottom, voiceover | y > 886 | 18% | Hyped's captions |
| Top-right corner | x 820–1080, y 0–100 | — | on free plans, a "Made with Hyped" mark (≈ x 845–1035, y 51–79) |
| Profile-grid crop | x < 135 and x > 945 | 12.5% each | Instagram's grid shows the centre 810×1080 as a 3:4 tile |

```
        0   76  135                        945 1004 1080
     0  +-------------------------------------------+
        |                          [mark 845-1035]  |
    86  |   +-----------------------------------+   |
        |   |    :                         :    |   |
        |   |    :  TEXT-SAFE BOX          :    |   |
        |   |    :  x 76-1004 (928 px)     :    |   |
        |   |    :  y 86-972 (no voice)    :    |   |
        |   |    :  y 86-886 (voiceover)   :    |   |
        |   |    :  dotted: 3:4 grid crop  :    |   |
   886  |   |- - - - - - - - - - - - - - - - - -|   |
        |   |  [ captions 54 px, y ~850-972 ]   |   |
   972  |   +-----------------------------------+   |
        |  time badge                       mute  |
  1080  +-------------------------------------------+
```

- Every word the viewer must read stays in the text-safe box: x 76–1004, y 86–972 without a voiceover (928×886),
  y 86–886 with one (928×800). Backgrounds and product UI run to all four edges.
- With a voiceover, Hyped burns captions in after you render: 54 px bold type on a dark box, centred, up to 873 px
  wide (x 104–977), standing on y 972 (90%). One line reaches up to y ≈ 905, two lines y ≈ 850. Keep all other text
  out of y ≥ 886, and leave y 846–886 free of labels too, so a two-line caption never touches them.
- The poster's hook stays inside the grid crop (x 135–945) so it survives on an Instagram profile.
- Camera (`.hyped/camera.js`): its default inset (top and bottom 7%, sides 6%) matches the box without a voiceover.
  With one, pass `inset: { bottom: 0.18 }`. A layout with a headline band raises `top` (below).

## Type scale

| Role | Size | Weight | Limits |
|---|---|---|---|
| Hook, big-type card | 96–136 px | 800 | ≤ 3 lines, ≤ 3 words a line, ≤ 13 characters a line at 120 px |
| Scene headline | 72–96 px | 700–800 | ≤ 2 lines, ≤ 4 words and ≤ 18 characters a line; ≤ 5 words in all with a voiceover |
| Sub-line | 44–52 px | 500 | ≤ 2 lines, ≤ 32 characters a line |
| Label, kicker | 34–42 px | 600–700 | 1 line, ≤ 4 words |
| Callout on the UI (camera label) | pass `size: 40` | 650 (the camera's) | ≤ 3 words |
| Smallest text anyone must read | 32 px (≈ 11.5 pt on a phone) | ≥ 500 | — |

- Lines are at most 928 px wide (810 px for the hook on frame 0). Measure them in the real font; cut words before
  shrinking type.
- Centre text by default. Leading 1.0–1.08 for big type, 1.25 for sub-lines; tracking -0.02em at 72 px and above.
- Text over product UI sits on a solid (or ≥ 85% opaque) chip or band, never straight on busy pixels.
- No weight below 500 under 44 px, and no line thinner than 2 px.
- **The product's UI**: text the viewer must read renders at 28 px or more, so frame it at 1.75 frame px per CSS px
  or more (16 px UI text → 28 px).
  - A laptop capture fits at 1.75× only for a target up to ~490×480 CSS px with `pad: 24` (490×410 with the voiceover
    inset, ~490×300 under a headline band): a card, a panel, a form. Capture it with `--scale 3` to zoom past 2×.
    The whole laptop window fits only 950×620 px here (0.66×, 16 px text at 11 px) with ~230 px of empty background
    above and below: at most a 1.5 s establishing beat.
  - A mobile capture (`--viewport mobile`, 390×844 at 3×) shown full-bleed (`frame: "none"`) fills the width at
    2.77×, a 390×390 CSS px window onto the page: readable. In the phone frame the whole phone is ~930 px tall
    (≈ 1×): context; zoom in for reading.

## Layouts

| Layout | Geometry | Use it for |
|---|---|---|
| **Headline band and UI** (default) | Headline in y 86–300, centred (1 line at 80–96 px or 2 at 72 px), on a band in the brand colour or the page's background. The camera fills the frame behind it with `inset: { top: 0.3 }` (and `bottom: 0.18` with a voiceover), so targets land in y 324–1004 (324–886). | Most feature scenes. |
| **Full-bleed zoomed UI** | The camera fills the frame on one element at ≥ 1.75×; camera labels name its parts; at most a kicker chip at x 76, y 86. | Demos with a voiceover, the product in use. |
| **Big-type card** | 2–6 words at 96–136 px, centred in y 200–880, over the brand colour or the product dimmed to ≤ 35% brightness. | The hook, a claim, a real number, the problem. ≤ 2 s. |
| **Phone and text** | Camera (phone frame) in an element x 540–1040, full height: the phone is ~930 px tall (810 with a voiceover), ≈ 420 wide. Text column x 76–520, left-aligned: headline 64–80 px (≤ 3 lines, ≤ 2 words a line), sub-line 40 px. | Mobile apps and mobile-first sites. |
| **Two-up compare** | Two panels 448×600 at x 76–524 and 556–1004, y 280–880, under a 1-line headline. | Before and after, two outputs. |
| **Proof card** | A real quote, review or number on a card ≤ 880 px wide, centred, over the product blurred or dimmed. | Social proof (only real quotes and numbers). |

- **A desktop site**: crop to the region that matters with a laptop capture, or capture `--viewport mobile` and show
  the phone layout full-bleed when it presents the product well. For a context shot that fills the square, capture
  `--viewport 1000x1000` (the site's narrow layout; the window fits at ~0.9×).

## Pacing

| | |
|---|---|
| Length | 15–45 s; X does best at 30 s or less, LinkedIn 30–45 s |
| Hook | readable at frame 0, fully in by 1 s; the product on screen by 2 s |
| Scene | 2–4 s |
| Changes | something visible changes at least every 2.5 s |
| Reading | a line holds 0.3 s per word + 0.5 s once fully in (a 4-word headline: 1.7 s) |

Transitions of 9–15 frames (0.3–0.5 s) suit a square: a centred zoom-through or scale, an iris or mask opening from
the centre, a push from any side, a match cut on the same UI element. Avoid crossfades longer than 0.4 s and long
sideways travel.

## The end card

- A centred stack inside x 135–945 (the grid crop), y 200–820, clear of the caption band.
- Logo or wordmark 110–150 px tall (a wordmark ≤ 600 px wide). The product name at 72–88 px if the logo doesn't
  spell it. The URL at 56–76 px on one line ≤ 810 px wide (at 64 px about 22 characters fit). One call-to-action
  line at 38–46 px if the brief gives one.
- Everything is settled when the hold starts; it holds 2–3 s. With a voiceover, the URL is on screen while its line
  is said.

## Checks for this format

- On check stills, draw the text-safe box as a 2 px outline (a debug flag in your scene page, off for the render).
  No text crosses it; with a voiceover, no text in y ≥ 886 and no label just above it.
- Scale a still down to 390×390 (a phone) and 540×540 (a desktop feed). The hook and headlines read at both.
- Frame 0: the hook and the product, inside x 135–945.
- Bottom corners (x < 240 or x > 840, y > 972) and the mark spot (x 845–1035, y 51–79) hold no text or logo.
- In product scenes the product covers at least 60% of the square: no small window floating in empty bands.
- At full size: drawn text ≥ 32 px; UI text the viewer must read ≥ 28 px.
