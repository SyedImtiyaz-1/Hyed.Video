---
name: hyped-explain
description: Use when the job prompt names /hyped-explain (or $hyped-explain) - a demo or walkthrough that teaches how a product works, step by step, in its real UI, usually narrated. Holds the recipes for Hyped's Walkthrough and Founder Demo templates, and is the default for the video type "demo" when there's no template. Builds on the core skill `hyped`.
---

# Hyped explain

Read ../hyped/SKILL.md first, then the format guide for the job's format (../hyped/formats/<format>.md). Then read the
recipe for the job's template (see Recipes below). The job prompt wins over all of them.

## What an explainer must do

The viewer chose to watch: they're on the homepage, in the docs, on YouTube, or deciding whether to invest. They want
to know how it works. The video succeeds when, after one viewing, they could do the workflow themselves, and want to.

- **One workflow**, the one a new user does first, from an empty start to a result worth having.
- **Every step visible as cause and effect**: the cursor clicks or the text is typed, then the product responds.
  Nothing changes on screen without something causing it.
- **Calm pace.** The viewer reads instructions and watches the UI at the same time, so give them time: one action at a
  time, the result held before the next move.
- **The UI's own words.** If the button says "Publish", the voice and the label say "Publish".

| | Explain (`hyped-explain`) | Ads (`hyped-ads`) | Launch (`hyped-launch`) |
|---|---|---|---|
| Goal | they can do it | they stop and click | they know it exists |
| Opens on | the goal or the finished result | the pain | the best moment |
| Pace | one action every 2-4 s, held | a change every 1.5-2 s | about 3 s a scene |
| Text | step counter, step titles, UI labels | big lines | headlines |
| Sound | usually a voiceover over a quiet bed | must work muted | music, often a voice |

## Story shapes

With a template, the job prompt gives its beats scaled to the length, and the recipe fills them. With no template,
use these times and build each part as the Walkthrough recipe does.

| Length | Beats (seconds) | Scenes |
|---|---|---|
| 15 s | Goal 0-2 · two steps 2-11 (one action each) · Result 11-13 · CTA 13-15 | 4 |
| 20 s | Goal 0-2.5 · three steps 2.5-15 (one action each) · Result 15-17.5 · CTA 17.5-20 | 6 |
| 30 s | Goal 0-3 · three steps 3-23 (one or two actions each) · Result 23-27 · CTA 27-30 | 6-7 |
| 60 s | Goal 0-4 · three or four steps 4-50 · Result 50-57 · CTA 57-60 (or Founder Demo: Intro 0-5 · Demo 5-50 · Ask 50-60) | 10-14 |
| 90 s | Goal 0-6 · four steps 6-75 (two or three scenes each) · Result 75-85 · CTA 85-90 | 14-18 |

- No scene runs longer than about 8 s (the format guides say so, and at 60 s and over the job prompt does too). A
  step longer than that is a chapter of 2-3 scenes under one step title; a camera move to the next action starts a
  new scene.
- The step counter ("2 / 4") stays in the same place all video (the format guide's kicker spot, top-left of the
  text-safe box) and changes only at step boundaries.
- The hook rule still holds: by second 3 the real UI, or the result the viewer will get, is on screen with the goal.

## Where the steps come from

Decide this before the storyboard; it decides what you can show.

