# Walkthrough

Shows how the product works, step by step, in its real UI. Template defaults: 90 s, landscape, tone `polished`,
composed music, the voice Cole (warm), made for the homepage, docs and YouTube.

## Goal and audience

Someone who already wants the product, or is close, and wants to see the first job done before they try it. After
watching, they know the steps, where each button is, and what they'll end up with.

Before the storyboard, write in the plan:

- **The job**: the first thing a new user does, as one sentence with a result ("Publish a shared roadmap from your
  notes"). From the site's how-it-works section, the docs' quickstart or the onboarding flow.
- **The steps**: three or four, each one screen and one to three actions, each with its title in the UI's words.
- **Where each step's screens come from** (see "Where the steps come from" in the SKILL.md): the capture or image per
  screen, and the element ids for every shot and mark (from page.json and elements.jpg).
- **The result**: the finished thing as its audience sees it (the public roadmap, the sent invoice).

## Beat sheet (90 s, four steps)

**0-6 s · Goal** (1 scene)
- On screen: the finished result in the real UI, in the browser frame, with the goal as the one headline and a chip
  "4 steps". Example (invented): Mossboard's finished roadmap, "Turn your notes into a shared roadmap."
- Camera: `{ at: 0, on: "window" }`, then a shot on the result's most telling element at about 2.5 s.
- Voice `01`: the goal and the promise of steps: "In four steps, turn your notes into a roadmap your team can see."
  (13 words: about 5 s for Cole).
- Out: dip through the background to the empty starting screen. Sound: the composed bed starts quietly.

**6-75 s · Steps** (four steps of about 17 s, each a chapter of 2-3 scenes)

Every step follows the same pattern, so the viewer learns the rhythm:

| Part | Time in the step | On screen | Camera and marks |
|---|---|---|---|
| Title | 0-2 s | the counter advances ("2 / 4"), the step title lands next to it: "Paste your notes" | shot on the area the step happens in |
| Action | 2-11 s | the actions, one at a time: the cursor glides in and clicks; typed text plays | shot on each element as it's named; `cursor` with `click: true`; `type` (from `--type`); `ring` with `dim: 0.3` on the field being used |
| Response | 11-15 s | the product's response appears: the new card, the generated plan, the toast | shot on the new element; a short `label` ("Grouped by theme") beside it |
| Hold | 15-17 s | the step's result, still; the voice says why it matters | no move; `drift: 0.01` |

- Layout: the landscape guide's "Full-bleed product". The whole window only as up to 2.5 s of context at a step's
  start, then shots on the part in use.
- Copy: the counter and title as the layout's kicker chip (top-left of the text-safe box), unchanged through the
  step. Labels are 2-4 words, the UI's own terms. No other text.
- Voice: 2-3 lines per step, one action per sentence: `04` "Paste your notes into the box." `05` "Click Organise.
  Mossboard groups them into themes." `06` "Each theme becomes a lane, so you can see the whole plan."
- Between steps: the browser frame stays; the page inside changes. A click that navigates slides the next capture in;
  a new screen dissolves quickly through the background.
- Sound: a soft click from `.hyped/audio/sfx/ui/` on the most important click of each step only (3-4 in all); never
  the same file twice in a row.

**75-85 s · Result** (2 scenes)
- On screen: the finished thing, whole: the camera pulls back to `window`, then the result as its audience sees it
  (the shared page in a second browser frame or a phone). The four step titles light up in order as a small recap,
  0.4 s apart.
- Voice: what they have now, plainly: "That's a roadmap your whole team can open, built from the notes you had."
- Sound: one soft impact from `.hyped/audio/sfx/impact/` as the full result settles.

**85-90 s · CTA** (1 scene)
- Logo, name and the address, large: "Try it yourself at mossboard.app". Settled by 85.5 s and held.
- Voice: "Try it with your own notes at mossboard dot app." (`show`: "mossboard.app"). The bed resolves under it.

## Scaling

With the template, the job prompt gives the beats scaled to the length; fill them like this. With no template there
are no beats in the job prompt: use the times in the SKILL.md's story shapes, which give short videos a longer goal
and end card.

| Length | Goal | Steps | Result | CTA | Steps and scenes |
|---|---|---|---|---|---|
| 15 s | 0-1 | 1-12.5 | 12.5-14.2 | 14.2-15 | the goal sits on the first step's screen; two steps, one action each; the address joins the result at about 13 s |
| 20 s | 0-1.3 | 1.3-16.7 | 16.7-18.9 | 18.9-20 | the goal on the first step's screen; three steps, one action each, no Hold part; the address joins the result at about 17.5 s |
| 30 s | 0-2 | 2-25 | 25-28.3 | 28.3-30 | three steps of about 7.5 s: Title, one action, Response |
| 60 s | 0-4 | 4-50 | 50-56.7 | 56.7-60 | three steps of about 15 s, two scenes each |
| 90 s | 0-6 | 6-75 | 75-85 | 85-90 | as above |

Under 30 s the CTA beat gets short: let the result flow into the end card so the address is up for at least 2 s.

## Voiceover vs music only

- **Voiceover** (default): Cole says about 2.5 words a second, roughly 180 words for 90 s; the job prompt gives the
  budget. 12-16 short lines. The voice is the clock: every shot and mark takes its time from
  `cue.word(<line>, <word>).start - 0.1`. Use the format guide's camera inset for a voiceover (landscape
  `{ bottom: 0.18 }`).
- **Music only**: each action gets an instruction line in a band above the browser frame ("Click Organise"), held
  0.3 s a word plus half a second after the action lands. The composed bed carries more: a gentle change at each step.

## Other formats

- **Vertical**: capture with `--viewport mobile` and use the vertical guide's "Full-bleed product" layout, the counter
  and title as its kicker chip. If the product has no phone layout, a laptop capture at `--scale 3`, one panel at a
  time; never the whole window.
- **Square**: the square guide's "Full-bleed zoomed UI", the counter and title as its kicker chip; shots on one panel
  at a time.

## Done when

- [ ] One workflow, three or four steps, each titled in the UI's own words, with the counter in a fixed place.
- [ ] Every screen change has a visible cause (a click or typing), and every mark sits on a captured element.
- [ ] Each step's result is held at least 1.5 s; no camera move while the viewer reads.
- [ ] The Result shows the finished thing whole; the CTA address is large and held at least 2 s.
- [ ] Narrated: the sync check passes, with what each line names on screen while it's said.
