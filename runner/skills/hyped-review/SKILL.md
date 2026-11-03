---
name: hyped-review
description: Hyped's critic for a finished product video. The core skill's loop (hyped) runs it after rendering brag-output/brag.mp4 and before delivering - measure the file, look at contact sheets of what is really in the frames, score it against a fixed rubric with hard fails, fix what fails (two rounds at most), and write brag-output/review.json. Use it directly only to review a brag.mp4 that already exists.
---

# Hyped review

You've rendered `brag-output/brag.mp4` and baked in the poster. Before you deliver, review it like a strict editor who
has never seen your code: judge only what's in the file (its frames, its sound, its numbers), never what a scene page
was meant to do. Then fix what fails, so a weak video doesn't ship.

The review is five steps: **measure → look → score → fix → write `review.json`**. One pass costs about 3 minutes: one
command, 5-8 images, one JSON file. A fix round costs a re-render on top.

## 1. Measure

Run this skill's tool from the workspace root (the same file is in `.agents/skills/hyped-review/scripts/` for Codex):

```bash
node .claude/skills/hyped-review/scripts/review.mjs measure brag-output/brag.mp4 \
  --size 1920x1080 --length 20 --scenes 0,3,6.5,11,15.5,20 [--voiceover] [--loop]
```

| Option | Value |
|---|---|
| `--size` | the job's frame size: landscape `1920x1080`, vertical `1080x1920`, square `1080x1080`, portrait `1080x1350` |
| `--length` | the job's requested length in seconds |
| `--scenes` | every scene's start from `brag-plan.md`'s storyboard, then the video's end. Use the real times if they moved while you built |
| `--voiceover` | the video has a voiceover: draws the caption band, allows 15% on the length |
| `--loop` | a README Loop: checks the seam, skips the opening-motion check |
| `--safe x0,y0,x1,y1` | only when the tool says it has no text-safe box for this frame size: the box from the format guide |

It writes `brag-output/work/review/measure.json` and contact sheets beside it, and prints a summary that ends with
**FLAGS**, each tagged with the criterion it affects or `HARD <id>`. It takes under a minute for a 90-second video.

| It measures | How | Flags when |
|---|---|---|
| Frame size, fps, pixel format, codecs, length, file size | ffprobe | not the job's size; not 30 fps, yuv420p, H.264 + AAC; length off by more than 10% (15% with a voiceover) |
| Loudness | ffmpeg `ebur128` | integrated outside -14 ±2 LUFS; true peak above -1 dBTP; last 0.4 s less than 10 LU under the mix (no fade-out); a silent gap of 1 s or more |
| Frozen stretches | ffmpeg `freezedetect` (the average pixel changes by less than 0.1%) | still for the first 1 s or more; still longer than the format allows (landscape 3 s, square and portrait 2.5 s, vertical 2 s); 5 s or more (hard) |
| Blank and black frames | edge density per frame (`edgedetect` + `signalstats`): only background, at most a tiny label | frame 0 blank; a blank stretch of 0.4 s or more; 1 s or more (hard); ending on blank |
| The poster | PSNR between `brag.jpg` and frame 0 | not full size; under 30 dB (it isn't baked in) |
| The loop seam (`--loop`) | PSNR between the first and last frames | under 40 dB |

A flag is evidence, not a verdict: confirm it on the sheets. The measured hard fails (`wrong-size`, `missing-audio`,
`frozen`, `blank`) stand unless a scenario exception below covers them. If the tool itself fails, run the plain ffmpeg
commands in [references/measure.md](references/measure.md) instead.

## 2. Look

Open every sheet the summary lists. They're images: look at them, tile by tile. Tiles run left to right, top to
bottom, in the order the summary prints them.

| Sheet | Stills | Look for |
|---|---|---|
| `sheet-hook.jpg` | frame 0, 1 s, 1.5 s, 3 s | the product's real UI or result and the hook line, readable, early; frame 0 composed (it's the thumbnail) |
| `sheet-scenes*.jpg` | the middle of every scene | each scene's one idea, readable at phone size, inside the box, in the product's look; marks on target |
| `sheet-cuts*.jpg` | every scene boundary | a designed transition, not a muddy double exposure or a jump between still cards |
| `sheet-end.jpg` | 2.5, 2 and 1 s before the end, the last frame | the same settled end card in all four, the call to action large |
| `sheet-overview.jpg` | 12 evenly spaced (16 past 30 s) | the whole video at a glance: variety, pace, one identity, nothing off-brand |

