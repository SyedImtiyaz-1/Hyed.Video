# Rubric

Eleven criteria, each scored 0, 1 or 2, weighted to 100; and nine hard fails that stop a video from passing whatever
its score. Every score comes from the review's sheets, its full-size stills or its measurements, never from the code.

Sizes below are in frame pixels at full size (the stills in `work/review/stills/`). The format guide's numbers win if
they differ; a format this file doesn't list uses its own guide the same way.

| | Landscape 1920×1080 | Square 1080×1080 | Portrait 1080×1350 | Vertical 1080×1920 |
|---|---|---|---|---|
| Text-safe box | x 115-1805, y 86-972 (voiceover: y 86-886) | x 76-1004, y 86-972 (voiceover: y 86-886) | x 86-994, y 95-1242 (voiceover: y 95-1026) | x 120-960, y 270-1250 |
| Phone-size tile | 480×270 | 390×390 | 390×488 | 360×640 |
| Smallest drawn text | 32 px | 32 px | 32 px | 34 px |
| UI text the viewer must read | 24 px | 28 px | 28 px | 32 px |
| Hook fully in by | 1.5 s (3 s at the latest) | 1 s | 1 s | 1 s |
| Longest still stretch | 3 s | 2.5 s | 2.5 s (2 s in an ad) | 2 s |
| End-card URL | 64-80 px | 56-76 px | 56-80 px | 64-88 px |

A capital letter is about 0.7 of the font size tall: 32 px type has capitals about 22 px tall in the full-size still.

## Criteria

### `hook` (weight 12)

Look at: `sheet-hook.jpg`; the `[hook]` flag.

| Score | When |
|---|---|
| 2 | Frame 0 is composed: the product's real UI or its result with the hook line readable, nothing half-arrived. The hook line is fully in by the format's time and the product fills most of the frame. Something moves within the first second. |
| 1 | Both arrive by 3 s, but late (after the format's time), small (the UI under half the frame), or the first second is still. |
| 0 | By 3 s there's no real UI or result, or no hook line; or it opens on a logo, a title card, "Introducing…", or an empty frame. |

### `clarity` (weight 12)

Look at: all sheets, as a stranger who has never heard of the product (with a voiceover, also its script).

| Score | When |
|---|---|
| 2 | From the frames alone you can write all three: what it does (a concrete sentence, not a category), who it's for, how to get it (the URL, command or store). |
| 1 | One of the three is missing or vague ("for teams", "a better way to work"). |
| 0 | Two or more are missing, or you can't say what the product does. |

### `real-material` (weight 12)

Look at: every scene still, against `brag-plan.md`'s sources and the captures in `work/capture/`.

| Score | When |
|---|---|
| 2 | Every product screen is the product's own (captured pages through the camera, its real components, its own screenshots or clips). Its colours and fonts. Every number, quote, name, logo and feature on screen is in the plan's sources, word for word. |
| 1 | Real, but one scene redraws the product's UI by hand when a capture was possible, or the colours or type drift from the brand, or one scene uses a generic visual (icon grid, abstract shapes, stock-style art) where the product could be. |
| 0 | The product's UI is mostly redrawn or replaced by generic visuals. |

Anything invented is the hard fail `invented-claim`, not a low score here.

### `readability` (weight 10)

Look at: the phone-size sheets, then the full-size stills; the storyboard's text against each scene's length.

| Score | When |
|---|---|
| 2 | Every line meant to be read reads in its phone-size tile. Drawn text at or above the format's smallest size, UI text the viewer must read at or above its UI size. Text on UI or footage has a backing or clear space. One headline on screen at a time. Every line holds 0.3 s a word plus 0.5 s once fully in. |
| 1 | One or two lines fail one of these. |
| 0 | Three or more fail, or the hook line or the call to action doesn't read at phone size. |

### `layout` (weight 8)

Look at: the phone-size sheets with the magenta box; the full-size stills for edges and overlaps.

| Score | When |
|---|---|
| 2 | Headlines, labels, typed text, key numbers and the call to action sit inside the box; with a voiceover nothing to read sits below its bottom edge. Nothing overlaps by accident or is cut off by the frame (unless it's moving through). In product scenes the product covers 60% of the frame or more. No letterboxing. The format's mark spot (top right) holds no logo or text. |
| 1 | One minor slip: a small persistent label (a header, a page counter, a source line) just outside the box, or one product scene where the product covers less than 60%. |
| 0 | Several slips, or the product small in an empty frame in most scenes. |

Text the viewer must read that's clearly outside the box, under the caption band or cut off is the hard fail
`unsafe-text`.

### `motion` (weight 10)

Look at: the measured still and blank stretches, `sheet-cuts*.jpg`, `sheet-overview.jpg`, the storyboard.

| Score | When |
|---|---|
| 2 | No still stretch longer than the format's limit, except the end card's hold. No blank moment of 0.4 s or more. Every cut still shows a designed transition (a push, wipe, mask, zoom-through or match) with old content leaving before new content arrives. No scene over 8 s. Layouts and transitions vary. |
| 1 | One of: a still stretch over the limit, a blank moment, a muddy or default transition, a scene over 8 s, every scene the same layout and transition. |
| 0 | Two or more of those, or the video plays as a slideshow: still cards changed by cuts or crossfades. |

Nothing changing for 5 s or more is the hard fail `frozen`; blank for 1 s or more is `blank`.

### `camera` (weight 6)

Look at: the full-size scene and hook stills; the storyboard's camera column. `null` when the video shows no captured
pages and makes no camera moves.

| Score | When |
|---|---|
| 2 | Every ring, cursor, typed text and label sits exactly on its element. Each move lands on the thing the scene names and holds there. Zoomed captures are sharp. |
| 1 | One mark slightly off, one soft zoom (blurry text), or one move that lands on the wrong part. |
| 0 | Marks visibly off their elements in two or more stills, or soft, upscaled screenshots throughout. |

### `sound` (weight 8)

Look at: the measured loudness and the `[sound]` flags, against the job's sound (library music, composed, none, a
voiceover). You can't listen: score the numbers.

| Score | When |
|---|---|
| 2 | The sound the job asked for. When something is audible: integrated -14 ±2 LUFS, true peak at or under -1 dBTP, the last 0.4 s at least 10 LU under the mix (it fades out), and with music no silent gap of 1 s or more. A silent video by design has a silent AAC track. |
| 1 | One of: loudness 2-4 LU off the target, true peak between -1 and 0 dBTP, a fade-out that's too short, a silent gap. |
| 0 | Loudness more than 4 LU off, a true peak above 0 dBTP (clipping), two or more of the issues above, or sound in a video meant to be silent. |

No audio stream, or silence when the job asked for music or a voiceover, is the hard fail `missing-audio`.

### `end-card` (weight 8)

Look at: `sheet-end.jpg` (2.5, 2 and 1 s before the end, and the last frame) and the measured end hold.

| Score | When |
|---|---|
| 2 | The last 2 s (2.5 s if the recipe says so, 3 s for a teaser) show the same settled card: the URL or command at the format's size, the logo or wordmark and the product's name. Only a slow push-in or background drift moves. The last frame is that card. |
| 1 | It's there, but small, held only 1-2 s, crowded with extra lines, or still arriving when the hold starts. |
| 0 | No end card, held under 1 s, or the video ends on a blank or black frame. |

No URL, command or product name in the last 2 s, when the scenario has an end card, is the hard fail `no-cta`.

### `technical` (weight 6)

Look at: the first lines of the measure summary and the `[technical]` flags.

| Score | When |
|---|---|
| 2 | The job's exact frame size, 30 fps, yuv420p, H.264 with AAC audio, the length within 10% of the job's (15% with a voiceover), and the poster at full size and baked in as frame 0 (PSNR 30 dB or more). |
| 1 | One of these is off. |
| 0 | Two or more are off. |

A wrong frame size is the hard fail `wrong-size`; no audio stream is `missing-audio`.

### `scenario` (weight 8)

Look at: the recipe's **Done when** list (with no recipe, the scenario skill's story shape and Common failures); with
a voiceover, the voice tool's `frames` check.

