# Prompt: rebuild Hyped's editor as a four-zone workspace (phase 1)

Paste everything below the line into a Claude Code session started in the repo root. It is self-contained.

---

You're redesigning the video editor of Hyped (hyped.video), a Next.js 15 app in `web/`, so it works like a real
desktop editing workspace: **library and tools on the left, the video in the middle, an AI agent on the right, the
timeline along the bottom.** Today it's a dashboard page with a 10-tab panel beside the video, and people find it
cramped and hard to use. The goal of this phase is the **layout and the experience**: the same features, reorganised
around the video and the timeline, with the AI agent always at hand. Don't change what an edit can do or how it renders.

## Read first

- `.claude/CLAUDE.md` (rules: branch from `launch/caption-styles`, ask before committing or opening a PR, test locally).
- `web/components/reels/reel-editor.tsx`: the editor today. It's used for reels (a customer's own clip) and for
  product videos (`product` prop, `VideoSource` in `packages/core/src/reel.ts`). Route: `web/app/dashboard/videos/[id]/edit/page.tsx`.
- The panels it shows in tabs, all reused as they are: `chat-panel.tsx` (Ask AI), `style-picker.tsx`,
  `template-gallery.tsx` and `look-editor.tsx` (Style), `transcript-editor.tsx` (Text), `cuts-panel.tsx`,
  `transitions-panel.tsx`, `broll-panel.tsx`, `emoji-panel.tsx`, `effects-panel.tsx`, `filters-panel.tsx`,
  `audio-panel.tsx`, all in `web/components/reels/`.
- `reel-timeline.tsx` (the timeline today: tracks for cuts, captions, B-roll, transitions, effects and punch-ins,
  emojis, sounds; click to seek or pick an item; 1-8x zoom), `live-captions.tsx`, `picture-layers.tsx`,
  `transition-layers.tsx`, `broll-layer.tsx` (the live preview's layers).
- `packages/core/src/reel.ts` (`ReelEdit`), `reel-chat.ts` (every editor control has an Ask AI change: keep it so).
- The design system in use: Geist, the `gray-*`, `gray-alpha-*` and `background-*` tokens, components in
  `web/components/ui/`.

## Rules that don't change

- **The edit and the render stay exactly as they are.** No changes to `packages/core` types, the runner or the
  render Worker. The preview must keep matching the render (it's drawn from the same numbers).
- **Every feature that's in the editor today is still reachable**, for reels and for product videos (product videos:
  the Captions on/off switch, no "Behind you", burned-in captions explained, the "original" soundtrack option).
- **Undo/redo, autosave of the draft and export** work as now. Free re-exports and their end date stay visible.
- **On-canvas editing stays**: click a caption word to edit it, drag captions to move them, the "Cut from the video —
  Put back" overlay, the inline word panel.
- Our own design: be inspired by desktop editors (Cardboard, CapCut, Descript, Premiere), copy none of their
  assets, icons or text. Icons from `lucide-react`, as elsewhere in the app.

## The layout

The editor becomes a full-screen workspace: it renders **outside the dashboard's sidebar and page padding** (give the
edit route its own layout), fills the viewport (`100dvh`), and never scrolls as a page; only panels scroll inside.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR 48px: ← Project name ✎ · Saved · aspect chip ·            undo redo · Export ▾     │
├────┬──────────────────┬─────────────────────────────────────────┬─────────────────────────┤
│RAIL│ PANEL 320px      │                                         │ AI AGENT 360px          │
│56px│ (the rail item's │          PREVIEW STAGE                  │ chat history            │
│    │  panel; search,  │   the video, centred, as big as fits,   │ suggestions             │
│    │  scrolls inside) │   on-canvas editing as today            │ …                       │
│    │                  │                                         │ [ Describe the edit… ]  │
├────┴──────────────────┴─────────────────────────────────────────┴─────────────────────────┤
│ TIMELINE HEADER 44px: 0:12.40 / 0:58.00 · ⏮ ▶ ⏭ ·                 zoom − ──●── + · Fit    │
│ TRACKS (resizable, 180-420px): Video · Captions · B-roll · Transitions · Effects · Emojis │
│ · Sounds · Music, with a label column, a ruler and a playhead across all of them          │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Top bar
- Back to the project's page; the project's name (editable inline if the job has a name field; otherwise show it
  plainly); a save state ("Saved", "Saving…", "Unsaved changes"); an aspect chip showing the video's shape (read-only:
  reels keep the upload's shape, product videos their format).
- Undo and redo with their shortcuts in the tooltip; **Export** as the primary button, with the export state in a
  small popover (rendering, done with a link to the video, failed with the reason and Retry, "free exports until …").

### Left: rail and panel
- A 56px icon rail, each item a tooltip and an `aria-label`; the active one highlighted. It opens its panel (320px,
  collapsible to just the rail with a button and `[`). Map today's tabs onto it, in this order:
  1. **Media**: what's in the project: the source clip (thumbnail, length, "Replace" disabled for now), the B-roll
     shots used, and the music track. Room for uploads later (several uploads per video is on the roadmap); show an
     "Add media — soon" row, not a dead button.
  2. **Templates**: caption templates (`template-gallery.tsx`) then the caption styles (`style-picker.tsx`).
  3. **Captions**: the look (`look-editor.tsx`) and, for product videos, the Captions switch.
  4. **Text**: the transcript (`transcript-editor.tsx`), with the hook title.
  5. **Cuts**, 6. **Transitions**, 7. **B-roll**, 8. **Effects**, 9. **Filters**, 10. **Emojis**, 11. **Audio**
     (music, sound effects, clean audio): today's panels.
- Panels get a consistent header (title, a one-line hint, a search field where the panel has a list: templates,
  effects, sounds, emojis).

