# Recipe: Launch Day (`launch-day`)

The product's launch video, for Product Hunt, the homepage hero and YouTube. Default: 60 s, landscape, polished tone,
library music, a warm voiceover. The viewer has never heard of the product and decides in this minute whether it's
worth a click. Homepage and YouTube viewers often have the sound on; Product Hunt viewers often don't, so it must
also work muted (captions with a voiceover, readable lines without one).

The job prompt lists the template's beats, scaled to the chosen length. This recipe fills them in; it never changes
their order or meaning.

## Beat sheet at 60 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Hook | 0-4 | 1 | The product's best result in its real UI, with the hook line |
| Problem | 4-12 | 2 | The problem in one sharp line, over the real "before" |
| Meet it | 12-18 | 1 | Name and logo land in the product's UI, with what it is |
| Features | 18-48 | 6 | Three features, about 10 s each: an action scene, then a result scene |
| Proof | 48-56 | 1-2 | A real number, result or memorable detail |
| CTA | 56-60 | 1 | Logo, name, the web address, large |

### Hook (0-4 s)
- **Screen**: the finished result in a browser window filling 80% of the frame or more: the generated report, the
  paid invoice, the green check. Capture it in that state (`--type` if a field must be filled to get there).
- **Copy**: the result in plain words, at most 6. *"Invoiced Monday. Paid Wednesday."* (Tillbird)
- **Camera**: start close on the result (`{ at: 0, on: "<result id>", pad: 40 }`), a ring settling on it at 0.6 s,
  then pull out to `"window"` at about 2.6 s so the viewer sees where it lives.
- **Out**: keep pulling back while the window drains to grey: it becomes the Problem's "before".
- **Sound**: music from frame 0 (start the track at a strong cue near its top if the intro is weak); one soft impact
  (`impact/impactSoft_medium_001.ogg`) when the result lands.

### Problem (4-12 s, two scenes)
- **Screen**: the "before" in the product's own world: its empty state, or the manual list or pile the site
  describes, built from the site's own copy. Scene A states the line; scene B shows its cost up close (the pile
  growing, the cursor clicking the same button again). No stock photos, no invented competitor UI.
- **Copy**: one line, at most 7 words, from the site's problem section if it has one. *"Chasing invoices eats your
  Fridays."* Scene B adds at most a 3-word label, or nothing.
- **Camera**: wide and slow; things pile up one by one. A ring with `dim: 0.4` on the part that hurts.
- **Out**: the clutter collapses toward the centre and becomes the logo (match cut), on a strong cue.
- **Sound**: the music carries it; at most one muted click. Don't make the problem sound sad.

### Meet it (12-18 s)
- **Screen**: the wordmark settles large, the real app window rises under it, and the logo shrinks into the app's
  header or browser tab. Capture the product's main screen for the window.
- **Copy**: the name, then one sentence saying what it is (at most 9 words): the site's tagline if it names a
  concrete thing. *"Tillbird. Invoices that chase themselves."*
- **Camera**: `{ at: 13.5, on: "window" }`, holding with the default drift.
- **Out**: zoom-through into the first feature's element: the camera pushes into it and the next scene starts there.
- **Sound**: land the logo on the track's strongest cue in this window; `interface/bong_001.ogg` or a soft heavy
  impact under it.

### Features (18-48 s: three × 10 s)
Each feature gets two scenes: **action** (about 6 s) and **result** (about 4 s).
- **Screen**: the feature working in the real UI. Action: the field filling, the button pressed. Result: what
  changed, close up: the new row, the sent email, the chart redrawn.
- **Copy**: a label of at most 4 words, the feature's own name or a verb phrase (*"Auto-reminders"*). Music only: a
  second, smaller line of at most 6 words for the benefit (*"Sent before you remember."*).
- **Camera**: `"window"` → the field (`on: "input-…"`) → field and button together (`on: [field, button]`) → the
  result, zoomed until its text reads on a phone. Marks: `type` on the field, `cursor` with `click: true` on the
  button, `ring` on the result as it appears, `label` pinned to the result (*"Sent 9:00"*). At least 1.5 s between
  camera moves.
- **Out**: vary across the three: a slide-push on a beat, a zoom-through, a dip through the brand colour. Never the
  same transition twice in a row.
- **Sound**: `interface/click_002.ogg` on each cursor click, quiet `keyboard/` presses under typing, a soft impact on
  each result. Six effects at most across the whole Features beat.

### Proof (48-56 s)
- **Screen**: the camera lands on the element the proof comes from (the site's stats band, the README badge, the
  pricing card) and the number lifts out large; a count-up ends on exactly the stated figure.
- **Copy**: the number and what it counts, the site's way: *"12,000+ invoices sent"* (only because the site says so).
  With no number: the best real detail (*"Free until you get paid."* from the pricing page).
- **Camera**: ring on the source element, then a zoom to 2× on it.
- **Out**: pull back to the brand background.
- **Sound**: put the number's landing on a strong cue; the music is near its peak here.

### CTA (56-60 s)
- **Screen**: logo, name, the URL large, and the site's main button words. Settled by 56.5 s, held to the end.
- **Copy**: *"Start free · tillbird.app"*.
- **Sound**: the music resolves; fade it over the last 1.5 s.

## Other lengths

Minimums beat proportions: the Hook gets at least 3 s and the CTA at least 2.5 s settled, at any length.

| Length | Shape |
|---|---|
| 15-20 s | Hook 0-3 (the problem folds into the hook line) · Meet it 3-5.5 · two features, one scene each, to about 15 · CTA last 3 s. Drop Proof unless the proof is the hook. |
| 30 s | Hook 0-3 · Problem 3-6 (one scene) · Meet it 6-9 · Features 9-24 (one scene each) · Proof 24-27 · CTA 27-30 |
| 90 s | Hook 0-5 · Problem 5-14 · Meet it 14-21 · Features 21-69 (four features × 12 s, or three × 16 s with action, result and a detail) · Proof 69-81 (two moments) · CTA 81-90 |

## Other formats
- **Vertical**: capture with `--viewport mobile` and use the phone frame; one element per scene; copy above the phone.
  With a voiceover, keep the bottom 28% clear (`inset: { bottom: 0.28 }`).
- **Square**: crop to the feature's panel, not the whole window; copy in the top band. Bottom 18% clear with a voice.

## Voiceover or music only
- **Voiceover** (the template's default): about 8-9 lines, one per scene: hook, problem, name, three features, proof,
  CTA. Keep to the word budget in the job prompt. Each feature line says the feature's name; that word triggers its
  camera move (`cue.word(...)`). On screen: the labels only.
- **Music only**: one readable line per scene carries the story; fewer, shorter lines. Cut on beats and land the
  reveal and the end card on strong cues (the track's cue file).
- If the job prompt says there's no voiceover, there's none, whatever this template's default is.

## Done when
- [ ] At 1 s, the product's real result fills the frame with the hook line on screen.
- [ ] The name and logo are first presented in Meet it (the app's own header may show them earlier).
- [ ] Each of the three features shows an action and a visible result, each with its label.
- [ ] The proof is copied from the site or repo (its URL or file is in the plan), or it's a real detail.
- [ ] No scene longer than 8 s, a visible change every 3 s, no two transitions alike back to back.
- [ ] The URL is on screen, large and settled, for at least the last 2.5 s.
- [ ] With a voiceover, the voice tool's sync check passes and every label agrees with its line.
