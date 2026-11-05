# Recipe: a comparison

A range of commits between two refs (`base...head`: two tags, a branch against main, two commits) as a short video
about what changed between them. There's no title, description or author: the story comes from the commits and the
diff. For "what's new since the last release", a branch about to merge, or a week of work. Defaults when the job
doesn't say: 20 s, landscape, music only.

## Before planning

From `.hyped/change.json` and the code:

- **The two ends**: `base.ref` and `head.ref` as the link names them. If `head.ref` is a published tag (with
  `checkout: "git"`, `git ls-remote --tags origin <head.ref>` lists it), this is a
  release in all but name: read [release.md](release.md) and use the tag as the version, but only call it
  released if the brief or the project's changelog says so. If it's a branch, it's unreleased work: never "available".
- **What's in it**: the commit subjects, grouped by theme (a feature's several commits are one change). Pull request
  numbers in subjects ("Add bulk edit (#412)") point to the full story: that pull request's page is
  `github.com/<repo>/pull/<n>`, and with `checkout: "git"` its commit is in the history (`git show <sha>`).
- **What a user will feel**: one to three themes, chosen as in the release recipe (a new capability, then everyday
  changes, then fixes). Skip merges, version bumps, formatting, CI and dependency updates.
- **Each theme in the diff**: its files and hunks, so you show the real change.
- **A title**: the refs as people say them: `v2.0 → v2.1`, or *"What's new on main"* for a branch against its
  default. Never a version you made up.
- **Credit**: commits carry git names, not handles. Credit only when the brief asks, with the names as written; else
  none.
- **An empty diff** (`notes` says the head is already in the base): nothing changed between them. Make a short video
  about the project at the head instead, and say nothing is new.

## Beat sheet at 20 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Hook | 0-3 | 1 | The biggest change, working, with the range as a small chip (`v2.0 → v2.1`) |
| Change 1 | 3-11 | 2 | Before (at the base) and after (at the head), as in the pull request recipe |
| Change 2 or the list | 11-16 | 1 | A second change, or the other themes as short lines ticking in |
| Get it | 16-20 | 1 | The project, the range, and the repo or release page |

### The list (when there are many small changes)
- Up to five themes as short monospace lines, each the theme's name in the commits' terms (`bulk edit`,
  `faster CSV import`): never a pasted commit log. Each holds 0.3 s a word plus 0.5 s; the newest last.
- Under them, small: the commit count from `totals` ("38 commits"), only as supporting type.

### Get it
- A tag at the head: the upgrade command or the release page, as in the release recipe.
- A branch: the repo (`github.com/tally/board`), or the branch's pull request link if there is one. "Coming soon"
  only when the brief says so.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | Hook 0-3 · the one biggest change, before → after, 3-11 · Get it 11-15 |
| 30 s | Hook 0-3 · What the project is 3-6 · Change 1 6-15 · Change 2 15-22 · the list 22-25 · Get it 25-30 |
| 60 s and longer | the release recipe's shapes, with themes in place of the notes' entries |

## Done when

- [ ] Every change shown is in the commits and the diff between `base.sha` and the head.
- [ ] Nothing on a branch is called released or available.
- [ ] Themes are named in the commits' terms; no commit hashes or merge subjects on screen.
- [ ] No credit unless the brief asks, and then names exactly as git recorded them.