- The hook, scene and end sheets are at **phone size** (landscape tiles 480×270, square 390×390, portrait 390×488,
  vertical 360×640): the format guide's phone check. If you have to squint at a line in its tile, it fails on a phone.
- The **magenta outline** is the format's text-safe box, drawn by the review, not in the video. With `--voiceover` its
  bottom edge is the top of the caption band, which must be empty: captions are burned in after you deliver.
- For detail (a font's shapes, a ring's alignment, small UI text), open the full-size still in
  `brag-output/work/review/stills/`.

Read these beside the sheets: `brag-plan.md` (what each scene should show and say, and where every claim came from);
the scenario recipe's **Done when** list; and with a voiceover, the voice tool's `frames` check (the job prompt gives
the command; run it now if you haven't) and its `check.jpg`.

For every scene still, answer:

1. What does it say, word for word? Is every number, quote, name, logo, version, date and feature in the plan's
   sources or the product's own UI? If not: `invented-claim`.
2. Is every line in the product's font (or Inter)? Compare with the capture's `page.png`. A default system font
   (DejaVu Sans: wide letters, big round dots, a tall x-height; a Times-like serif where the brand is sans), missing-glyph
   boxes or black-and-white emoji: `fallback-font`.
3. Does every line read in the phone-size tile, against its background, and stay on screen for 0.3 s a word plus
   0.5 s (check the storyboard's text against the scene's length)?
4. Is everything the viewer must read inside the box, clear of the caption band, not cut by the frame's edge, not
   overlapping something else?
5. Does the product fill most of the frame, and do rings, cursors, typed text and labels sit on their elements?

Then the **stranger test**, from the sheets alone (and the script with a voiceover): write one line each for what
the product does, who it's for and how to get it. Anything you can't write from the frames isn't in the video.

## 3. Score

Score each criterion **0, 1 or 2** with the definitions in [references/rubric.md](references/rubric.md). In short:

| id | Weight | 2 means |
|---|---|---|
| `hook` | 12 | real UI or result and the hook line readable at frame 0 and settled by 1.5 s (1 s in vertical, square and portrait); moving within 1 s |
| `clarity` | 12 | a stranger can say what it does, who it's for and how to get it, from the frames alone |
| `real-material` | 12 | the product's own screens, copy, colours and fonts; every claim in the plan's sources |
| `readability` | 10 | every line reads at phone size, at the format's sizes, with contrast, for its reading time |
| `layout` | 8 | text inside the safe box, clear of the caption band; no overlaps or cut-offs; the product fills 60% or more |
| `motion` | 10 | no still stretch over the format's limit; no dead blank moment; designed transitions; no scene over 8 s |
| `camera` | 6 | marks on their elements, moves land on what's named, zooms sharp (`null` with no captured pages) |
| `sound` | 8 | the job's sound; -14 ±2 LUFS, peaks under -1 dBTP, fades out; or silent by design |
| `end-card` | 8 | the call to action large, settled and held 2 s or more on the last frame |
| `technical` | 6 | exact size, 30 fps, yuv420p, H.264 + AAC, length in tolerance, poster baked in as frame 0 |
| `scenario` | 8 | every item of the recipe's Done when list (or the scenario's story shape) passes |

**Hard fails** stop the video from passing whatever its score: `wrong-size`, `missing-audio`, `frozen`, `blank`,
`fallback-font`, `invented-claim`, `unsafe-text`, `no-cta`, `secret-on-screen` (definitions in the rubric).

