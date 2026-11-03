# Tools: what's in `.hyped/`

The render server puts these next to the project. Read each tool's header comment before using it: it's the full
manual, and it's always current.

## `.hyped/capture.mjs`: real pages, measured

```bash
node .hyped/capture.mjs <url> brag-output/work/capture/<name> [--viewport laptop|desktop|mobile|WxH] [--type "<text>"]
```

- Saves `page.png` (the whole page, sharp at 2x, 3x for mobile), `page.json` (every heading, button, link, field,
  badge, image, card and section with an id, its text and its exact box) and `elements.jpg` (the ids drawn on the
  page: look at it to choose ids). It prints the main ids.
- `--type "<text>"` films typing into the page's main field (repeatable; `"<css selector>=<text>"` for another
  field), for the camera's typing marks.
- `--viewport mobile` captures the phone layout (390×844), for vertical videos. `--scheme dark|light` forces a colour
  scheme. `--wait <ms>` gives slow pages longer.
- Works on any URL, including a local dev server you started (`http://localhost:3000/app`).

## `.hyped/camera.js`: a camera over a captured page

```html
<script src=".hyped/camera.js"></script>
<script>
  const shot = HypedCamera.create(sceneEl, capture, { base: "capture/home/", accent: "#C8F135", inset: { bottom: 0.2 },
    shots: [{ at: 1.0, on: "window" }, { at: 3.1, on: "button-start-free" }],
    marks: [{ at: 3.3, until: 5.0, ring: "button-start-free", dim: 0.35 }, { at: 4.2, cursor: "button-start-free", click: true }] });
  await shot.ready;           // before the first frame
  shot.render(t);             // on every frame
</script>
```

- Frames the page in a browser window (or a phone), moves between elements (by id, by exact text, a list framed
  together, a box, or `"window"`), scrolls the page, and pins **rings**, **typing**, **cursor clicks** and **labels**
  to the real elements, so they stay on target whatever the camera does.
- Shots: `at` (start the move 0-0.2 s before the word or beat that names the target), `on`, and optionally `pad`,
  `zoom`, `move` (seconds), `ease`, `drift` (push-in while holding), `scroll`.
- `inset` keeps targets clear of burned-in captions: `{ bottom: 0.18 }` landscape and square, `0.24` portrait,
  `0.28` vertical, when the video has a voiceover.
- It never zooms past the capture's sharpness. If you need to go closer on something small, capture again at
  `--scale 3`.

## `.hyped/captions.js`: timing scenes to a voiceover

With a voiceover, `HypedCaptions.cues(captionsJson)` gives each spoken line's and word's time on the final timeline:
`cue.line("03")`, `cue.word("03", "export").start`. Start a visual change 0-0.2 s before its word. The captions
themselves are added after you render, so pages draw none. The job prompt gives the voice steps and commands.

## `.hyped/audio/`: music and sound effects

`README.md` there lists the music tracks (moods, tempo, length, beat and cue files) and the sound effects (with
`sfx-analysis.md` saying which are soft and which are harsh). See [sound.md](sound.md). The job prompt names the
track to use when it's picked for you.

## Also installed

Node 22, headless Chromium (Playwright's build, at `$PLAYWRIGHT_BROWSERS_PATH`), ffmpeg and ffprobe, Python 3 with
NumPy, git, and the fonts Inter and Noto Color Emoji. To script the browser yourself, install the matching library in
your work folder (`npm i playwright@1.55.0` in `brag-output/work/`); it finds the installed Chromium. The network
reaches the customer's site and the public web.