| Score | When |
|---|---|
| 2 | Every item passes. |
| 1 | One item fails. |
| 0 | Two or more fail, or it's the wrong kind of video for the job: an ad that tours features, a walkthrough without steps, an update that relaunches the whole product. |

Quote the failing items in the note.

## Hard fails

| id | Fails when | Found by |
|---|---|---|
| `wrong-size` | The frame isn't the job's exact size, or the file has no readable video | measure |
| `missing-audio` | No audio stream, or a silent track (under -50 LUFS) when the job asked for music or a voiceover | measure |
| `frozen` | Nothing changes for 5 s or more, except the end card's final hold (and a README Loop's home holds) | measure |
| `blank` | Frame 0 is blank or black, or a blank or black stretch lasts 1 s or more | measure, then the sheets |
| `fallback-font` | Any text in a default system font (DejaVu, Liberation, a generic serif or mono), or missing-glyph boxes | full-size stills |
| `invented-claim` | A number, quote, customer, logo, review, rating, price, version, date or feature, on screen or spoken, that isn't in the plan's sources or the product's own UI, word for word | scene stills against `brag-plan.md` |
| `unsafe-text` | A headline, label, typed text, key number or the call to action outside the text-safe box, under the caption band (voiceover), or cut off by the frame's edge | phone-size sheets |
| `no-cta` | The scenario has an end card and the last 2 s show no URL, command or product name | `sheet-end.jpg` |
| `secret-on-screen` | An API key, token, password, environment variable's value, or a real person's private data is readable | stills |

Small illustrative text while the product is in use (a project name, "Exported", a file name) isn't a claim. A
number shown as the source wrote it ("12,000+") passes; rounded, extrapolated or "about" fails.

## Score and pass

```
score  = round(100 × Σ weight × score / 2  ÷  Σ weight)     over criteria whose score isn't null
passed = no hard fails  and  no criterion at 0  and  score ≥ 80
```

`review.mjs score` computes both; don't work them out by hand.
