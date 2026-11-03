# Founder Demo

A candid demo: the product doing its main job, start to finish, explained plainly. Template defaults: 60 s,
landscape, tone `deadpan`, no music, the voice Cole (warm), made for YC applications, Show HN and investors. Template
rule: keep it plain and honest: no hype words, no stock visuals, just the product working.

## Goal and audience

Investors, other founders and technical early adopters. They've seen hundreds of polished launch videos and trust
none of them. They trust a product that visibly works. When it ends they know what it is, who it's for, that it
really does the job, and where to try it.

How it differs from a Walkthrough: no step counter and no teaching. One continuous job, told like a founder sharing
their screen, but cleaner: no fumbling, no loading, no dead air.

Before the storyboard, write in the plan:

- **The sentence**: what it is and who it's for, as plainly as possible: "Formwell turns a spreadsheet into a signup
  form, for people who run small events." (invented)
- **The job**: the one task that shows why it exists, from a realistic start to a result someone would use.
- **The moment**: the part of the job that's hard elsewhere and easy here. The demo slows down for it.
- **The honest facts**: status, price or availability, only as the site states them ("In beta", "Free for 100
  responses"). If the site says nothing, say nothing.

## Beat sheet (60 s)

**0-5 s · Intro** (1 scene)
- On screen: the product's real UI at its starting state, already big in a browser frame, with the name small at the
  top-left and the sentence as the only line of text. No logo animation, no title card.
- Camera: `{ at: 0, on: "window" }`, holding; `drift: 0.01`.
- Voice `01`: the sentence, at most 12 words for 5 s: "Formwell turns a spreadsheet into a signup form. For small
  events."
- Out: a plain cut, or a 0.3 s dissolve. Sound: none.

**5-50 s · Demo** (6-7 scenes of 5-8 s, one continuous job)

| Shot | About | On screen | Camera and marks |
|---|---|---|---|
| Start | 5-11 s | the realistic starting point: the input field, the empty project | shot on the input; `type` mark playing the capture's `--type` text |
| Do | 11-18 s | the main action | `cursor` glides to the button, `click: true`; shot follows to where the response appears |
| Response | 18-25 s | the product's output appearing | shot on the output; one `ring`, no label |
| The moment | 25-35 s (two shots) | the hard-elsewhere part, slowed down: the edit that updates live, the conflict it resolves | a tighter shot (`zoom` or a small target), then the change it makes; hold while the voice explains |
| Use it | 35-43 s | the output as its user meets it: the form a guest fills in, the page a client opens | the next capture, a phone frame if that's how it's used |
| Payoff | 43-50 s | back where the job started, now done: Formwell's response list filling in | shot on the changed element; `ring` with `dim: 0.3` |

- Copy: almost none. A tiny phase word top-left if it helps ("paste", "generate", "share"), lowercase, the UI's own
  words. No headlines, no labels with adjectives.
- Voice: plain first-person plural, as the team would say it: "We read the column names and build a field for each."
  Short sentences, one per action, explaining what's happening and why it matters. Never "I'm" plus a name, never a
  founder backstory, never traction you weren't given.
- Motion: slower than other scenarios. Camera moves of 1.2-2 s, `drift` 0.01 or 0, the cursor at a human pace. Cuts
  between captures are plain cuts or 0.3 s dissolves; the browser frame never moves.
- Skipping waits: if the real product would take time, cut past it plainly. Never fake a progress bar or a timer.
- Sound: silence under the voice. At most two soft clicks from `.hyped/audio/sfx/ui/`, or none.

**50-60 s · Ask** (1 scene)
- On screen: the name, the address large, and one plain line: "Try it at formwell.app." Under it, small, the
  site's own status or price line if there is one. Settled by 50.5 s and held to the end.
- Voice: "It's live at formwell dot app. Try it with one of your own sheets." (`show`: "formwell.app")
- No camera move, no flourish.

## Scaling

With the template, the job prompt gives the beats scaled to the length. With no template, use the SKILL.md's 60 s
Founder Demo shape scaled the same way.

| Length | Intro | Demo | Ask | What changes |
|---|---|---|---|---|
| 15 s | 0-1.25 | 1.25-12.5 | 12.5-15 | the sentence sits over the first shot; Demo is Do and Response only |
| 20 s | 0-1.7 | 1.7-16.7 | 16.7-20 | Demo is Start, Do, Response |
| 30 s | 0-2.5 | 2.5-25 | 25-30 | Demo drops "Use it"; the moment gets one shot |
| 60 s | 0-5 | 5-50 | 50-60 | as above |
| 90 s | 0-7.5 | 7.5-75 | 75-90 | 9-11 shots: the same job, plus one real variation that matters (a second input type, a setting people ask about). Still one job |

Under 30 s the intro is too short to stand alone: put the sentence over the first demo shot from frame 0.

## Voiceover vs music only

- **Voiceover** (default): Cole says about 2.5 words a second, roughly 120 words for 60 s; the job prompt gives the
  budget. 8-10 lines. Every shot starts on the word that names it: `cue.word("03", "Generate").start - 0.1`. Pass
  `inset: { bottom: 0.18 }` to camera.js for the captions.
- **No voice**: the demo has to explain itself. Add a short plain line per shot in a band above the browser frame
  ("Paste a sheet link."), held 0.3 s a word plus half a second. Still no music unless the job gives one.

## Other formats

- **Vertical**: a `--viewport mobile` capture in the vertical guide's "Full-bleed product" layout if the product works
  on phones; otherwise one panel at a time from a laptop capture at `--scale 3`, the sentence above it.
- **Square**: the square guide's "Full-bleed zoomed UI", with tighter shots; the sentence as a kicker above.

## Done when

- [ ] The real UI is on screen from frame 0 with the plain sentence; no logo or title card first.
- [ ] One job, start to finish, in the real UI; every change caused by a visible click or typing.
- [ ] No hype words, no stock visuals, no music unless the job gives some, no invented status or traction.
- [ ] The moment that's hard elsewhere gets the most time.
- [ ] The Ask shows the address large for the whole beat, and never less than 2.5 s.
