# Before / After

The old way against the product's way, in one switch. Template defaults: 20 s, vertical, tone `default`, library
music, no voice, made for Reels, Shorts and X.

## Goal and audience

Scrollers who do this task the old way today. The ad works when the two halves are so clearly the same task that the
difference needs no explaining: grey and slow on one side, the product's colours and speed on the other.

Decide three things before the storyboard:

- **The task**: one job both halves do (build a rota, file 12 receipts, format a newsletter). Same task, same
  content, same framing. Capture the product first, then build the Before from the content its capture shows (the
  same receipts, names or document), so the two halves match.
- **The old way**: how people do it without the product: a generic spreadsheet, paper, an email thread, a pile of
  tabs. Built in HTML, generic, never a real competitor's UI, name or logo. If the site shows its own "before"
  (a comparison section, a "without us" image), use that.
- **The outcome**: a number from the site ("12 receipts, one tap" only if the site says it), or the finished result.

## Beat sheet (20 s)

**0-6 s · Before** (2 scenes, 3 s each)
- On screen: the old way, desaturated (CSS `filter: grayscale(0.9) contrast(0.9)`), on a dull background. A small
  "BEFORE" tag at the top-left of the text-safe box (the top-right is where the free plan's mark goes). The task
  fails slowly: a cursor hunts, a cell is copied by hand, a reply-all lands, an error appears.
- Frame 0 (the poster) and the first 1.2 s: the vertical guide's "Split stack": the grey Before above, the product's
  finished result in colour below, each with its tag. That's the hook, and it puts the real product on screen by
  second 3 as the core rule asks. At 1.2 s the After panel slides away and the Before fills the frame.
- Copy: the frustration in plain words, the first line settled at frame 0: "Copy. Paste. Check. Repeat." Then the
  second scene's line: "Every. Single. Receipt." At most 5 words each.
- Motion: deliberately clunky. Slow eased moves, a stutter, a scroll that goes on too long. It's your own HTML, so
  animate it in `render(t)` and aim its cursor at your own elements' measured boxes; no camera.js here.
- Out: the second scene ends on the most annoying moment (the error, the 40th tab), held 0.3 s.
- Sound: the music bed starts low-passed or quieter, so the switch can open it up.

**6-8 s · Switch** (the transition, about 2 s)
- One designed move, timed to the track's strongest cue:
  - **Wipe**: an accent-coloured bar sweeps across the frame; behind it everything is the After, in colour.
  - **Match cut**: one element stays in place (the list, the document) and turns from grey mess into the product's
    tidy version of the same content.
  - **Slider**: a before/after split line drags across the frame, revealing the product under the mess.
- Timing: 0.3 s of anticipation (the mess shakes or pulls back slightly), 0.8 s for the move, 0.9 s for the After to
  settle. The "BEFORE" tag flips to "AFTER" in the accent colour.
- Sound: the one big moment: a medium impact from `.hyped/audio/sfx/impact/` on the cue, and the music opens up.

**8-16 s · After** (2-3 scenes)
- On screen: the real product doing the same task, in its own colours: captured with `--viewport mobile` and shown
  full-bleed through camera.js in the vertical guide's "Headline over the product" layout, with its camera inset.
- Copy: short and fast: "Snap." / "Sorted." / "Sent." Or the product's own button words.
- Camera and marks: quicker than the Before. A shot on the field or upload area; a `cursor` with `click: true` on
  the main button; a `ring` on the result as it appears; a `type` mark if the task starts with typing (capture with
  `--type "<text>"`). Leave 1.5 s between camera moves.
- Out: a push from the result into the outcome. Sound: one UI click on the key click.

**16-20 s · Outcome** (1-2 scenes)
- 16-17.5 s: the outcome: the site's number, counting up to its exact value, or the finished result big. The
  vertical guide's "Split stack" (Before above, After below, each with its tag) works well here.
- 17.5-20 s: logo, name and the address, large (the format guide's end card): "tallybird.app". Hold 2-3 s; if
  the beat is too short for that, end the split earlier.
- Sound: the music resolves; fade over the last 1.5 s.

## Scaling

| Length | Before | Switch | After | Outcome | What changes |
|---|---|---|---|---|---|
| 15 s | 0-4.5 | 4.5-6 | 6-12 | 12-15 | one Before scene; the Switch shortens to 1.5 s; Outcome is just the address card if there's no number |
| 20 s | 0-6 | 6-8 | 8-16 | 16-20 | as above |
| 30 s | 0-9 | 9-12 | 12-24 | 24-30 | three Before moments; three After moments that mirror them in the same order |
| 60 s | 0-18 | 18-24 | 24-48 | 48-60 | mirror structure: four or five frustrations, then each one solved in the same order; the Switch can play twice (one big, one small) |
| 90 s | 0-27 | 27-36 | 36-72 | 72-90 | as 60 s; never add a second task |

With a longer Before, keep a visible change every 2 s. Grey and slow must still be watchable.

## With a voiceover

The template has none. If the job gives one: the Before lines are flat and tired ("Copy, paste, check. Again."), the
After lines are quick ("Snap it. Done."), and the Switch lands on a word: start the move at the cue of the first
After word, minus 0.15 s. The vertical guide's insets already clear the captions; keep every headline in its
text-safe box.

## Other formats

- **Portrait**: the portrait guide's "Split stack" (Before on top, After below) for the Outcome; the After in its
  "Headline band and UI" layout, the camera on one panel.
- **Square**: the square guide's "Two-up compare" (Before left, After right) for the Outcome; the After in its
  "Headline band and UI" layout, the camera on one panel.
- **Landscape**: the landscape guide's "Two-up compare". Before and After can share the frame from the Switch on: the
  wipe stops at the middle, the Before stays grey on the left while the product works on the right.

## Done when

- [ ] Frame 0 is the split: grey Before above, the product's real result below, the hook line settled.
- [ ] Both halves do the same task with the same content, and the Before is generic (no real brand or lookalike UI).
- [ ] The Before is grey and slow; the After is the captured product in its own colours.
- [ ] The Switch is one designed move on the strongest music cue, with the one big sound.
- [ ] The outcome is the site's number or the result itself; nothing invented.
- [ ] The headlines alone tell the story muted; the end card uses the format guide's sizes and holds 2-3 s.
