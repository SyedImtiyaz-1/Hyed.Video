# Recipe: Social Proof (`social-proof`)

Shows results and what people say, for LinkedIn, X and the homepage. Default: 30 s, square, polished tone, library
music, a warm voiceover. The viewer is weighing whether the product works for people like them; the video answers
with evidence, not adjectives. The job prompt may call it a launch video (the template's video type): follow this
recipe's shape anyway.

**The template's rule is absolute**: only quotes, names, logos and numbers that appear on the website or in the
project. Never invent or improve a testimonial or a statistic. If there are none, show real results from the
product instead (see "No quotes" below).

## First: the sources table

Before the storyboard, put a table in `brag-plan.md`: every quote (verbatim), its name, role and company as shown,
its photo or logo if shown beside it, every number with its exact wording ("18,000+ kitchens"), and every customer
logo, each with the URL or file it's on. Look in the testimonials section, "Wall of love", case studies, pricing
page badges, the README ("Used by", badges), and docs. Pick from this table only.

Choosing quotes: specific beats glowing. *"I stopped re-typing recipes."* beats *"Amazing tool, highly recommend!"*
Prefer quotes that name a result or a feature you can show, from people whose role matches the brief's audience.

## Beat sheet at 30 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Headline | 0-4 | 1 | The headline number or result |
| Quotes | 4-20 | 2-3 | Two or three real quotes or results, each on its own card |
| Logos | 20-26 | 1 | Customer logos or usage numbers |
| CTA | 26-30 | 1 | Call to action with the web address |

### Headline (0-4 s)
- **Screen**: the camera on the real element the number comes from (the site's stats band, a badge) or on the
  product's main screen; the number lifts out large in the accent colour and counts up to exactly the stated figure,
  ending by 1.5 s.
- **Copy**: the number and what it counts, worded as the source words it, at most 6 words. *"18,000+ kitchens plan
  with Mossbook"* (only because the site says "18,000+ kitchens").
- **Camera**: `{ at: 0, on: "<stats element id>" }`, a `ring` on it at 0.3 s, then out to the product screen at about
  2.5 s so the viewer sees what the number is about.
- **Out**: the first quote card slides up over the frame.
- **Sound**: music from frame 0; a soft `impact/impactSoft_medium_002.ogg` as the count stops.

### Quotes (4-20 s: three cards of about 5.3 s, or two of 8 s)
- **Screen**: one quote per card, in the product's fonts and colours: large quote text, a quote mark in the accent,
  and the attribution below (name, role, company exactly as shown; the photo or company logo only if the site shows
  it beside the quote, downloaded from the site). Beside or behind the card, the product moment the quote talks about,
  through the camera (a quote about reminders sits beside the reminders panel, `ring` on it).
- **Copy**: the quote verbatim. Reading time decides how many: at most 12 words for a 5.3 s card, 22 for an 8 s card
  (0.3 s a word plus 0.5 s, counted after the whole quote is in). Longer quotes are cut to a verbatim run of words
  with "…", never reworded and never cut so they claim more. Light up the quote's key phrase in the accent colour
  (its own words).
- **Motion**: the card arrives, the quote fades in phrase by phrase (not letter by letter), then holds still for
  its reading time; the attribution lands last. The product moment beside it keeps moving gently (the camera's drift,
  a mark landing).
- **Camera**: one shot per card on the element the quote mentions; if it mentions nothing specific, the product's
  main screen, dimmed to 50% behind the card.
- **Out**: the next card pushes in from the right on a beat (alternate the direction, or stack it over the last).
- **Sound**: a quiet `synth/swoosh.ogg` on at most two of the card changes; nothing while the viewer reads.

### Logos (20-26 s)
- **Screen**: the site's customer logos, downloaded as files and laid out in a grid that fills in one by one (0.08 s
  apart), in the site's own treatment (monochrome if the site shows them that way). Or show the real logo strip
  through the camera with a slow move along it. No logos: 2-3 real usage numbers from the site or README, counting
  up in a row. Neither: skip to more real results.
- **Copy**: the site's own label for them (*"Baked in at"*, *"Used by"*), or each number's own words.
- **Out**: the grid compresses toward the centre and becomes the logo for the CTA.
- **Sound**: one soft accent as the grid completes, on a strong cue.

### CTA (26-30 s)
- **Screen**: logo, name, the site's call to action and the URL large. Settled by 26.5 s.
- **Copy**: *"Join them · mossbook.co"* when the video showed real people; otherwise the site's button words.
- **Sound**: land the URL on a strong cue; fade the music over the last 1.5 s.

## No quotes: the results version

Same beats, same timings. Headline: the strongest real result the product shows (a real output from its examples,
gallery or demo). Quotes: two or three real results, each on its own card: the input and the output from the site's
examples, or a figure a case study states. Logos: usage numbers if any, else a quick grid of more real outputs. Say
in the plan that there were no testimonials.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | Headline 0-3 · one quote 3-9 · logos or one number 9-12 · CTA 12-15 |
| 20 s | Headline 0-3.5 · two quotes 3.5-13.5 · logos 13.5-16.5 · CTA 16.5-20 |
| 60 s | Headline 0-5 · four or five quotes, each with its product moment, 5-40 · numbers 40-48 · logos 48-54 · CTA 54-60 |
| 90 s | Headline 0-6 · three chapters by audience or use, each a quote, its product moment and a real result, 6-66 · numbers and logos 66-80 · CTA 80-90 |

Never stretch a quote's hold to fill time: add a sourced quote or a product moment instead, or keep the video short.

## Other formats
Quote cards follow the format guide's **Proof card** layout and type sizes; the product moment sits beside or behind.
- **Landscape**: quote card on the left half, the product moment on the right.
- **Vertical**: quote card in the top half, the product moment below; with a voiceover keep the bottom 28% clear.
- **Square** (default): the card fills the top two thirds; with a voiceover keep the bottom 18% clear.

## Voiceover or music only
- **Voiceover** (the template's default, warm): the voice speaks in the third person and never voices a customer's
  quote as if it were theirs. It introduces each speaker as the site does and restates the quote's point, adding
  nothing: *"Over eighteen thousand kitchens plan with Mossbook."* / *"Dana, who runs a bakery, says she stopped
  re-typing recipes."* / *"Join them at mossbook dot co."* Each quote line runs 9-12 words, so the card stays up
  long enough to read; the card appears 0.2 s before its line. Numbers are said as the source writes them.
- **Music only**: the quotes carry it. Give each its full reading time; two well-held quotes beat three rushed ones.

## Done when
- [ ] The plan's sources table covers every quote, name, photo, logo and number on screen, with where it's from.
- [ ] Every quote is verbatim (cuts marked with "…"); every attribution matches the site.
- [ ] The headline number ends on exactly the stated figure, in the source's wording.
- [ ] Every quote card holds settled for its reading time, and something beside it moves.
- [ ] Logos are the site's own files, shown as the site shows them; none added.
- [ ] The URL is settled and large for at least the last 2.5 s.
