# Hyped: notes for Claude

Hyped (hyped.video) turns a product's website or GitHub repo into a launch video, and edits clips people record into
reels (captions, cuts, B-roll, music, Ask AI). Read first: `README.md`, `docs/ARCHITECTURE.md`, `LOCAL_TESTING.md`,
then `docs/STRATEGY.md`, `docs/PLAN.md`, `docs/UNIT_ECONOMICS.md`.

## Who decides
- Taibanaz Khan leads the project and takes the product decisions. Research and recommend; hand over clear decisions.
- Syed Imtiyaz Ali (founder) built most of it, reviews pull requests and deploys.

## Rules
- Branch, then open a pull request to `main`. Don't push to `main`, don't deploy: Syed deploys.
- The newest code is on `launch/caption-styles` (what's live), not `main`. Branch new work from it.
- Test locally (`npm run dev:all`, or demo mode), never on hyped.video. Never touch production or use anyone else's login.
- Never commit or paste secrets. `.env`, `.env.*` and `.dev.vars` stay git-ignored.
- Containers stay keyless; the R2 video bucket stays private (only `serveMedia` serves files).
- Schema changes: edit `packages/core/prisma/schema.prisma`, run `npm run db:push` locally, tell Syed (`npm run prod:db`).
- Before a PR: `npx tsc --noEmit` in `web/`, `render/` and `runner/`. There is no ESLint config.
- Ask before committing, opening a PR, or anything outward-facing.

## Product direction
- The working plan is `docs/ROADMAP.md` (27 Oct 2026, draft until its decisions are taken). Update it as decisions land.
- Recipes, in detail: `docs/RECIPES.md` (data model, gallery, panel, the first 10 recipes in three waves, milestones M1–M4).
- Inspiration: cardboard.ai (recipe gallery, one prompt box, an agent-driven editor with chat and timeline, generative
  footage, 4K, CLI and MCP). Be inspired, don't copy: our own recipes and sample videos, no formats built on TV clips,
  celebrities or other people's shows.
- Syed's roadmap (26 Oct 2026): ship the product video editor → Recipes gallery + several uploads per video → Premium
  (4K, 60 fps, MOV) → pro editor tools (layouts, titles, looks, sound library) → "make it like this" + one prompt box.
- Direction (Taibanaz, 27 Oct): build Hyped to Cardboard's level, landing page included, and everything in Syed's plan.
- Merged into `launch/caption-styles` (27–28 Oct): PR #6 `launch/landing-refresh` (below), PR #7 `fix/media-r2-errors`
  (serveFile logs R2's error and returns 503 instead of Cloudflare 1101) and PR #9 `launch/dashboard-templates` (below).
  Then PR #10 merged `launch/caption-styles` into `main` (28 Oct): `main` has everything as of that day. New PRs still
  go to `launch/caption-styles` (Taibanaz, 29 Oct). PR #11 `fix/open-dashboard-link` (a spinner on the landing page's
  dashboard buttons; Turbopack for demo mode; the template modal on phones) merged, then PR #12 merged
  `launch/caption-styles` into `main` again (29 Oct). The 29–30 Oct work below (landing vs dashboard, Editor first part A,
  E1, the local editor) is PR #13 (2 Nov, `launch/realtime-editor` → `launch/caption-styles`), open for Syed's review.
- PR #6, `launch/landing-refresh` (27 Oct): a Cardboard-style landing page (full-screen hero
  with a prompt box: link + words + recipe menu + clip upload, "Auto" picks a recipe in `web/lib/prompt.ts`; floating
  sample tiles; a timeline ruler; the recipes gallery right below; then the examples strip, feature bento, pricing) and Recipes M1 (`packages/core/src/recipes.ts`, `/recipes`,
  `/recipes/[id]`, `/dashboard/recipes`, the one-screen panel at `/dashboard/recipes/[id]`, 308s from the template pages).
  Type-checks pass and the pages load in demo mode; a real Remix still needs testing with the full stack.
