# README Loop

A silent loop for a GitHub README or a docs page: the project's first action, typed out, and its result, playing
forever. Template defaults: 15 s, landscape, tone `app-store`, no music, no voice, made for GitHub and docs. Template
rule: it plays silently on a loop: no voice, no music and no text that depends on sound, and the last frame matches
the first.

## Goal and audience

A developer skimming a README decides in seconds whether this is what they need. The loop answers "what happens when I
run it?" before they read a paragraph. It doesn't sell: they're already on the repo.

Two exceptions to the core skill, because a loop has no ending:

- **No end card.** No URL, logo sting or call to action at the end; the README around it does that job.
- **The poster is the home frame.** Frame 0 is the "home" frame below, so brag.jpg is frame 0. Never put a different
  frame there: it would flash on every loop.

## The home frame

Design it first. It's frame 0, the frame the loop returns to, and the poster.

- The window, centred, 1400-1690 px wide (landscape) inside the text-safe box: a terminal (title bar
  `zsh — ~/project`, the prompt `~/project $` and a caret), an editor with the file tab, or the app in a browser
  frame.
- Optionally a header above it: the project's name in its own casing and the README's one-line description, at about
  60% of headline size, with the logo if the repo has one. It never moves, so it never breaks the seam.
- The caret is a steady block. A blinking caret makes the last frame differ from the first.
- Background: the project's colour, else the neutral dark from the SKILL.md.

## Beat sheet (15 s)

**0-4 s · Command**
- 0-0.6 s: the home frame, still.
- 0.6-3.0 s: the command types: the shortest command from the README's usage that produces the best result. Keep it
  under about 40 characters so it types rather than pastes: `quillfmt README.md`. 15-20 characters a second with a
  seeded jitter.
- 3.0-3.4 s: a pause, then Enter at 3.4 s.
- Copy: nothing but the command (and the still header). Camera: none. Sound: none.

**4-12 s · Result**
- The first output line by 3.7 s, then the rest line by line, as the tool printed it (real output, colours from its
  ANSI codes). At most 14 lines in the window; trim the middle of long output with a dim `…` line.
- About 6.5 s: the line that matters (the result, the summary) gets the accent bar and the rest dims to 50%.
- About 7-7.8 s: optionally scale the window towards that line's measured box, then hold to about 11.5 s.
- Visual output (a chart, a diagram, a page): a second window slides in beside or over the terminal at about 6 s,
  showing the real rendered result, and holds.
- Sound: none.

**12-15 s · Loop**
- 12-12.8 s: the scale eases back to exactly the home framing (same scale, same position); the highlight fades.
- 12.8-13.6 s: the output leaves the way a terminal clears: the lines slide up and out of the window (or fade over
  0.4 s), and any second window slides back out the way it came.
- 13.6-15 s: the home frame, still, identical to frame 0.

## Variants

- **Library**: an editor window with a short file open. The Command beat types the key line (or the snippet) into it;
  a Run button click or a `⌘↵` hint runs it; the Result beat slides up an output pane with what running it really
  printed or rendered. The Loop deletes the typed text quickly, like undo, back to the home file.
- **App**: run it in the background, capture it with capture.mjs (with `--type "<text>"` for the first action), stop
  the server. Through camera.js, the first and last shots are both `{ on: "window", drift: 0 }`; every mark has an
  `until` that ends before the Loop beat, so the page returns to its captured, untouched state.

## Scaling

The job prompt gives the beats scaled to the length.

| Length | Command | Result | Loop | What changes |
|---|---|---|---|---|
| 15 s | 0-4 | 4-12 | 12-15 | as above |
| 20 s | 0-5.3 | 5.3-16 | 16-20 | a slightly longer command, or a flag added after a short pause; the Result holds longer on the key line |
| 30 s | 0-8 | 8-24 | 24-30 | two commands in the Command beat (`quillfmt --check docs/`, then `quillfmt docs/`), each with its short output; the Result is the payoff of the second |
| 60-90 s | scaled | scaled | scaled | long for a README: a short session of three to five commands, each with its output. Add commands, never slow holds |

## Render and check

Silent, but with an audio track, since the runner expects AAC. Encode small:

```
ffmpeg -y -framerate 30 -i <frames>/%05d.png -f lavfi -i anullsrc=r=48000:cl=stereo -shortest \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 32k -movflags +faststart brag-output/brag.mp4
```

- Size: under 5 MB. If it's over, raise the CRF towards 28 before anything else. Never over 10 MB, the largest video
  GitHub accepts in a README on a free account.
- No music.txt and no captions.srt.
- If the job prompt gives a voice or music anyway, the job wins: keep the seam, put nothing important only in the
  sound, and fade the audio in over the first 0.3 s and out over the last 0.5 s so the loop point doesn't jar.
- **The seam**: render one extra frame at t = the length (not part of the video) and compare it with frame 0. Then
  compare the encoded video's first and last frames:

```
ffmpeg -i <frame 0>.png -i <frame at t = length>.png -lavfi psnr -f null -      # must say inf
ffmpeg -y -i brag-output/brag.mp4 -frames:v 1 brag-output/work/first.png
ffmpeg -y -sseof -0.5 -i brag-output/brag.mp4 -update 1 brag-output/work/last.png
ffmpeg -i brag-output/work/first.png -i brag-output/work/last.png -lavfi psnr -f null -   # 40 dB or more
```

  If either fails, something is still moving at the end or hasn't returned home.

## Other formats

- **Square**: the window takes more of the height; at most 12 lines.
- **Vertical** (rare for READMEs): the window full width; a command under 30 characters; output reflowed to 38
  characters a line, or the key lines only.

## Done when

- [ ] Frame 0 is the home frame and the poster; rendering at t = length gives exactly frame 0.
- [ ] The encoded first and last frames match (40 dB or more).
- [ ] Silent: no voice, no music, no effects; a silent AAC track.
- [ ] The command is the README's own, typed; the output is real or the repo's own recording.
- [ ] No end card, no call to action, no text that needs sound.
- [ ] brag.mp4 is under 5 MB.
