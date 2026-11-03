# Recipe: Feature Drop (`feature-drop`)

Announces one new feature or release, for a changelog, X and LinkedIn. Default: 20 s, landscape, polished tone,
library music, no voiceover. The viewer is often a current user who wants to know in seconds what changed and where
to find it; a newcomer should still see what the product does. It's also the recipe for every "feature" video
without a template, timed by the story shapes in [../SKILL.md](../SKILL.md).

The job prompt lists the template's beats, scaled to the chosen length. This recipe fills them in.

Before planning, settle from the sources (brief, changelog, release notes, the site): the feature's exact name,
whether a source calls it new, its version, the old way, and how to get it. Write each source into the plan.

## Beat sheet at 20 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| What's new | 0-3 | 1 | The feature's name, with a version badge if there is one |
| Before | 3-9 | 1-2 | The old way, or the problem |
| After | 9-16 | 2 | The new feature working in the real UI |
| Try it | 16-20 | 1 | How to try it, with the web address |

### What's new (0-3 s)
- **Screen**: the feature already working, cropped to its panel and filling the frame (a captured state where the
  result is visible). The name sits in the top third on a chip or plate in the product's style.
- **Copy**: a `New` chip in the accent colour (only if a source says new), the name exactly as the changelog writes
  it, and the version beside it when sourced. *"New · Timeline view · Plotwise 2.4"*. Settled by 0.6 s.
- **Camera**: `{ at: 0, on: "<feature panel id>" }` with the default drift; if the product shows its own "New" badge,
  a `ring` on it at 0.4 s instead of a chip of your own.
- **Out**: the colour drains from the frame (to greyscale and 15% darker, 0.4 s): this becomes the Before.
- **Sound**: music from frame 0; `interface/bong_001.ogg` under the chip's pop.

### Before (3-9 s)
- **Screen**, in this order of preference:
  1. The real UI without the feature: the same screen in its old or manual state (the list the timeline replaces,
     the empty field before autofill), captured live if it still exists, or the docs' own screenshot of it.
  2. The manual steps the docs or changelog describe, as 2-3 quick steps acted out with the cursor on real elements.
  3. The problem line alone, over a blurred, greyed crop of the product.
  Muted throughout: greyscale or the product's colours at 30% saturation. Never a made-up "old" screen.
- **Copy**: one line, at most 7 words, about what was wrong. Qualitative unless the source gives a number:
  *"Planning lived in a flat list."* Or the old steps struck through one by one: *"Export. Re-import. Fix dates."*
- **Camera**: slower and wider than the After; small repeated actions (a `cursor` clicking down a list) show tedium.
- **Out**: the switch, designed: a wipe in the accent colour sweeps across and colour returns behind it, or the
  `New` chip slides back across the frame and repaints it. Land it on a strong cue.
- **Sound**: the track continues; `synth/whoosh.ogg` (0.6 s) peaking on the switch. Nothing on the old clicks.

### After (9-16 s, two scenes)
- **Screen**: the feature doing its job in the real UI, in full colour. Scene A, the trigger: the click, the drag,
  the typed command. Scene B, the result: what changed, close enough to read, then a hold.
- **Copy**: a label of at most 5 words saying what it does for the viewer: *"Drag to reschedule."* Pin a smaller
  label to the result element (`label` mark): *"Dependents move too"*.
- **Camera**: `"window"` → the trigger element as it's used → `[trigger, result]` while the result appears → the
  result at 1.6-2× until its text reads on a phone. Marks: `cursor` with `click: true` or `type` on the trigger, a
  `ring` on the result as it lands, the `label`. 1.5 s between moves.
- **Out**: pull back to `"window"`, then a slide-push into Try it on a beat.
- **Sound**: `interface/click_002.ogg` on the click (quiet `keyboard/` presses for typing); a soft
  `impact/impactSoft_medium_001.ogg` as the result lands.

### Try it (16-20 s)
- **Screen**: logo, name and version badge; how to get it; the URL large. The feature's screen may stay behind,
  dimmed and blurred, as texture. Settled by 16.5 s.
- **Copy**: one of: *"Live now in Plotwise 2.4 · plotwise.app"* (when a source says it's live), *"Settings →
  Timeline · plotwise.app"* (the real menu path), `npm i kitecheck@2.4` (a CLI), or the brief's call to action.
- **Sound**: land the URL on a strong cue; fade the music over the last 1.5 s.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | What's new 0-2.5 · Before 2.5-5.5 (one scene, one line) · After 5.5-12 (trigger and result in one scene) · Try it 12-15 |
| 30 s | What's new 0-3 · Before 3-8 · After 8-24 (trigger, result, then one detail or option) · Try it 24-30 |
| 60 s | What's new 0-4 · Before 4-13 (two scenes) · After 13-45 (setup, action, result, a second use, where it lives in the app) · Why it matters 45-53 (the benefit a source states, on its result) · Try it 53-60 |
| 90 s | A release: headline 0-5 (*"Plotwise 2.4: three changes"*, only if the changelog lists them) · each change a 4 s before and a 10-14 s after · recap of the change names 74-82 · Try it 82-90 |

At 30 s or less, one feature only, even if the release has more: the brief's, or the changelog's first entry.

## Other formats
- **Vertical**: stack the switch: the Before in the top half shrinks away as the After fills the frame. Capture with
  `--viewport mobile` if the feature exists on the phone layout; otherwise crop the desktop panel with
  `frame: "none"`. With a voiceover, keep the bottom 28% clear.
- **Square**: crop to the feature's panel; the name in the top band; the Before and After can share the format
  guide's **Two-up compare** layout for the switch (it works in landscape too).

## Voiceover or music only
- **Music only** (the default): the name chip, the before line, the after label and the try-it card tell it all;
  each holds for 0.3 s a word plus 0.5 s.
- **Voiceover** (if the job adds one): four lines, one per beat. *"New in Plotwise: Timeline view."* / *"Until now,
  plans lived in a flat list."* / *"Now drag any task, and everything after it moves too."* / *"Find it under
  Settings, Timeline."* The camera reaches the trigger on its word (`cue.word("03", "drag")`); labels agree with the
  lines; nothing claims "live" or "for everyone" without a source.

## Done when
- [ ] At 1 s the feature is on screen, working, with its name; "New" and the version appear only if a source says so.
- [ ] The Before is muted and is the real product or its documented steps; the After is in full colour.
- [ ] The switch is a designed transition on a strong cue, not a cut.
- [ ] The After shows a trigger and a readable result in the real UI, with marks pinned to real elements.
- [ ] Try it says how to get the feature and holds the URL or command for at least the last 2.5 s.
- [ ] The plan lists the source of the name, version, before and availability.