### Middle: the preview stage
- The video centred on a dark stage, as large as fits between the panels and the timeline, at its true aspect, with
  the same layers as today (captions, picture effects, transitions, B-roll, emojis).
- The play/pause button and time move to the timeline header; keep a small hover play button on the video. Space
  plays from anywhere except text fields.
- States: preparing (older product videos: `prepare-video.tsx`), loading, empty (no captions/words), exporting.

### Right: the AI agent
- `ChatPanel` moves here and is always visible on wide screens (collapsible to an icon with `]`), no longer a tab.
- Empty state: one line on what it can do, and 4-6 suggestion chips that send a prompt (different for reels and
  product videos, e.g. "Make the captions bolder", "Cut the long pauses", "Add B-roll where I mention a product",
  "Use the Afterglow template", "Add a whoosh on every cut").
- Each AI reply shows what it changed (a short list) and an **Undo this** button that undoes that step.
- The input sits at the bottom, grows to 6 lines, sends with Enter (Shift+Enter for a new line), `⌘/` focuses it,
  and it says what the agent will look at: "At 0:12" (the playhead) and the selected item if any ("Word: 'launch'").
  Pass the selection to the chat request alongside the playhead it already sends, without changing the server's
  response format.

### Bottom: the timeline
- Rebuild `reel-timeline.tsx` as a proper editor timeline (keep its data mapping and item picking):
  - A header: time readout (current / total, on the cut video's clock), previous/next caption line, play/pause,
    zoom slider with − / + and **Fit** (whole video), and later room for split and snapping (show nothing until they
    exist).
  - A **label column** (120px) with each track's icon and name, and a toggle to hide empty tracks.
  - Tracks: **Video** (the source, with cut stretches hatched and a "Put back" on hover), **Captions** (one block per
    line, its words visible when zoomed in), **B-roll**, **Transitions** (markers at joints), **Effects** and
    punch-ins, **Emojis**, **Sounds**, **Music** (the bed with its volume).
  - A **ruler** whose labels adapt to the zoom (every 1, 2, 5, 10 or 30 s), a **playhead** you can drag, click-to-seek
    anywhere, and horizontal scrolling with the wheel/trackpad (Shift+wheel or two-finger), zoom with ⌘/Ctrl+wheel
    around the pointer.
  - **Selection**: clicking an item selects it (highlight), seeks to it and opens its panel on the left with that item
    in focus; selecting in a panel highlights it on the timeline. Delete/Backspace removes the selected item where a
    remove action already exists. Esc clears the selection.
  - The timeline's height is resizable by dragging its top edge (180-420px, remembered per browser).
  - Performance: the playhead moves with `requestAnimationFrame` from the video's time, not React state on every
    frame; tracks memoised; smooth with 400+ caption lines.
- Dragging items to move or trim them is **phase 2**: structure the code so items can become draggable later, but don't
  add it now.

### Keyboard
Space play/pause · ←/→ one frame (1/30 s) · Shift+←/→ one second · ↑/↓ previous/next caption line · ⌘Z / ⇧⌘Z undo/redo ·
⌘E export · ⌘/ focus the AI input · `[` / `]` collapse the left/right panels · Delete remove the selection · Esc
deselect. None of them fire while typing in a field. Add a "Keyboard shortcuts" popover (the `?` key and a button in
the top bar).

### Smaller screens
- ≥1280px: the full layout. 1024-1279px: the AI panel starts collapsed (one click opens it as an overlay drawer).
- <1024px (tablets and phones): a stacked editor: the video on top, the timeline below it (compact: captions, cuts,
  B-roll tracks), and a bottom tab bar for the panels and the AI. It must stay fully usable on a 390×844 phone.

## How to work
1. Make a plan in your first message: the new component tree, what moves where, and the files you'll add (e.g.
   `editor-shell.tsx`, `editor-topbar.tsx`, `editor-rail.tsx`, `editor-stage.tsx`, `agent-panel.tsx`, a new
   `timeline/` folder). Keep `reel-editor.tsx`'s state and logic; split out the view.
2. Build it in steps that each leave the editor working: the shell and top bar; the rail and panels; the stage; the
   agent panel; the timeline; shortcuts; small screens.
3. Match the code style of the files you touch: comments explain why, names are plain, no new dependencies unless
   there's no reasonable way without one (ask first).

## Verify (all required)
- `npx tsc --noEmit -p .` in `web/`, `render/` and `runner/` pass.
- In demo mode (`npm run demo` at the repo root, port 3100) and the full stack (`npm run dev:all`, port 3001, signed in
  with a dev account), open a reel and a product video in the editor and go through: play/pause and seek from the
  timeline and the keyboard; select a caption line, a B-roll shot, an effect and a sound on the timeline (the right
  panel opens, the item is focused); edit a word on the video; change a caption template; ask the agent for a change
  and undo it from its message; zoom the timeline in and out and Fit; resize the timeline; collapse both side panels;
  export. No console errors.
- Screenshots at 1440×900, 1280×800 and 390×844 (vertical reel and landscape product video), attached to your summary.
- The preview still matches before and after for the same edit (compare a few frames of the stage).

## Out of scope (later phases)
Dragging and trimming on the timeline, splitting clips, several uploads per project, new tracks or item types, titles
and motion graphics, project tabs, model choice in the agent panel, and any change to how videos render.

## Done when
- The editor is a full-screen four-zone workspace at ≥1280px and a usable stacked editor on a phone.
- Every feature from the 10 old tabs is reachable from the rail; the AI agent is always one click away; the timeline is
  the main way to move around the video and pick what to edit.
- Type checks and the walkthrough above pass; screenshots attached; nothing is committed until the owner says so.
