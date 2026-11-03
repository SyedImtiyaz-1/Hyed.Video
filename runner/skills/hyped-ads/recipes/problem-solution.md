# Problem → Solution

A short ad that starts with the pain. Template defaults: 30 s, vertical, tone `default`, library music, the voice Leo
(energetic), made for Reels, Shorts, TikTok and Meta ads. Template rule: the product's name is said and its logo is on
screen within the first 5 seconds.

## Goal and audience

People who have the pain and have never heard of the product. When it ends they think "that's my problem, and that
fixes it", and they know the name and where to go.

Before the storyboard, write these four in the plan's angle, each with where it came from on the site:

- **The pain**: one situation, in the customer's words (the hero, a "problem" section, the FAQ).
- **The cost**: what that situation costs in time, money or stress, as the site states it. If the site states no
  figure, the cost is shown as a situation (a calendar block at 11 pm), never as a number you made up.
- **The fix moment**: the one action in the product that ends the pain, and the screen that shows it's ended.
- **The proof**: a number, result or short quote from the site, word for word. If there is none, the proof is the
  finished result itself, shown big.

## Beat sheet (30 s)

**0-3 s · Pain** (1 scene)
- On screen: the situation, built in HTML and kept generic (a group chat filling with swap requests, a crumpled
  spreadsheet), with the pain line big over it: the format guide's big-type card, the mess dimmed behind. Line and
  visual are settled at frame 0: it's the poster.
- Copy: `[moment]. [pain].` "Sunday, 11 pm. Rota still blank." At most 6 words.
- Motion: the mess moves under the line: bubbles keep arriving, cells flicker red. No camera move on the line.
- The peek, about 2.2-2.8 s: the logo and name ("Shiftnest fixes this.") rise into the lower part of the text-safe
  box on a card holding a glimpse of the product's real result screen (a small camera.js view, its own element,
  `on` the result). The product is on screen by second 3, as the core hook rule asks, and the name lands well inside
  the template's 5 seconds. The card's text is a small label, not a second headline.
- Out: a hard cut on a beat. Sound: the music starts at a strong cue; one soft impact as the peek lands.

**3-9 s · Cost** (2 scenes, 3 s each)
- On screen: two faces of the same cost, one per scene (texts at midnight; a double-booked Saturday). The peek card
  shrinks into a small logo tag at the top-left of the text-safe box (the top-right is where the free plan's mark
  goes), and the tag stays until the end card.
- Copy: short and concrete: "Three swaps. Two no-shows." Count only what's visible in the scene.
- Motion: elements pile up one by one; the second scene slides in from below like the next post in a feed.
- Out: a push into the product. Sound: no effect.

**9-20 s · Fix** (3 scenes, about 3.5 s each)
- On screen: the real product, captured with `node .hyped/capture.mjs <url> brag-output/work/capture/<name>
  --viewport mobile`, shown full-bleed through camera.js in the vertical guide's "Headline over the product" layout
  (with its camera inset). Three moments of one job: start, key action, result.
- Copy: verb-first labels, using the product's own words: "Drag your team in." / "Tap Publish." / "Everyone's
  notified."
- Camera and marks: scene 1 `{ on: "window" }`, then a shot on the field or list the job starts in. Scene 2 a shot
  on the main button, a `cursor` mark with `click: true` on it, and a `ring` with `dim: 0.35` on what changed. If
  the job starts by typing, capture with `--type "<text>"` and play it with a `type` mark. Scene 3 a shot on the
  result element with a short `label`.
- Out: camera moves inside one capture between scenes 1 and 2; a dip through the accent colour into the result.
- Sound: one UI click from `.hyped/audio/sfx/ui/` on the key click only.

**20-26 s · Proof** (1-2 scenes)
- In order of preference: (1) a number from the site, counting up to its exact value ("4,000 cafés" only if the site
  says 4,000 cafés); (2) a short quote from the site, with the name and role as the site gives them; (3) the result
  big, with a factual label: "Next week: sorted."
- Camera: a slow push on the result behind the number. Out: a push or slide into the end card.

**26-30 s · CTA** (1 scene)
- On screen: logo, name, the address large (the format guide's end card), one verb: "Try it → shiftnest.app".
  Settled by 26.5 s.
- No camera move. The music resolves and fades over the last 1.5 s.

## Scaling

The job prompt gives the beats scaled to the length. Fill them like this:

| Length | Pain | Cost | Fix | Proof | CTA | What changes |
|---|---|---|---|---|---|---|
| 15 s | 0-1.5 | 1.5-4.5 | 4.5-10 | 10-13 | 13-15 | the peek lands at about 1.2 s, under the pain line; one Cost scene; two Fix moments (action, result); Proof is the result held |
| 20 s | 0-2 | 2-6 | 6-13 | 13-17 | 17-20 | one Cost scene; three quick Fix moments |
| 30 s | 0-3 | 3-9 | 9-20 | 20-26 | 26-30 | as above |
| 60 s | 0-6 | 6-18 | 18-40 | 40-52 | 52-60 | Pain in two scenes (the moment, then the line); four or five Fix moments of the same job; Proof can pair a number with the result |
| 90 s | 0-9 | 9-27 | 27-60 | 60-78 | 78-90 | add a second situation with the same pain and fix it the same way. Never a feature tour |

## Voiceover (default: Leo)

- Leo says about 1.9 words a second: roughly 45 words for 30 s. The job prompt gives the exact budget.
- One line per scene, 4-9 words, said like a person, not a narrator. The name is in line 1 or 2.
- Example (Shiftnest, invented, 30 s, 44 words):
  `01` "Sunday night, and the rota's still blank?" · `02` "Shiftnest builds it for you." · `03` "No more swap texts at
  midnight." · `04` "Drag your team in." · `05` "Set who works when." · `06` "Tap publish, and everyone gets their
  shifts." · `07` the site's proof line, as written · `08` "Try it at shiftnest dot app." (`show`: "shiftnest.app")
- Headlines are the short form of each line: line 01 shows "Rota still blank?".
- Time every Fix mark to its word: the click starts at `cue.word("06", "publish").start - 0.15`.
- Keep the vertical guide's camera insets (bottom 0.35): they clear the captions as well as the feed's caption.

## Music only

If the customer turned the voice off, the headlines carry the story: one per scene, cut on strong cues, the logo and
name as text by second 5. Add one more Cost word or Fix label rather than a second line.

## Other formats

- **Portrait**: the portrait guide's "Headline band and UI" for the Fix, the mobile capture full-bleed below the band
  when the site has a good phone layout; the Pain as a "Big-type card" or the mess filling the frame under its line.
- **Square**: the square guide's "Headline band and UI" layout, with the camera on one panel of a laptop capture at
  `--scale 3`, or the mobile capture full-bleed. Never the whole laptop window for more than a 1.5 s establishing beat.
- **Landscape**: the landscape guide's "Split: text left, UI right" for the Fix, the line in the column and the
  product on the right. The Pain scene can split the same way: the line on the left, the mess on the right.

## Done when

- [ ] Frame 0 shows the pain line and the mess, settled, and it's the poster.
- [ ] The product's real screen is on screen by 3 s (the peek); name and logo by 5 s (and spoken by then, when
      narrated).
- [ ] One pain throughout. Every Fix scene is the captured product, with a cursor click or typing showing the action.
- [ ] Proof is the site's exact words or numbers, or the finished result.
- [ ] The headlines alone tell the story with the sound off.
- [ ] Nothing sits under the feed's buttons or captions; the end card uses the format guide's sizes and holds 2-3 s.
