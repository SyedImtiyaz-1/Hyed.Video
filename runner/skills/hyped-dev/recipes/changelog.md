# Changelog

A release video for developers: what changed in this version, shown working, and how to upgrade. There's no Hyped
template for it yet. Use it when hyped-dev runs with no template and the job is about a release: the brief's "What's
new" names a version or a change, or the repo has a fresh top entry in its changelog. (A Feature Drop job goes to
hyped-update, which owns that template.)

Defaults when the job doesn't say: 30 s, landscape, for X, the GitHub release page and the project's changelog page.
Music is the job's choice; there's no voice unless the job gives one.

## Goal and audience

People who already use the project, or follow it. They want to know, in one viewing: is this release worth
upgrading for, what does the new thing look like in use, and what do I type? Newcomers should still get what the
project is from the first scene.

## Material

- **The release**: the top entry of `CHANGELOG.md`, `HISTORY.md`, `docs/changelog*` or `RELEASES.md`; the GitHub
  release notes for public repos (`github.com/<owner>/<repo>/releases`); the version in the manifest (`package.json`,
  `pyproject.toml`, `Cargo.toml`); the brief's "What's new". Use the version exactly as tagged (`v2.4.0` or `2.4.0`).
- **Each change in code**: find it: the new flag in the CLI's argument parser, the new function in `src/`, its docs
  page, its test. Run it on a fixture if you can (the SKILL.md's rules for running commands).
- **History**: the clone is shallow. For a public repo, `git fetch --deepen 50` gets enough history to `git show` a
  change's diff. Private repos arrive without history: use the changelog and the code as they are.
- **Breaking changes and migration notes**: only what the changelog says, in its words.

Pick the one to three changes a user will feel: a new capability first, then a change to everyday commands or calls,
then speed only with the project's own published numbers, then user-facing fixes. Skip refactors, dependency bumps,
CI and docs-only changes.

## Beat sheet (30 s)

**0-4 s · Version** (1 scene)
- On screen: the headline change already working (the terminal mid-output, or the new UI), with the version badge
  and the change's name over it. Example (invented): `quillfmt 2.4` and "`--watch` is here." By second 3 the real
  output is visible, per the core hook rule.
- Copy: `[name] [version]` plus the change in at most 4 words.
- Motion: the badge lands first; at about 3 s it shrinks to a tag at the top-left of the text-safe box (the
  top-right is where the free plan's mark goes) and stays for the whole video.
- Out: a push into the terminal. Sound: a soft impact as the badge lands, if there's music.

**4-12 s · Change 1** (1-2 scenes)
- On screen: the headline change in use: the command typed with the new flag, or the new call in the editor, and its
  real output or result.
- Copy: what it does, in at most 6 words: "Reformats on every save." The new flag or function is highlighted in the
  command with an accent underline as it's typed.
- Marks: the line that matters gets the accent bar; scale your own HTML towards it and hold 2 s.
- Out: a slide to the next change. Sound: soft keys from `.hyped/audio/sfx/keyboard/` under the first typed command
  only, well below the music.

**12-19 s · Change 2** (1 scene)
- A second change, the same pattern. For an API change, show before and after: the old call above, dimmed and struck
  through, the new call typing in below it. Both exactly as the changelog or the docs give them.

**19-24 s · Change 3 or fixes** (1 scene)
- A third change in the same pattern, or up to three user-facing fixes from the changelog, ticking in one at a time
  as short monospace lines: `fixed: tables with emoji widths`. Each one held 0.3 s a word plus half a second.
- Out: a push into the upgrade card.

**24-30 s · Upgrade** (1 scene)
- On screen: the upgrade command, large, monospace, copyable: `npm i quillfmt@2.4.0` (the README's install command
  with the version). If the changelog lists a breaking change, one small line: "Breaking: `--fix` is now `--write`."
  Then the repo or changelog URL. Settled by 24.5 s and held, the format guide's end-card sizes for a command.
- Camera: none. Sound: the music resolves on a strong cue and fades over the last 1.5 s.

## Scaling

| Length | Beats | What changes |
|---|---|---|
| 15 s | Version 0-3 · the one change 3-11 · Upgrade 11-15 | one change only, the headline one |
| 20 s | Version 0-3 · Change 1 3-10 · Change 2 10-15 · Upgrade 15-20 | two changes |
| 30 s | as above | up to three changes, or two and the fixes |
| 60 s | Version 0-4 · three or four changes 4-46 (about 10 s each: what it is, in use, result) · Migration 46-53 · Upgrade 53-60 | a migration snippet (old → new) if anything breaks; else the fixes list |
| 90 s | as 60 s, plus a worked example 46-70 that uses the new pieces together (init → run → result) | the Migration and Upgrade beats move to the end |

## Voiceover vs music only

- **Music only** (default): labels carry the story, one per scene, above the terminal or editor. Cut on the track's
  beats; land the version badge and the upgrade command on strong cues.
- **Voiceover**: the voice names the version the way it's said ("Quill format two point four adds watch mode"), with
  `"show": "quillfmt 2.4 adds --watch"` for the captions. The new flag or call is highlighted on the word that names
  it. Keep labels to the change's name; the voice gives the why.

## Other formats

- **Vertical**: the badge at the top, the terminal full width, commands short, output reflowed to 38 characters a
  line or cut to the key lines. Before and after stack vertically.
- **Square**: the same as landscape with at most 12 lines in the window; before and after stack vertically.

## Done when

- [ ] The version is the real tag; every change shown is in the changelog or the release notes.
- [ ] Every change is shown in use, with real output or the repo's own example, never described in a headline alone.
- [ ] Breaking changes, if any, are stated in the changelog's words.
- [ ] The upgrade command is exact (the package name from the manifest, the version from the tag) and held at
      least 2.5 s.
- [ ] No speed or size claim unless the project publishes the number, shown with its source.
