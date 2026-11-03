---
name: hyped-dev
description: Use when the job prompt names /hyped-dev (or $hyped-dev) - a video for developers made from a code repo, such as a README loop, a release or changelog video, a CLI or library demo. Shows real code, real commands and real terminal output, and ends on something a developer can copy (an install command, the repo). Holds the recipe for Hyped's README Loop template and the shapes for repo videos with no template. Builds on the core skill `hyped`.
---

# Hyped dev

Read ../hyped/SKILL.md first, then the format guide for the job's format (../hyped/formats/<format>.md). Then read the
recipe for the job's template, or the one for the kind of video (see Recipes below). The job prompt wins over all of
them.

## What a developer video must do

Developers judge a tool by its interface: the command, the API, the output. They distrust adjectives and trust what
they can see run. The video works when a developer watching once knows what to type, what they get back, and where to
get it, and believes all three.

- **The real thing, truthfully.** Real commands from the README, real code from the repo, real output from running it
  (or from the repo's own recordings). Nothing on screen a developer couldn't reproduce.
- **Readable code.** Few lines, big type, the line that matters highlighted. Never a wall of code as texture.
- **A copyable ending.** The install command or the repo, exactly as the README writes it.

| | Dev (`hyped-dev`) | Launch (`hyped-launch`) | Explain (`hyped-explain`) |
|---|---|---|---|
| Hero screen | terminal, editor, the output | the product's UI | the product's UI, step by step |
| Proof | it runs, on screen | a result or number from the site | the workflow completed |
| Copy | dry, exact, monospace for code | headlines | step titles |
| Ending | `npm i …`, the repo URL | the web address | the web address |

## The repo, and what to show

| Repo kind | Hero scene | Where the real material is |
|---|---|---|
| CLI | the terminal: the command typed, its real output | README usage, `--help`, inputs in `tests/fixtures` or `examples/`, `.cast` recordings |
| Library or SDK | an editor with the snippet, its result beside it | README examples, `examples/`, tests; run the snippet for its output |
| App or site in the repo | the running UI, captured | run it in the background, capture localhost with capture.mjs, stop it |
| Visual output (diagrams, charts, UI kits) | the output big, with the code that made it | `examples/` and their rendered output, the docs site |

If the input is a website (a dev tool's homepage or docs), the same rules hold: capture its docs and playground, and
take commands and output from its docs, word for word.

Running the project's own commands, for real output:

- Only documented commands that finish in about two minutes: `--help`, `--version`, a README example on a fixture.
- Install inside the workspace only (a venv in `brag-output/work/`, the repo's own `npm install`). No sudo, no global
  installs, never a remote script piped into a shell. Never anything that needs keys, accounts, a GPU or docker.
- Run with colour on (`FORCE_COLOR=1`, or the tool's `--color=always`) and keep the raw output in `work/` as the
  source for the scene.
- If it can't run, use output the repo itself shows (README, docs, test snapshots, a `.cast` recording), word for
  word. If there is none, show the command and its visible effect (a file appears, a page renders) without output, or
  output marked "example output" in the frame and in the plan, containing no numbers.

## Story shapes (no template)

| Length | Beats (seconds) | Scenes |
|---|---|---|
| 15 s | Command 0-3 · Result 3-11 · Install 11-15 (or a README Loop if the job is silent) | 3 |
| 20 s | Hook: command and result 0-4 · Name and one line 4-7 · A second use 7-15 · Install 15-20 | 4-5 |
| 30 s | Hook 0-4 · Name 4-8 · Two or three uses 8-24 · Install and repo 24-30 | 6-7 |
| 60 s | Hook 0-4 · The problem in code 4-12 · Install 12-17 · Three or four uses 17-48 · The detail devs remember 48-54 · Install and repo 54-60 | 11-14 |
| 90 s | as 60 s, with a worked example (init → configure → run → result) in place of separate uses, plus one integration (CI, an editor, a framework) | 15-18 |

- Each use is one command or one snippet and its result, in one scene of 4-8 s.
- "The detail devs remember" is something the repo proves: a real config file, the plugin API, the test suite
  passing (if you ran it), the licence. Never a speed claim the repo doesn't publish.

## Hook formulas

Every example is an invented project.

| Formula | Example | Use when |
|---|---|---|
| The command is the hook | `$ quillfmt README.md` types in the first second; a ragged Markdown table snaps into columns | the one-liner is the product |
| Output first | a chart fills the frame, then the three lines of `gridwren plot sales.csv --by month` that made it | the output is visual |
| Before and after code | 30 lines of hand-written retry logic collapse into `queue.add(job, { retries: 3 })` (pebblequeue) | the library replaces code people write by hand; the "before" is a fair, short version you write, labelled "by hand", never a strawman |
| The familiar error | `row 4 has 3 cells, expected 4`, then the tool fixing it | the README says the tool fixes exactly that |
| The one call | `await pebblequeue.add("email", data)` and the job appears in a live list | a small API surface |
| N lines | "A job queue in 6 lines." with the 6 lines, counted on screen | the README's example really is that long |
| The version | `v3.0` next to the headline change, already working | a release (the changelog recipe) |

Calls to action: the install command exactly as the README writes it (`npm i pebblequeue`, `pip install gridwren`,
`brew install quillfmt`); check the package name in the manifest, since it often differs from the repo name. Add the
repo (`github.com/owner/repo`) when it's public, and the docs or playground URL if there is one. In monospace, on one
line, the `$` dimmed and outside the copyable text, straight quotes, no wrapping, no ellipsis.

## Copy rules

- Headlines: at most 6 words, plain and factual, a little dry. One claim per scene, and the scene shows it.
- Names exactly as the project writes them (`quillfmt`, not "Quillfmt"); flags, functions and file names in
  monospace, exactly as in the code. Every function, flag and option shown must exist in the repo (search for it).
- Banned, on top of the core list: "blazing fast", "lightning", "10x", "magic", "powerful", "robust", "next-gen",
  "cutting-edge", "developer experience", "just", "simply", and "zero-config", "production-ready", "battle-tested",
  "AI-powered" unless the README says so.
- Numbers only from the repo (README, a benchmarks folder, the changelog), with the source on screen in small type
  ("from benchmarks/README.md"). Never stars, downloads, "used by" logos or timings from your own run as a claim.
- **With a voiceover**: the voice says what happens; the screen shows the exact text. Write commands the way they're
  said (`"text": "pip install grid wren"`) with the exact spelling in `"show"`. Never read flags out character by
  character.
- **Music only**: short labels above the terminal or editor ("Renamed copies, found."), never paragraphs.

## Showing code and terminals

| | Landscape 1920×1080 | Vertical 1080×1920 | Square 1080×1080 | Portrait 1080×1350 |
|---|---|---|---|---|
| Code and terminal text | 32-40 px | 34-36 px | 32-34 px | 32-34 px |
| Visible lines at most | 14, or 10 under a headline | 16, or 10 under a headline | 12, or 9 under a headline | 16, or 12 under a headline |
| Characters per line at most | 64 | 38 | 44 | 43 |
| Window | 1400-1690 px wide, inside the text-safe box | the text-safe box's width (840 px) or a little wider | the text-safe box's width (928 px) | the text-safe box's width (908 px) |
| Install command on the end card | 56-72 px (about 30 characters fit at 72 px) | 44-52 px (about 26 characters at 52 px) | 44-52 px (about 30 characters at 52 px) | 44-52 px (about 29 characters at 52 px) |

- **Font**: the project's own monospace (its docs or playground CSS), else download JetBrains Mono or IBM Plex Mono
  into `work/fonts/`. `white-space: pre`, line height 1.5, ligatures off. Never shrink the type to fit a whole file:
  show fewer lines, and mark cuts with a dim `…` line.
- **Colours**: the project's own code theme (its docs' highlighter CSS, its playground's editor theme), else this
  neutral dark one: background `#101319`, window `#171B23`, text `#E4E8EE`, comments `#7A8494`, strings `#9FD8A4`,
  numbers `#F5C46B`, functions `#8EB8FF`, keywords in the brand accent if it reads on the window (else `#F29B8C`).
  Diffs: added lines on `rgba(111,208,140,0.16)` with `+`, removed on `rgba(255,138,128,0.16)` with `-`; never colour
  alone. Highlight with a library installed in `work/` or by hand for short snippets, and check every token in stills.
- **The line that matters**: when it's named, give it an accent bar and dim the rest to 50%. Style the line's own
  element; never a box at guessed coordinates. To zoom, scale your own live HTML towards the line's measured box
  (`getBoundingClientRect` at load); the text stays sharp. Captured pages still go through camera.js.
- **Typing**: per character at 15-20 characters a second with a seeded jitter, a beat longer after spaces, 0.3-0.5 s
  before Enter. The caret is solid while typing and blinks once a second when idle, as a function of t (steady in a
  README loop). Commands over about 40 characters appear at once, as a paste.
- **Output**: the first line within 0.3 s of Enter, then line by line, a few frames apart. Programs don't type their
  output. Convert ANSI colours to spans; strip cursor codes; for `\r` progress bars show each line's final state or
  replay the redraws in time. A `.cast` recording replays with its own timing, compressed.
- **Clean, not edited**: replace the workspace path, user and host in prompts with `~/project $`; trim irrelevant
  lines with a dim `…`. Never change what the tool printed, and never show tokens, keys or environment variables.

## A README loop (silent, seamless, small)

Read [recipes/readme-loop.md](recipes/readme-loop.md). In short: the first and last frames are the same "home" frame
(which is also the poster), nothing depends on sound (no voice, no music, a silent AAC track), no end card, and the
file stays under 5 MB.

## Recipes

| Template or kind | Read |
|---|---|
| README Loop (`readme-loop`) | [recipes/readme-loop.md](recipes/readme-loop.md) |
| No template, about a release (a version in the brief's "What's new", a fresh top entry in the changelog, a new tag) | [recipes/changelog.md](recipes/changelog.md) |
| No template, anything else | the story shapes above; build the hook's command → result scene the way [recipes/readme-loop.md](recipes/readme-loop.md) builds its Command and Result, without the loop |

## Common failures

| Failure | Fix |
|---|---|
| A small terminal in a big empty frame | the window as wide as the table above says; zoom to the output that matters |
| An empty terminal after Enter | output starts within 0.3 s |
| A headline clipped at the frame's top edge | the format guide's safe zone; check the first and last still of every scene |
| Invented output, timings or benchmark numbers | real output, the repo's own recordings, or "example output" with no numbers |
| The wrong install command (the repo's name, an unpublished package) | the README's command, checked against the manifest; else the repo URL |
| A wall of code at 18 px | at most 14 lines (landscape) at 32 px or more |
| Raw `[32m` escape codes, misaligned output columns | convert ANSI to spans; monospace with `white-space: pre` |
| Floating code, matrix rain, glowing brackets | the real terminal, editor and output, nothing decorative |
| The container's paths, user names or secrets on screen | `~/project $`; never print the environment |
| Hype copy | one dry, exact claim per scene, shown |