The score is out of 100: each criterion counts `weight × score / 2`, over the criteria that apply, scaled to 100. The
video **passes** with no hard fails, no criterion at 0 and a score of 80 or more. The tool computes both (step 5).

Be strict. Score what's in the stills, not what you intended; between 1 and 2, it's 1. Every score under 2 gets a note
saying what's wrong and where (the time or the scene).

## 4. Fix

If the video didn't pass, fix it; if it passed with 1s that are cheap to fix, fix those too.

1. **Order**: hard fails first, then criteria at 0, then 1s by weight.
2. **Fix at the source**: the scene page, the storyboard's timing, the capture, the mix. Never patch the picture with
   ffmpeg filters (the core's Never list). ffmpeg only re-encodes, re-mixes and re-muxes.
3. **Re-render only what changed** if your build renders scenes separately, then join, add the audio and bake the
   poster in again.
4. **Review again**: measure (with the new `--scenes` if timing moved), look at the sheets for the scenes you changed
   plus the hook and end sheets, and score again. With a voiceover, rerun the `frames` check if timing moved.

At most **two fix rounds** (three reviews in all), and every command still finishes in a few minutes. Skip a fix that
would take longer (re-capturing a site, rebuilding a whole scene type) and record it as remaining. After the second
fix round, deliver what you have, passed or not, and say honestly what's left.

| Finding | Usual fix |
|---|---|
| Still first second, or a still stretch | start the first entrance or the typing at 0.1-0.3 s; give the stretch its action (the product in use, a camera move, a line arriving); or shorten the scene |
| Frame 0 blank or a logo | frame 0 is the hook frame, settled: no fade from black, no logo card first |
| Muddy transition | stagger it: old content out, then new content in (build.md's Transitions) |
| Text outside the box or under the caption band | move or shrink the layout to the format guide's geometry; the camera's `inset` for captured pages |
| Small text | the format guide's type scale; crop closer (a camera shot on the element, `--scale 3` captures) |
| Fallback font | fix the `@font-face` path or family name, await `document.fonts.ready`; use Inter if the file won't load |
| End card short or moving | everything in before the hold starts; hold 2.5-3 s with only a slow push-in |
| `yuvj420p` | re-encode with `-pix_fmt yuv420p` ([references/measure.md](references/measure.md)), and add `-pix_fmt yuv420p` to your encode command |
| Not 30 fps | capture again at `t = n / 30` and encode with `-framerate 30`; re-encoding to 30 drops or doubles frames |
| Loudness or no fade-out | re-mix the audio (`afade` out over the last 1.5 s, then `loudnorm`) and re-mux with `-c:v copy` ([references/measure.md](references/measure.md)); with a voiceover, rerun the voice tool's `mix` |
| Poster isn't frame 0 | bake it in again (references/checks.md, "The poster") |

## 5. Write `brag-output/review.json`

After the last round, write the review in exactly this shape, then let the tool fill in and check the rest:

```json
{
  "version": 1,
  "rounds": 2,
  "hardFails": [],
  "criteria": [
    { "id": "hook", "score": 2, "note": "" },
    { "id": "clarity", "score": 2, "note": "" },
    { "id": "real-material", "score": 2, "note": "" },
    { "id": "readability", "score": 1, "note": "Scene 4 (9.2-12.2 s): terminal text is ~11 px in the phone tile." },
    { "id": "layout", "score": 2, "note": "" },
    { "id": "motion", "score": 2, "note": "" },
    { "id": "camera", "score": null, "note": "n/a: no captured pages; the terminal is the scene's own HTML." },
    { "id": "sound", "score": 2, "note": "" },
    { "id": "end-card", "score": 2, "note": "" },
    { "id": "technical", "score": 2, "note": "" },
    { "id": "scenario", "score": 2, "note": "" }
  ],
  "fixed": ["hook: typing starts at 0.2 s; it was still until 2.4 s."],
  "remaining": ["readability: terminal text in scene 4 is small at phone size."]
}
```

```bash
node .claude/skills/hyped-review/scripts/review.mjs score brag-output/review.json
```

| Field | Type | Meaning |
|---|---|---|
| `version` | `1` | the schema's version |
| `rounds` | 1, 2 or 3 | how many times you measured and scored the finished video (1 = no fix round) |
| `score` | 0-100 | filled in by the tool |
| `passed` | boolean | filled in by the tool: no hard fails, no criterion at 0, score ≥ 80 |
| `hardFails` | ids | the hard fails still true in the last round (fixed ones go in `fixed`) |
| `criteria` | 11 objects | `{ "id", "weight", "score", "max", "note" }`, every id from the table above, in that order; `score` 0-2, or `null` when it doesn't apply (the note says why); the tool fills `weight` and `max` (2) |
| `fixed` | sentences | what you changed between rounds, one per fix, starting with the criterion or hard fail id |
| `remaining` | sentences | what still falls short in the last round, one per issue, starting with its id; one for every hard fail left |
| `measured` | object | filled in by the tool from `measure.json`: size, fps, pixel format, codecs, length, bytes, loudness, true peak, longest still stretch, end hold, blank seconds, poster PSNR |

The tool rewrites the file in this shape, prints the score and whether it passed, and exits with an error listing
what's wrong if the file doesn't fit; fix those and run it again. The runner reads `review.json` into the job's result
and into the cost-measurement runs, so A/B runs can be compared: never inflate it. An honest 72 with clear `remaining` notes is worth more
than a padded 90.

## Scenario exceptions

The job prompt wins over the rubric: its length, format, sound and brief set the targets. Then apply what the
scenario skill and recipe say about themselves:

| Scenario | What changes in the review |
|---|---|
| `hyped-dev` README Loop | Measure with `--loop`. `end-card`: `null` (no end card) and `no-cta` doesn't apply. `sound`: a silent AAC track scores 2; `missing-audio` only means no audio stream. `clarity`: "how to get it" isn't needed (the README around it says). `hook`: frame 0 is the still home frame; the command types by 1 s. The still home holds at the start and end aren't `frozen`. `scenario`: the seam (40 dB or more) and the file under 5 MB |
| `hyped-dev`, any | Output is real, the repo's own recording, or labelled "example output" with no numbers; anything else is `invented-claim`. Prompts show `~/project $`, never the container's paths or environment |
| `hyped-launch` Teaser | `clarity`: what it does stays hidden on purpose; score the name, and when or where to get it. `real-material`: close crops of real UI, never the whole product. `end-card`: the last card settled for 3 s or more |
| `hyped-ads` | `hook`: frame 0 may be the pain (Problem → Solution) or the split (Before / After), the line settled at frame 0 with motion under it; the product's real UI is still on screen by 3 s and its name and logo by 5 s. The pain and the Before are generic HTML with no real brands: not `invented-claim` |
| `hyped-explain` | `motion`: a still hold of up to 4 s on a step's result is fine in landscape. The step counter and step titles are text to check against the box |
| `hyped-update` Social Proof | `invented-claim` covers every quote, name, role, photo, logo and number: each one in the plan's sources table, verbatim (cuts marked with "…") |
| No music | `sound`: silence or a few effects scores 2; the loudness target and the fade apply only when something is audible |
| Voiceover | `layout`: the caption band is empty. `technical`: 15% on the length. `scenario`: the `frames` check passes, and what each line names is on screen while it's said |
| Any other scenario skill | Apply any exception it states (no end card, silent, its own Done when) the same way: `null` the criterion that doesn't apply and say why in its note |

## Never

- Score a criterion from memory of the code. If you didn't see it in a still or a number, it isn't verified: look.
- Change the video to pass the tool (padding a still stretch with noise, trimming the end to dodge the end-card check).
  Fix what the viewer would see.
- Skip `review.json`. If time runs out mid-review, write what you have: the rounds done, your scores, `1` with the
  note "not checked" for any criterion you didn't get to, and what you didn't get to in `remaining`.
