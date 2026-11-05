# Inspect: gather real material before planning

The video is only as good as what you find here. Spend real effort: the best material is the product **in use**
(entry → key action → result), not its marketing page describing itself.

## A website

1. **Load it as a visitor sees it.** Many sites build the page with JavaScript, so a plain download can be an empty
   shell: load it in headless Chromium (`waitUntil: "load"` plus a 1-2 s wait, never `networkidle`). Dismiss cookie
   banners and pop-ups. Scroll section by section, since content that animates in on scroll stays blank otherwise.
2. **Capture the screens you'll show** with `node .hyped/capture.mjs <url> brag-output/work/capture/<name>` (see
   [tools.md](tools.md)): the home page, and the 1-3 pages that show the product working (the app, a demo, a docs page
   with real output). Add `--viewport mobile` for vertical, portrait and square videos when the site has a good phone layout.
3. **Copy**: the headline and tagline, section headings, feature names, button labels, prices, testimonials and the
   numbers the site states. Also the page title, meta description and social-preview tags (they're often the
   sharpest one-line summary). Write them into your notes word for word; on-screen text should reuse them.
4. **Identity**: the exact colours from the CSS (`:root` variables, button and link colours, the background), and the
   fonts it loads. Download the font files (woff2 or ttf from the stylesheets) into `brag-output/work/fonts/`.
5. **Visuals**: the logo (SVG if there is one), product screenshots, hero images, demo videos, illustrations. Download
   the ones you'll use into `brag-output/work/`.
6. **The product in use**: demo videos, "how it works" sections, docs, a public playground or sample output. Find the
   2-3 beats of using it.

## A repo

1. **Read** the README, `package.json` (name, description, scripts), the main routes and pages, the key components
   (the editor, the upload form, the result view, the dashboard), styles and theme files (colours, fonts), and
   `public/` or `assets/` (logo, icons, screenshots).
2. **Find the flow**: routes, state machines, step components, the README's usage section, examples and demo folders.
3. **Show the real thing**: you have the source, so import or render its real components, styles, fonts and images
   in your scenes rather than redrawing them. If it's a web app that builds quickly (a few minutes at most), run it
   locally in the background, capture its screens with `capture.mjs` against `http://localhost:<port>`, and stop it
   when you're done. If it won't build in time, render its components or use the screenshots in the repo.
4. **For libraries, CLIs and APIs**: the real install command, the smallest real usage example from the README or
   tests, and real output. Run the command when it's safe and quick; otherwise show the README's example exactly.

## Then answer, in your notes, before planning

1. What is it, in one sentence a stranger understands?
2. Who is it for, and what does it do for them?
3. What sets it apart: the one thing competitors can't say?
4. What's the strongest claim or number the source actually states?
5. What's the visual hook: the screen, moment or result that makes someone stop?
6. Which real screens or flow will the video show, in order?
7. What tone fits (see [tones.md](tones.md)), unless the job sets one?
8. What's the call to action: the exact URL, install command or button text?
9. What's the one-line share caption?

If the source is thin (a one-page site with little UI), lean on what it does have: its copy, its colours and type, its
logo and any image, animated well. Never fill gaps with invented features, numbers or quotes.
