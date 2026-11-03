# Recipe: 3 Features in 30 (`three-features`)

A quick tour for X and LinkedIn: the promise, three features shown working and numbered 1, 2, 3, and the way in.
Default: 30 s, square, playful tone, library music, an energetic voiceover. The viewer is scrolling a feed, often
muted, and gives it a few seconds; the numbers tell them how long it will take and where they are.

It's also the craft guide for an untemplated launch of 30 s or less: same per-beat work, timed by the story shape in
[../SKILL.md](../SKILL.md).

## Beat sheet at 30 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Hook | 0-3 | 1 | The promise in a few words, over the real UI |
| Feature 1 | 3-10 | 1-2 | Feature 1 working in the real UI, numbered 1 |
| Feature 2 | 10-17 | 1-2 | Feature 2, numbered 2 |
| Feature 3 | 17-24 | 1-2 | Feature 3, numbered 3 |
| CTA | 24-30 | 1 | Logo, name, the web address |

Pick the three: the brief's "Must show" items in order; else the three the site leads with that you can show
working. Order them so the most visual one is last or first, never buried in the middle.

### Hook (0-3 s)
- **Screen**: the product's main screen or its best result, cropped to the panel that matters so it fills the square.
- **Copy**: the product's promise in at most 6 words, top third. *"A week of bakes, planned."* (Mossbook, from its
  own hero). Not "3 features you'll love".
- **Camera**: `{ at: 0, on: "<panel id>" }` holding; one mark lands by 1 s (a `ring`, or the `type` mark starting
  in the main field) so the frame is alive from the start.
- **Out**: a big accent numeral "1" punches in (from 60% scale with a small overshoot) and pushes the hook away.
- **Sound**: music from frame 0; `interface/bong_001.ogg` under the numeral.

### Each feature (7 s)
- **0-0.8 s**: the numeral (about 200 px tall at 1080) and the label arrive; the numeral then shrinks into the
  top-left corner and stays there as the scene's tag ("1", "2", "3", or "1/3").
- **0.8-5.8 s**: the feature working: capture the page, then a camera shot to the element, the action as marks
  (`type` into the field, `cursor` with `click: true` on the button), the result appearing, a `ring` on it.
- **5.8-7 s**: hold on the result, then out.
- **Copy**: a label of at most 4 words, the feature's own name or a verb phrase: *"Scale any recipe"*, *"Shopping
  list, done"*, *"Share with your team"*. Music only: add one benefit line of at most 6 words under it.
- **Camera**: start on the panel, move to the field or button at the action (`on: [field, button]` to keep both in
  view), then to the result zoomed so its text reads on a phone. One move at a time, 1.5 s apart.
- **Out**: the next numeral slides in from the right as a card push, on a beat. For feature 3 into the CTA, pull the
  camera back to the window and dip through the brand colour.
- **Sound**: the beat carries it; `interface/click_002.ogg` on each click, quiet `keyboard/` presses under typing,
  a soft `impact/impactSoft_medium_003.ogg` when the result lands. Don't repeat the same effect back to back.

Keep the three features in the same layout and rhythm (number, action, result), so the pattern itself reads as a
list. Vary what's shown, not how it's framed.

### CTA (24-30 s)
- **Screen**: logo and name; a small row recapping the three labels with their numerals (they arrive in 0.6 s);
  the URL large below. Settled by 25 s, held to the end.
- **Copy**: the site's button words and the domain: *"Start baking · mossbook.co"*.
- **Sound**: land the URL on a strong cue; fade the music over the last 1.5 s.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | Hook 0-2.5 · features 2.5-6, 6-9.5, 9.5-12.5 (one action each, numeral and label at once) · CTA 12.5-15 (no recap) |
| 20 s | Hook 0-3 · features 3-7.5, 7.5-12, 12-16.5 · CTA 16.5-20 |
| 60 s | Hook 0-4 · features 4-19, 19-34, 34-49 (two scenes each: the action, then the result with a detail) · recap and CTA 49-60 |
| 90 s | Hook and problem 0-8 · features of about 24 s each (setup, action, result) · CTA 80-90 |

Always three features. At 15 s each feature is one action and its result, nothing else.

## Other formats
- **Landscape**: split frame: numeral and label in the left third, the UI in the right two thirds.
- **Vertical**: capture with `--viewport mobile` and use the phone frame; numeral and label above the phone; with a
  voiceover keep the bottom 28% clear (`inset: { bottom: 0.28 }`).
- **Square** (default): numeral top-left, label top band, UI below; with a voiceover the bottom 18% stays clear
  (`inset: { bottom: 0.18 }`), so crop the UI tighter rather than shrinking it.

## Voiceover or music only
- **Voiceover** (the template's default, energetic): about 5 lines: the hook, "One: …", "Two: …", "Three: …", the
  CTA. Keep to the job prompt's word budget. The numeral lands on its spoken number (`cue.word("02", "One")`), the
  camera reaches each feature as its name is said. On screen: numerals and labels only.
- **Music only**: numeral, label and one benefit line per feature; the features change on the track's bars.

## Done when
- [ ] The promise and the real UI are on screen by 1 s.
- [ ] The numerals 1, 2, 3 appear in order, and the current one stays visible through its feature.
- [ ] Each feature shows an action and its result in the real UI, readable on a phone.
- [ ] The three features share one layout and rhythm; transitions land on beats.
- [ ] The URL is settled and large for at least the last 3 s.
- [ ] With a voiceover, each numeral lands on its spoken number and the sync check passes.
