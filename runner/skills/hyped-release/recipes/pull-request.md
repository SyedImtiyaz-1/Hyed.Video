# Recipe: a pull request

One pull request as a short video: what it changes, shown working against how it was, with its number and author.
For the team announcing a merge, a contributor sharing their work, or a maintainer adding a video to the thread.
Defaults when the job doesn't say: 20 s, landscape, music only.

## Before planning

From `.hyped/change.json` and the code, settle and write into The change in `brag-plan.md`:

- **What it does for a user**, in one sentence, from the body. If the body is empty, from the README or docs change in
  the diff, then the tests, then the commit subjects.
- **The kind** (SKILL.md's table): a UI feature, behaviour, API, CLI, fix, performance or internal.
- **The state**: `merged`, `open`, `draft` or `closed`. It decides the words and the call to action.
- **The before and after you'll use**: the app run at `base.sha` and at the head, the body's `media`, or the diff.
  Pull requests that change UI often carry a "Before | After" table of screenshots: check `media` first, it's the
  cheapest real before.
- **The credit**: `#<number> by @<author>`, unless the author is a bot.

## Beat sheet at 20 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Hook | 0-3 | 1 | The change already working, with its name and the pull request chip |
| Before | 3-7 | 1 | How it was, muted, with one line saying what was wrong |
| After | 7-15 | 2 | The change in use: the trigger, then the result, held |
| Credit and get it | 15-20 | 1 | The project, the credit, and where to get it |

### Hook (0-3 s)
- **Screen**: the after state, cropped to where the change is and filling the frame (a captured page through the
  camera, the PR's after screenshot in a window, or the editor with the new call and its result). Something moves
  from the first frame.
- **Copy**: the change's name in user words (at most 6 words) and a small chip: `#412` with the state word when it
  helps (`Merged`). The project's name small, as context: `Tallyboard`.
- **Out**: the colour drains from the frame and it becomes the Before, or a wipe reveals the Before underneath.

### Before (3-7 s)
- **Screen**: the same view at the base, muted. For code, the removed lines, dimmed. For a fix, the symptom the body
  describes (the error message as quoted, the broken layout in the PR's screenshot).
- **Copy**: one line, at most 7 words, in the body's terms: *"Editing rows meant one at a time."* Never worse than
  the body says.
- **Out**: the switch on a strong cue: a wipe in the accent colour at the place that changed, or a slider dragged
  across a matched before and after.

### After (7-15 s, two scenes)
- **Scene A, the trigger**: what the user does: the click, the typed command, the new option set. Camera marks on
  real elements (cursor clicks, typing), or the new code typing in.
- **Scene B, the result**: what's different, close enough to read on a phone, then a hold of at least 2 s. A label of
  at most 5 words pinned to the result: *"All 30 rows updated"* (only what's visible).
- **For a code change**: Scene A is the new call or config in the editor, Scene B its output or effect (a test
  passing that the PR added, the README example's output).

### Credit and get it (15-20 s)
- **Screen**: the project's logo and name, the change's name, `#412 by @mira-k`, and the call to action from
  SKILL.md's table for the state: `Merged · tallyboard.app`, or `In review · github.com/tally/board/pull/412`.
  The after may stay behind, dimmed and blurred. Settled by 15.5 s.
- **Sound**: land the call to action on a strong cue; fade the music over the last 1.5 s.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | Hook 0-3 · Before → after in one scene (a slider or wipe across matched frames) 3-11 · Credit and get it 11-15 |
| 30 s | Hook 0-3 · What the project is (one line over its real UI) 3-6 · Before 6-11 · After 11-23 (trigger, result, then one detail: an option, an edge case the tests cover) · Credit and get it 23-30 |
| 60 s | Hook 0-4 · The project 4-9 · The problem in the body's words, over the before 9-16 · The change in the code (the key hunk, highlighted) 16-24 · After in use 24-44 · A second use or detail 44-52 · Credit and get it 52-60 |
| 90 s | As 60 s, with two or three uses in the After and the test the pull request added, run, as the detail |

## By state

- **Merged**: "Merged" and the date are facts you may show. "Available in vX.Y" only when release notes or the brief
  say which release has it.
- **Open or draft**: it's a proposal. "In review" or "Draft", the pull request link as the call to action, nothing
  that says it's live.
- **Closed without merging**: say "Proposed" if you must say anything; never "shipped" or "added".

## Voiceover or music only

- **Music only** (the default): the chip, the before line, the after label and the end card tell it all, each held
  0.3 s a word plus 0.5 s.
- **Voiceover**: four or five lines. *"New in Tallyboard: bulk edit."* / *"Until now, you changed rows one at a
  time."* / *"Now select them all and change them at once."* / *"Pull request four twelve, by mira k."* with
  `"show": "#412 by @mira-k"`. Labels agree with the lines.

## Other formats

- **Vertical and portrait**: before above, after below, or the after sliding up over the before. Crop the UI to the
  changed panel; diffs reflowed to the format's line width or cut to the changed lines.
- **Square**: the format guide's two-up compare for the switch, or a slider across one matched frame.

## Done when

- [ ] At 1 s the change is on screen, working, with its name and `#number`.
- [ ] The before is the base (run, the PR's screenshot, or removed lines), matched to the after and muted.
- [ ] The after shows a trigger and a readable result, held at least 2 s.
- [ ] State words and the call to action match `state`.
- [ ] The credit is `#number by @author` as GitHub writes it, or nothing for a bot.
