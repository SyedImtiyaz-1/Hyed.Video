# Landscape format (1920×1080)

1920×1080 pixels, 16:9, 30 fps: the wide frame for homepages, Product Hunt, YouTube and desktop feeds, where the
product's UI can be shown large and many viewers have the sound on. Build each scene page at exactly 1920×1080 CSS px;
every size below is in those pixels.

## Where it plays

| Place | How it's watched | Shown at | 1 frame px ≈ |
|---|---|---|---|
| YouTube, full screen, a demo page | clicked on purpose, sound on | 1280–1920 px wide | 0.7–1 screen px |
| Homepage hero, Product Hunt gallery | homepage: autoplay, muted; Product Hunt: clicked, sound on | 700–1200 px | 0.4–0.6 |
| LinkedIn or X on a desktop | autoplay muted in the feed, then maybe clicked | ~550 px | 0.3 |
| LinkedIn, X or YouTube on a phone | muted, phone upright, video fills the width | ~390 pt | 0.2 |

What that changes:
- Viewers chose to watch, or are deciding to. A feature can take 4–6 s, and the story has room for a problem, a
  reveal and 3–5 features. The hook still lands by second 3.
- Sound is often on, so music hits and sound effects can mark changes. Homepages and feeds start muted, though: every
  point must also read with the sound off.
- Frame 0 is the poster and the thumbnail. It shows the product and the hook line, not a logo.
- Many views are on a phone, where the whole frame is ~390 pt wide. Headlines must still read there: 80 px or more.

## Safe zones

Nothing sits over a landscape frame for long, but players and feeds put controls on the edges, and Hyped adds captions
(with a voiceover) and sometimes a mark.

| Zone | Pixels | Share | What's there |
|---|---|---|---|
| Sides | x < 115 and x > 1805 | 6% each | crops in some embeds |
| Top | y < 86 | 8% | YouTube's title bar on hover and pause |
| Bottom, no voiceover | y > 972 | 10% | progress bar, play controls, X's time badge |
| Bottom, voiceover | y > 886 | 18% | Hyped's captions |
| Top-right corner | x 1560–1920, y 0–120 | — | on free plans, a "Made with Hyped" mark (≈ x 1600–1850, y 54–90) |

```
        0     115                                          1805  1920
     0  +--------------------------------------------------------+
        |                                     [mark 1600-1850]   |
    86  |     +----------------------------------------------+   |
        |     |  TEXT-SAFE BOX   x 115-1805 (1690 px wide)   |   |
        |     |  no voiceover:   y 86-972  (1690 x 886)      |   |
        |     |  voiceover:      y 86-886  (1690 x 800)      |   |
   886  |     |- - - - - - - - - - - - - - - - - - - - - - - |   |
        |     |   [ captions 72 px, x 166-1754, y ~900-994 ] |   |
   972  |     +----------------------------------------------+   |
        |        player controls, progress bar, time badge       |
  1080  +--------------------------------------------------------+
```

- Every word the viewer must read stays in the text-safe box. Backgrounds and product UI run to all four edges.
- With a voiceover, Hyped burns captions in after you render: 72 px bold type on a dark box, one line, centred, up to
  1588 px wide (x 166–1754), standing on y 994. Keep all other text out of y ≥ 886. UI may continue behind the band,
  but nothing the viewer must read or watch happen sits there.
- Camera (`.hyped/camera.js`): its default inset (top 7%, sides 6%, bottom 7%) already matches the box without a
  voiceover. With one, pass `inset: { bottom: 0.18 }`. The inset is a share of the camera's own box: if the camera
  draws in a smaller element, set `bottom` to the share of that element below y 886.

## Type scale

