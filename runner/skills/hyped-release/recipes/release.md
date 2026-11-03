# Recipe: a release

A tagged release as a short video: the version, the one to three changes a user will feel, each shown working, and
how to upgrade. For the release page, the project's socials and its changelog. Defaults when the job doesn't say:
30 s, landscape, music only. For a library or CLI, hyped-dev's [changelog recipe](../../hyped-dev/recipes/changelog.md)
has the beat-by-beat craft for terminals, version badges and upgrade cards: use it with what this recipe adds.

## Before planning

From `.hyped/change.json` and the code:

- **The version**: `tag` exactly as tagged (`v2.4.0` or `2.4.0`); the release's name (`title`) only if it's more than
  the tag ("2.4: Bulk edit"). `state` `prerelease` means a beta or release candidate: say so.
- **What's in it**: the release notes (`body`). They usually group changes under headings (Features, Fixes,
  Breaking changes) or list pull requests ("Add bulk edit by @mira-k in #412"). If the notes are empty or only a
  compare link, use the commit subjects and the diff, grouped by theme.
- **What it's compared with**: `previousTag`. With none, this is the project's first release: there's no diff, and
  the video introduces the whole project as it is at this tag (the shapes in ../../hyped-launch/SKILL.md fit), with the
  version as its hook.
- **The changes to show**: one to three a user will feel, in this order: a new capability, a change to everyday
  commands or screens, then speed (only with the notes' own numbers), then user-facing fixes. Skip dependency bumps,
  CI, refactors and docs-only entries. For each, find it in the diff (its pull request number in the notes, then its
  files) so you show the real thing.
- **Breaking changes**: only what the notes call breaking, in their words.
- **How to upgrade**: the install command from the README with this version, the package name from the manifest
  (`package.json`, `pyproject.toml`, `Cargo.toml`), checked against the tag; for an app, where it's downloaded.
- **Credit**: who the notes name, as written. `author` is whoever published the release; never credit a bot.

## Beat sheet at 30 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Version | 0-4 | 1 | The version badge over the headline change already working |
| Change 1 | 4-13 | 1-2 | The headline change: before, then after, in use |
| Change 2 | 13-20 | 1 | A second change, the same way, shorter |
| Change 3 or fixes | 20-25 | 1 | A third change, or up to three user-facing fixes ticking in |
| Upgrade | 25-30 | 1 | The upgrade command or download, the release page, the credit |

### Version (0-4 s)
- **Screen**: the headline change in use (the new screen, the terminal mid-output, the editor with the new call), with
  the project's name and the version badge over it. By second 3 the change is readable.
- **Copy**: `Tallyboard 2.4` and the headline change in at most 4 words. "Pre-release" or the project's word for it
  beside the badge when `state` is `prerelease`.
- **Motion**: the badge lands first, then shrinks to a tag at the top-left of the text-safe box and stays.

### Change 1 (4-13 s)
- **Before**, 2-3 s: the same view at `previousTag` (the app run at `base.sha`, a screenshot from the notes, or the
  removed lines), muted, with one line on what was missing.
- **After**, 5-6 s: the change in use, in full colour: the trigger, the result, a hold. A label of at most 5 words.
- **Out**: a slide to the next change, on a beat.

### Change 2 (13-20 s)
- The same pattern, with the before cut to a second or dropped. An API change reads as the old call struck through
  above the new one typing in, both from the diff.

### Change 3 or fixes (20-25 s)
- A third change, or up to three fixes from the notes as short lines ticking in one by one, in the notes' words
  shortened only by cutting (`fixed: tables with emoji widths`). Each held 0.3 s a word plus 0.5 s.

### Upgrade (25-30 s)
- **Screen**: the upgrade command large and copyable (`npm i tallyboard@2.4.0`), or for an app the download place;
  then the release page (`github.com/tally/board/releases`). If the notes list a breaking change, one small line
  in their words. Credit small: `Thanks to @mira-k, @deshawn and @ola` when the notes name them, or the count the
  notes give. Settled by 25.5 s, held to the end.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | Version 0-3 · the one headline change, before → after, 3-11 · Upgrade 11-15 |
| 20 s | Version 0-3 · Change 1 3-11 · Change 2 11-15 · Upgrade 15-20 |
| 60 s | Version 0-4 · What the project is 4-9 · three or four changes, about 10 s each 9-46 · Breaking changes and migration (old → new, from the notes) or the fixes 46-53 · Upgrade 53-60 |
| 90 s | As 60 s with five or six changes, then a recap of their names 74-82, and Upgrade 82-90 |

## Voiceover or music only

- **Music only**: one label per scene; land the badge and the upgrade command on strong cues.
- **Voiceover**: the version said the way people say it (*"Tallyboard two point four"*, `"show": "Tallyboard 2.4"`);
  one line per change saying what it does; the voice gives the why, the screen shows the change's name.

## Other formats

- **Vertical and portrait**: the badge at the top, each change's before and after stacked; terminals full width with
  short commands.
- **Square**: one change per scene; the two-up compare for before and after.

## Done when

- [ ] The version is the real tag; every change shown is in the notes or the diff between `previousTag` and `tag`.
- [ ] Each change is shown in use, with a real before, never only described.
- [ ] Breaking changes, if any, are in the notes' words.
- [ ] The upgrade command is exact (the manifest's package name, the tag's version), or the download place is real.
- [ ] Credit is only the handles the notes name, as written; no bot.
- [ ] A first release (no `previousTag`) introduces the project, with no "new" claims about parts of it.