- PR #9, `launch/dashboard-templates` (28 Oct): a Cardboard-style dashboard. The home greets by first
  name over the shared prompt box (`web/components/create/prompt-box.tsx`), then one card: Templates ("Remix a video"
  strip, then "Pick a template to remix" with search, Short/Long-form, sizes, types, a row per category) and Your
  projects (a grid), then this month's numbers. Decisions (Taibanaz, 28 Oct): the dashboard UI says "Templates", not
  "Recipes" (text only: URLs, code and the public site still say recipes); the sidebar is Home, Projects (videos and
  reels in one grid at `/dashboard/videos`), Templates, with credits, Usage, Settings and help at its foot, and New
  project at its top under search, as Cardboard's app has it (Taibanaz, 2 Nov; no longer in the top bar or the
  Projects page's header); a click lights its link at once, with a spinner until the page is in; on the home, the
  lit link follows the scroll as Cardboard's does (Templates or Projects, by the open tab, once the lower card is
  reached; `components/shell/home-section.ts`), and Home clicked there scrolls back up; the
  dashboard is dark until the customer picks a theme; a template opens in a modal over the page
  (`web/components/recipes/recipe-modal.tsx`, `?recipe=` in the address), and its page stays for links; the strip's
  first tile is "Upload a clip" (to the reel form) until "make it like this" exists.