| Role | Size | Weight | Limits |
|---|---|---|---|
| Hook, hero line | 112–144 px | 700–800 | ≤ 2 lines, ≤ 6 words and ≤ 26 characters a line |
| Scene headline | 80–104 px | 700 | ≤ 2 lines, ≤ 6 words a line; ≤ 5 words in all with a voiceover |
| Sub-line | 44–56 px | 400–500 | ≤ 2 lines, ≤ 50 characters a line |
| Label, kicker, step number | 32–40 px | 600 (+0.06em tracking in capitals) | 1 line, ≤ 4 words |
| Callout on the UI (camera label) | pass `size: 40` | 650 (the camera's) | ≤ 3 words |
| Smallest text anyone must read | 32 px | ≥ 500 | — |

- A centred headline block is at most 1300 px wide; a text column in a split layout at most 760 px.
- Leading 1.05–1.1 for headlines, 1.3 for sub-lines. Tracking -0.02em at 80 px and above.
- No text weight below 400 and no line thinner than 2 px: H.264 smears them.
- **The product's UI**: text the viewer must read (a field, a number, a row) renders at 24 px or more. UI text is
  usually 13–16 CSS px, so frame it at 1.5 frame px per CSS px or more: a camera target at most 1050×480 CSS px with
  `pad: 24`. The whole-window view of a laptop capture (≈ 0.99×, 1425 px wide; 0.86× with the voiceover inset) is for
  context: hold it ≤ 2.5 s, then move in. The camera stops at the capture's sharpness (2× by default); capture with
  `--scale 3` to go closer.

## Layouts

| Layout | Geometry | Use it for |
|---|---|---|
| **Window under a headline** | Headline, 1 line at 80–96 px, centred in y 86–230. Camera in an element x 0–1920, y 230–1080; the window fits at ≈ 0.75×. | Opening a feature: show the page, then move to the part named. |
| **Split: text left, UI right** | Text column x 115–800, left-aligned, vertically centred: kicker 32–36 px, headline 72–96 px (≤ 3 lines, ≤ 3 words a line), sub-line 40–48 px. Camera in an element x 840–1920, full height, on a region or a phone. | Features that need one sentence of explanation. Keep the column edge fixed across scenes; flip sides at most once. |
| **Full-bleed product** | The camera fills the frame, zoomed past the window's edges (or `frame: "none"`). Text is camera labels plus at most a kicker chip at x 115, y 86. | Walkthroughs, voiceover demos, the product in use. |
| **Centred hero type** | 1–2 lines at 112–144 px centred in the box, over the brand colour or the product dimmed to ≤ 40% brightness or blurred 12–20 px. | The hook claim, a real number, the problem. ≤ 2.5 s, never twice in a row. |
| **Phone and text** | Mobile capture; camera (phone frame) in an element x 1000–1805, full height: the phone is ~930 px tall (810 with a voiceover), ≈ 420 wide. Headline and 2–3 short lines at x 115–960. | Mobile apps and mobile-first sites. |
| **Two-up compare** | Two panels 820×620 at x 115–935 and 985–1805, under a 1-line headline. | Before and after, old and new, two outputs. |

- **A desktop site**: use the default laptop capture (1440×900). `--viewport desktop` (1920×1080) fits smaller
  (≈ 0.82×, so text is smaller); keep it for dashboards that need the width.
- **A mobile app or site**: capture with `--viewport mobile` (390×844 at 3×). The phone fits the height at about 1×, so
  its text is ~16 px: that's context. Zoom onto the part being read (2–3×). For a flow, show 3 phones side by side,
  ~760 px tall and 80 px apart, the active one at full brightness and the others dimmed 50%: a glance, not a read.

## Pacing

| | |
|---|---|
| Length | teaser 15–30 s; launch or feature video 30–60 s; homepage hero 60–90 s |
| Hook | the product and the hook line on screen by 3 s; frame 0 already composed |
| Scene | 3–6 s, never more than 8 s |
| Changes | something visible changes at least every 3 s; camera moves at least 1.5 s apart |
| A feature beat | arrive 0.5 s, the product in use 2–3 s, the result settled 1–2 s |
| Reading | a line holds 0.3 s per word + 0.5 s once fully in (a 5-word headline: 2 s) |

Transitions of 12–24 frames (0.4–0.8 s) read well on a wide screen: a horizontal push or slide, a zoom-through into
a UI element that becomes the next scene, a match cut on the same element in two states, a wipe or mask in the accent
colour (0.4–0.5 s). Avoid whips shorter than 0.3 s (they strobe on a big screen), spins and 3D flips, and crossfades
longer than 0.4 s.

## The end card

- A centred stack inside x 115–1805, y 200–820, clear of the caption band.
- Logo or wordmark 96–140 px tall (a wordmark ≤ 600 px wide). The product name at 72–96 px if the logo doesn't spell
  it. The URL at 64–80 px, weight 600–700, in the accent colour or on an accent pill. One short call-to-action line at
  40–48 px if the brief gives one.
- A command (`npx acme init`) goes in the product's monospace font at 56–72 px on a dark terminal card ≤ 1300 px wide.
- Everything is settled when the hold starts. It holds 2.5–3 s (2 s at the very least). Only a slow push-in (≤ 3%)
  or a background drift moves. With a voiceover, the URL is on screen while its line is said.

## Checks for this format

- On check stills, draw the text-safe box as a 2 px outline (a debug flag in your scene page, off for the render).
  No text crosses it. With a voiceover, no text in y ≥ 886.
- Scale a still down to 480×270, the size of a phone feed. The hook and the headlines still read; if not, enlarge.
- At full size: drawn text ≥ 32 px; UI text the viewer must read ≥ 24 px; in product scenes the product covers at
  least 60% of the frame.
- The top-right corner (x 1560–1920, y 0–120) has no logo or text.
- Frame 0: the product and the hook. Nothing important in the bottom-right 240×100 px, where YouTube shows the
  video's length on the thumbnail.
- In split layouts, the text column and the window keep the same edges from scene to scene.
