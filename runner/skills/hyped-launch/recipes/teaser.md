# Recipe: Teaser (`teaser`)

Builds anticipation before a launch. Default: 15 s, vertical, cinematic tone, composed music, no voiceover. Made for
Reels, Shorts and X, where it plays muted in a feed more often than not, so the words on screen carry it.

This is the one launch video that doesn't explain the product. It shows real, close glimpses, says one line, and
says when or where. The template's rule holds throughout: **never show the whole product at once.** The core rule
still holds too: real UI and a line on screen by second 3, and every glimpse is the product's real interface.

## Beat sheet at 15 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Glimpses | 0-6 | 3-4 shots of 1.2-2 s | Close, cropped glimpses of the real UI: tease it, don't explain it |
| Tagline | 6-11 | 1 | The tagline, one line, big |
| Coming soon | 11-15 | 1 | Logo and name, "Coming soon", the date or the web address |

### Glimpses (0-6 s)
- **Screen**: extreme close crops of real elements, each a different part of the product: the edge of the main
  button with its label, a chart's line rising, the main field with the caret, a card sliding into a list, the
  accent colour on a toggle. Never the full window, never the logo or the product's name legible: save them.
- **Capture**: the desktop page at `--scale 3`, so close crops stay sharp; `--type "<text>"` for a typing glimpse.
  Show each glimpse with `frame: "none"` (full bleed, no browser bar: it's a glimpse, not a tour).
- **Camera**: one shot per glimpse, tight on a small element (`{ at, on: "<id>", pad: 8 }`, or `zoom` near the
  capture's limit), with a stronger push-in (`drift: 0.05`). On a glimpse without words, a slow slide between two
  neighbouring elements works too (`move` = the glimpse's length, `ease: "linear"`). A `type` mark on the main field
  makes one glimpse.
- **Overlays** (on the scene, never positioned on elements): a vignette, fine grain, a light sweep in the accent
  colour, and a focus pull (blur from 8 px to 0 over the first 0.3 s of each glimpse).
- **Copy**: fragments of 1-3 words, one per glimpse, that build toward the tagline. The first is on screen by 0.5 s.
  *"Every invoice." / "Every reminder." / "Handled."* (Tillbird). Each fragment stays settled for 0.3 s a word plus
  0.5 s (1.1 s for two words), so a glimpse that carries one runs 1.5-2 s; a glimpse without words can be 1.2 s.
- **Out**: fast cuts on the music's beats, each with a 2-frame flash or a shutter blink. Close crops are simple
  frames, so cuts work here where the core skill otherwise asks for 300-700 ms transitions. Into the tagline: a
  0.4 s dip through black.
- **Sound**: the composed track ([../../hyped/references/sound.md](../../hyped/references/sound.md)) opens on a low
  pulse whose beats set the cuts; a quiet `synth/shutter.ogg` on two or three of the cuts (not all);
  `synth/riser.ogg` (1.3 s) ending exactly where the tagline lands.

### Tagline (6-11 s)
- **Screen**: the brand's dark or brand colour, the tagline large and centred; behind it, a blurred, darkened slice
  of the UI drifting slowly (texture, never readable).
- **Copy**: the site's tagline word for word if it's 8 words or fewer and says something concrete (*"Invoices that
  chase themselves."*); otherwise the shortest true line the site has. One line, or two balanced lines.
- **Motion**: words arrive one by one (about 0.12 s apart) or through a mask reveal, then hold still: settled for
  at least 0.3 s a word plus 0.5 s. Five seconds is long for a still card, so it evolves once, at about 8.5 s: the
  tagline rises to the top third and one last, slightly wider glimpse lifts in under it (still partial, still no
  name), or the light sweep crosses the type.
- **Out**: the tagline condenses into the logo, or dips through black for 0.3 s.
- **Sound**: the hit on the tagline's landing (a composed low boom, or `impact/impactSoft_heavy_002.ogg`), then a
  sustained chord under the hold.

### Coming soon (11-15 s)
- **Screen**: logo, name, and "Coming soon" with the date, or the web address. Settled by 11.5 s.
- **Copy**: the date only if the brief or the site states it (*"Launching Nov 12"*). Otherwise *"Coming soon ·
  tillbird.app"*, or the site's own pre-launch button words (*"Join the waitlist · tillbird.app"*). If the brief gives
  a call to action, use it.
- **Sound**: the music resolves into a tail; nothing new starts in the last second.

## Other lengths

| Length | Shape |
|---|---|
| 20 s | Glimpses 0-8 (five) · Tagline 8-14 · Coming soon 14-20 |
| 30 s | Glimpses 0-7 (four) · a fragment card 7-10 · wider glimpses 10-17 (four, each showing a little more) · Tagline 17-24 · Coming soon 24-30 |
| 60-90 s | Three waves of glimpses, each wider and slower than the last, each ending on a fragment card; one wave may start an action and cut before its result. The music builds in three steps. Tagline in the last quarter, Coming soon the last 6-8 s. Still never the whole product. |

Teasers longer than 30 s drag: keep every glimpse under 2.5 s and let the waves, not the shots, get longer.

## Other formats
- **Landscape**: letterbox to about 2.39:1 with black bars for a film feel; crops can be wider, but stay partial.
- **Square**: centre the crops; the tagline in two balanced lines.

## Voiceover or music only
- **Music only** (the default): the fragments and the tagline carry it; the composed track drives every cut.
- **Voiceover** (if the job adds one): 2-4 words per glimpse, said low and slow; the tagline spoken as it lands; the
  date or address spoken last. On screen: the fragments shrink to labels, the tagline stays big. Keep the bottom 28%
  clear (`inset: { bottom: 0.28 }`) in vertical, 24% in portrait, 18% in landscape and square.

## Done when
- [ ] No frame shows the whole product; the name and logo appear only on the last card.
- [ ] A real UI glimpse and the first fragment are on screen by 1 s.
- [ ] Every glimpse is a captured element, sharp at its zoom (no soft, upscaled crops).
- [ ] Cuts land on beats; the riser ends on the tagline; the tagline holds settled long enough to read.
- [ ] The launch date appears only if the brief or site gives it.
- [ ] The last card is settled for at least 3 s.