- Reel templates (29 Oct, in PR #13): the six reel edit styles are templates in the dashboard (`REEL_RECIPES`,
  ids `reel-<style>`, in `packages/core/src/recipes.ts`), not on the public site. Decisions (Taibanaz, 29 Oct): they sit
  in the categories with the videos, as on Cardboard (Talking-head, Vlog, Clipping), and their popup starts the reel
  itself: the clip, "Anything to change?" (saved as `Job.notes`, then waiting in the editor's Ask AI) and Remix.
  The upload logic is shared with the reel form (`web/components/reels/use-reel-upload.ts`). Tiles carry no text
  (no "Reel" badge or feature chips; the name on hover); real sample reels per style are still to make (they need our
  own clips and Syed's full stack; one `SHOWCASE` line each, with `template: "reel-<style>"`).
- Landing and dashboard, told apart as Cardboard's are (Taibanaz, 29 Oct, in PR #13): the dashboard is a clean
  workspace (prompt box, category chips that open their templates, then Templates | Your projects; the "Remix a
  video" strip plays by itself), with no greeting or floating videos. The landing page follows Cardboard's flow in our
  own words: hero (a serif headline that cycles "Make a launch video / from your website" and so on, prompt box,
  floating samples), Made with Hyped (masonry), Three steps (paste, direct, share), Everything a video needs (01 story,
  02 edit, 03 publish), use-case tabs, pricing, FAQ. What we don't have yet (videos from words alone, a Mac app,
  Claude/ChatGPT plugins) stays off it.
- Editor first (Taibanaz, 29 Oct; roadmap Decision 2), in two parts. Part A (in PR #13): the dashboard's prompt
  box starts at once and opens the editor (`/dashboard/videos/[id]/edit`) on its first cut, as Cardboard's does (a link
  starts the video with Auto's recipe, a clip uploads and starts a reel; the line under the box says Enter spends credits
  and confirms ownership); template Remix opens the editor too. The editor has Cardboard's layout (tools rail and panel,
  preview, Ask AI always open, timeline; "Filters" is "Looks") and an export dialog (1080p, 30 fps, MP4 and the
  watermark as they are; 4K, 60 fps, MOV and WebM shown locked). Product videos open in the same frame with Ask AI
  sending revisions, until Syed's product video editor lands. Part B, with Syed (render pipeline, full stack): layout
  presets (several clips: edit model v2), about 20 looks, the Director as an agent that asks for what's missing, 4K/60 fps.
- The real-time editor, step E1 (Taibanaz, 30 Oct; in PR #13): an interactive timeline on today's edit model,
  no render change (`web/components/reels/reel-timeline.tsx`): drag B-roll, effects, sounds and cuts, drag their edges to
  resize, drag across the Video track to cut a stretch out, Delete removes the picked piece, Space plays, the arrows step;
  a drag is one undo step and snaps to the playhead. E2–E6 (several clips, layouts, looks and titles, the Director agent,
  4K) need Syed; a spec for him (`docs/EDITOR.md`) waits until E1 has been tried. The customer's own clip opens in the
  editor at once, from their computer (`/dashboard/edit/local`, the editor's `local` mode, a blank edit): in demo mode
  the prompt box hands clips there in memory; its captions follow in seconds (Taibanaz, 30 Oct): the browser sends the
  sound as 16 kHz WAV to `/api/local/transcribe` (local development only, whisper-1 with the root .env's OpenAI key,
  as the pipeline does). Ask AI works on it too in local development (Taibanaz, 2 Nov): `/api/local/chat` makes the
  render Worker's ReelAssistant call itself (the plan's small model, CHAT_SYSTEM, the reel_chat schema, the root .env's
  key; the request body shared with the real route in `web/lib/chat-body.ts`), checks the changes the same way, and
  leaves out stock B-roll (searched by the render Worker). `/api/local/*` is signed-in only (middleware) and 404s in
  production. B-roll search and Export still need the clip uploaded. The editor's
  preview now has the reel's own shape (the render keeps the clip's), not always 9:16. Next: the same instant open on a
  real account, while the upload and the first cut run, then merging the two.
- Fully like Cardboard (Taibanaz, 2 Nov; in PR #13): the editor's pages (`/dashboard/videos/[id]/edit`,
  `/dashboard/edit/*`) take the whole window, without the sidebar or anything over them (a strip of open projects'
  tabs was tried, then removed the same day for a bigger preview: the bar's back button leaves the editor).
  New project (the sidebar's button, the projects grid's tile, the New project button in the editor's bar) opens an empty editor at
  `/dashboard/edit/new` ("Your timeline is empty", Import media, drop, Ctrl+I): a clip imported there goes where the
  prompt box sends one (uploaded and started; demo mode, or local development when the upload fails, opens it from
  the computer). The 5-step form (`/dashboard/new`) stays, for websites, from the phones' bottom bar and Projects' empty
  state. Next for Cardboard parity: Search with ⌘F, and "Home" or "Dashboard" as the first link's name (her call).
- Syed's editor spec ("Video Editor Prompt", Slack 29 Oct: a four-zone workspace, phase 1), the parts added on
  `launch/realtime-editor` (2 Nov, in PR #13): a Media tab (`media-panel.tsx`); Ask AI answers list what they
  changed with Undo this for that answer alone (`chat-steps.ts`), the box shows "At 0:12 · what's picked" and sends the
  pick to `/api/reels/[id]/chat` (`selection`, added to the context in the web route; core and render unchanged); the
  draft autosaves in the browser (`hyped:reel-draft:<job>`, back on reopen until exported) with Saved / Saving… in the
  bar; an aspect chip; the timeline zooms with a slider, Fit and ⌘/Ctrl+wheel around the pointer, its ruler adapts, and
  empty tracks hide (a toggle); keys: a frame per arrow, ↑/↓ caption lines, ⌘E, ⌘/, [ and ], F, ? for the list
  (`shortcuts-dialog.tsx`); a full-screen preview (the button under it, or F; Esc leaves); the editor fills the window and never scrolls as a page (2 Nov: the bar and the timeline
  keep their height, the panels and the preview take the rest, the preview sized to its column with container units;
  the same for the empty editor and the first cut's frame). Still to do from the spec: an editable name, play
  controls and a resizable height in the timeline's header, 120px track labels with icons, panel headers with search,
  the 1024–1279px drawer and the phone layout's bottom tab bar, screenshots at three sizes. His spec names files that
  aren't on GitHub (`transitions-panel.tsx`, `template-gallery.tsx`): his Mac work still needs pushing.

## Local development
- macOS: `npm run dev:all` (database, render Worker on 8787, site on 3001). See `LOCAL_TESTING.md`.
- Windows: Wrangler can't run containers on Windows, so the full stack runs from a clone inside WSL (Ubuntu). For UI
  work, demo mode runs on Windows directly: in `web/`, `$env:DEMO_MODE="true"; npx next dev -p 3100 --turbopack`
  (PowerShell). Without `--turbopack` (webpack), each page takes minutes to compile on a PC with 8 GB of RAM, and links
  seem dead while it does.
  `npm run demo` and the macOS key dialogs (`npm run openai-key` and others) don't work on Windows; edit `.env` by hand.

## Keep this file current
When a decision is made, a branch merges, the roadmap changes or the setup changes, update this file in the same
session. Personal notes (who uses which account, one machine's quirks) belong in Claude's own memory, not here.