1. **A public part of the product** (a playground, a demo mode, the homepage's live widget, a free tool page):
   capture each state with capture.mjs. `--type "<text>"` films typing into the main field (`"<css selector>=<text>"`
   for another field). A click that opens a page is a `cursor` mark with `click: true`, then the next page's capture
   in the same browser frame.
2. **A repo you can run**: start the app in the background, capture each route on localhost, stop the server.
3. **The product's own screenshots and clips** (docs, the homepage, a demo video): when the steps live behind a
   login. Show each one big, in a browser or phone frame, and change screens on the step. You can't measure elements
   inside an image, so don't put a cursor or ring on it: put the step title and a label beside it instead.

Never sign up or sign in to reach screens, never rebuild screens you can't see, and never invent data for them.
Small illustrative text while using the product (a project name, a file name) is fine.

## Hook formulas

Every example is an invented product.

| Formula | Example | Use when |
|---|---|---|
| The goal | "Turn a spreadsheet into a signup form." (Formwell) | the default: a clear first job |
| The result first | the finished roadmap for 2 s, then "Here's how it's made." (Mossboard) | the end result looks good |
| The steps promise | "Three steps to a shared roadmap." with "1 / 3" already on screen | the workflow really is three or four steps |
| Who and what | "For event organisers: a signup form from your sheet." | founder demos; a narrow audience |
| The plain definition | "Ledgerleaf sends invoices from the timesheet you already keep." | deadpan; a product people can't picture yet |
| The question | "How does Mossboard turn notes into a plan?" | docs and YouTube, where people search the question |

Calls to action: "Try it yourself at formwell.app" (default), "Start free at formwell.app" (only if the site says
free), "Read the docs: docs.formwell.app" (when the docs are where people start), "Book a demo" (only if that's the
site's main button). The address is large and held at least 2 s.

## Copy rules

- **Step titles**: verb first, at most 5 words, using the UI's labels exactly: "Paste your sheet link", "Click
  Generate". Same case and spelling as on screen.
- **With a voiceover** (the default for both templates): the voice teaches, the screen shows. One action per spoken
  sentence, second person, present tense: "Click Generate. Formwell reads your columns and builds the form." Say why
  once per step, briefly: "so every answer lands back in your sheet." On screen: the step counter, the step title and
  small camera `label` marks on the elements; no big subtitles (captions are burned in low in the frame after the
  render, so use the format guide's camera inset for a voiceover).
- **Music only**: one instruction line per action, in a band above the UI, held for 0.3 s a word plus half a second
  after the action lands. Step titles a little larger, since nothing is spoken.
- Banned, on top of the core list: "simply", "just" (as in "just click"), "easily", "intuitive", "in this video",
  "let's dive in", "without further ado", "it's that easy", "as you can see", "magic", "in seconds" (unless it's
  shown happening in seconds).
- Never claim a time ("set up in two minutes") unless the site says it or the video shows it at real speed.

## Recipes

| Template in the job prompt | Read |
|---|---|
| Walkthrough (`walkthrough`) | [recipes/walkthrough.md](recipes/walkthrough.md) |
| Founder Demo (`founder-demo`) | [recipes/founder-demo.md](recipes/founder-demo.md) |
| No template (video type "demo", or the job names this skill) | [recipes/walkthrough.md](recipes/walkthrough.md), scaled to the length. Use [recipes/founder-demo.md](recipes/founder-demo.md) instead when the tone is `deadpan` or the brief mentions investors, YC or Show HN |

## Pace

- The cursor glides in (`move` 0.5-0.8 s), rests 0.2-0.3 s, then clicks. At most one click every 1.5 s.
- After an action, hold its result at least 1.5 s before the camera moves again, and longer if there's text to read.
- One camera move per action: to the element about to be used, starting 0-0.2 s before the word that names it.
- Typing plays at the `type` mark's default pace (about 13 characters a second); raise `cps` only for long text,
  never into a blur.
- Between steps, use one consistent transition: the browser frame stays put, the step counter advances, and the
  page inside changes (slide for navigation, a quick dissolve through the background for a new screen).

## Common failures

| Failure | Fix |
|---|---|
| A feature tour dressed as a walkthrough | one workflow; features only as the steps of it |
| Screens change with no click or typing before them | every state change has a visible cause |
| The cursor teleports, or clicks twice a second | glide from the previous spot (`from`), one click per 1.5 s at most |
| Tiny UI in a full browser window | a camera shot on the panel in use; capture at `--scale 3` for small UI |
| The camera moves while an instruction is being read | hold; move only between actions |
| The voice says "Settings" and Settings isn't on screen | time the shot to `cue.word(...)`; the sync check catches it |
| Step titles that rename UI ("Hit go" for a button labelled "Generate") | the UI's exact words |
| Login screens, loading spinners, cookie banners, dead waits | begin where the job begins; cut past any waiting |
| A ring or cursor on a screenshot image | marks only on captured pages; labels beside images |
| Steps of uneven weight (one 4 s, one 30 s) | rebalance, or split the long step into two |
| The result rushed at the end | the Result beat holds the finished thing, whole, for its full time |
