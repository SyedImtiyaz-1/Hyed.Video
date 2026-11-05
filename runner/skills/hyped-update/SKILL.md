---
name: hyped-update
description: Use when the job prompt names /hyped-update (or $hyped-update) - a video about a new feature or release shown working, or about the results and praise a product has earned (real quotes, numbers, logos). Holds the recipes for Hyped's Feature Drop and Social Proof templates, and is the default for the video type "feature" when there's no template. Builds on the core skill `hyped`.
---

# Hyped: update

Read [../hyped/SKILL.md](../hyped/SKILL.md) first, then the format guide for the job's format
(`../hyped/formats/<format>.md`: landscape, vertical, square or portrait). This skill adds what an update video needs. The job
prompt still wins over both.

## What an update video does

It tells people what's new, or what others got from the product, and how to act on it now. Two kinds:

- **A feature or release** (Feature Drop, and every "feature" video): one change, shown working in the real UI,
  set against how it was before. A current user knows in seconds what changed and where to find it; a newcomer still
  sees what the product does.
- **Results and praise** (Social Proof): real quotes, numbers and logos from the site or project, and the product
  results behind them. The viewer sees that people like them got something real from it.

| Scenario | Differs how |
|---|---|
| hyped-launch | Introduces the whole product. An update skips the full intro: the product's name rides along as context ("Plotwise 2.4"), and the change or the proof is the hero |
| hyped-ads | Sells to strangers from a pain. An update reports, calmly and exactly, to people who may already care |
| hyped-explain | Teaches every step. An update shows the one trigger and the payoff |

## Before you plan

Add these to `brag-plan.md`, with the URL or file each came from:

- **What's new**: the brief's "What's new" first; else the newest entry in `CHANGELOG.md`, release notes, the site's
  changelog or blog, an announcement bar, or a "New" badge in the UI.
- **Is it really new?** Say "New" or show a version only when one of those sources says so. If nothing is marked new
  and the brief is silent, make it a spotlight: the same shape, without "New" and without a version.
- **The version**: from the changelog heading, a release tag, `package.json` or the site. Never make one up.
- **The before**: how it worked until now, in the product's own words ("Previously, …" in a changelog, the docs'
  manual steps) or the real UI without the feature. Never an old screen you haven't seen, never a competitor's.
- **How to get it**: "Live for everyone" only if a source says so; otherwise the update step, the menu path in the
  real UI (*Settings → Reminders*), the install command or the changelog URL.
- **For praise**: list every quote, name, role, logo and number the site or project shows, verbatim, with where each
  is. Use only that list. If it's empty, the video shows real results from the product instead.

## Story shapes by length

With a template, its recipe wins. Seconds on the final timeline; with a voiceover the voice is the clock.

**A feature or release** (the default for video type "feature"):

| Length | Scenes | Beats |
|---|---|---|
| 15 s | 4 | What's new 0-2.5 · Before 2.5-5.5 · After 5.5-12 · Try it 12-15 |
| 20 s | 5 | What's new 0-3 · Before 3-9 · After 9-16 (trigger, then result) · Try it 16-20 |
| 30 s | 6 | What's new 0-3 · Before 3-8 · After 8-24 (trigger, result, one detail) · Try it 24-30 |
| 60 s | 9-10 | What's new 0-4 · Before 4-13 · After 13-45 (setup, action, result, a second use, where it lives) · Why it matters 45-53 · Try it 53-60 |
| 90 s | 12-15 | A release: headline 0-5 · two to four changes, each a short before and after, 5-74 · recap 74-82 · Try it 82-90 |

**Results and praise** (details in [recipes/social-proof.md](recipes/social-proof.md)):

| Length | Scenes | Beats |
|---|---|---|
| 15 s | 4 | Headline 0-3 · one quote 3-9 · logos or one number 9-12 · CTA 12-15 |
| 20 s | 5 | Headline 0-3.5 · two quotes 3.5-13.5 · logos 13.5-16.5 · CTA 16.5-20 |
| 30 s | 5-6 | Headline 0-4 · two or three quotes 4-20 · logos 20-26 · CTA 26-30 |
| 60 s | 9-11 | Headline 0-5 · four or five quotes, each beside its product moment, 5-40 · numbers 40-48 · logos 48-54 · CTA 54-60 |
| 90 s | 12-14 | Headline 0-6 · three chapters (a quote, its product moment, a real result) 6-66 · numbers and logos 66-80 · CTA 80-90 |

What each feature beat shows:
- **What's new**: the feature's name (and "New" and the version, when sourced) over the feature already working,
  cropped close. Never a name on an empty background.
- **Before**: the old way, muted: the real UI without the feature, or the manual steps the product's own docs
  describe. One line saying what was wrong with it.
- **After**: the feature doing its job in the real UI, in full colour: the trigger (a click, a typed command), then
  the result, then a hold on the result. This is the longest beat.
- **Why it matters** (60 s and longer): the benefit the changelog or docs state, on the result it refers to.
- **Try it**: where to get it now, the product's name and logo, the URL or command, large and settled.

## Hooks

| Formula | Example (fictional product) | Use when |
|---|---|---|
| "New:" + the name | `New · Timeline view` chip over Plotwise's timeline, tasks sliding into place | Any sourced new feature (the default) |
| "You can now …" | *"You can now drag to reschedule."* as a task is dragged and its dependents follow | The change is a new ability, best said as a verb |
| The old way, crossed out | *"Export. Re-import. Fix dates."* struck through, then the timeline appears | The before is a tedious ritual users know |
| The version, big | `2.4` settles large, then cracks open on the new screen | A major release with a version people track |
| The result first | Glintdesk's reply already drafted beside the ticket; label *"AI replies"* | The feature's output is striking on its own |
| The headline number | *"18,000+ kitchens"* counting up over Mossbook's planner (the site says "18,000+") | Social proof with a real figure on the site |
| The best quote | *"I stopped re-typing recipes."* with the name and role the site gives | Social proof with a short, specific quote |

## Calls to action

| Pattern | Example | Use when |
|---|---|---|
| Where it is now | `Live now in Plotwise 2.4 · plotwise.app` | A source says it's live |
| The path | `Settings → Timeline` over the real menu, then the URL | It's switched on in the app |
| Update or install | `npm i kitecheck@2.4` | A CLI or library release |
| The changelog | `plotwise.app/changelog` | A release with several changes |
| Join them | `Join them · mossbook.co` | Social proof that showed real people |

## Copy

- **Length**: the feature's name exactly as the changelog writes it (at most 4 words), a line of at most 6 words with
  music only and a label of at most 5 with a voiceover. Quotes: see the social proof recipe.
- **Voice**: exact and calm. Name the change, show it, say where it is. Numbers as the source writes them.
- **Banned** (beyond the core list): "Big news", "We've been busy", "You asked, we listened" (unless the source says
  users asked), "our biggest update ever" (unless the source says it), "new and improved", "better than ever",
  "improved performance" with no measure, "and so much more", "customers love…", "rave reviews", "loved by
  thousands" (unless that number is on the site).
- **Music only**: the screen tells the whole story: the name, the before line, the after label, the try-it card.
- **With a voiceover**: the voice explains; on screen go the feature's name, short labels that agree with the line,
  and the URL. Never the spoken line in big type. The voice never speaks a customer's quote in the first person:
  it introduces the speaker and restates the quote's point in the third person; the card shows the quote itself.

## Recipes

| The job prompt says | Read |
|---|---|
| Template "Feature Drop" | [recipes/feature-drop.md](recipes/feature-drop.md) |
| Template "Social Proof" | [recipes/social-proof.md](recipes/social-proof.md) |
| No template, video type "feature" (the default) | [recipes/feature-drop.md](recipes/feature-drop.md), timed by the story shape above |
| No template, and the brief asks for results, reviews or testimonials | [recipes/social-proof.md](recipes/social-proof.md) |

## Common failures

| Failure | Fix |
|---|---|
| "New" or a version on something no source calls new | Check the changelog, release notes and site; otherwise make it a spotlight |
| A "before" screen invented to look worse | Use the real UI without the feature, or the steps the docs describe |
| The update turns into a full product tour | One change. The rest of the product is context, seen around it |
| The feature's name on an empty card at second 0 | The name lands over the feature already working |
| The feature shown small in the whole window | Crop to the feature's panel; zoom until its text reads on a phone |
| Try-it says "available now" without a source | Say how to get it (path, command, URL) instead |
| A quote reworded, shortened so it means more, or credited to the wrong person | Verbatim; cut only with "…" and never change its meaning; attribution as the site shows it |
| A testimonial, logo or number that isn't on the site or in the project | Never. With none, show real product results |
| A quote card with nothing moving | Pair each quote with the product moment it talks about, and animate the words in |
