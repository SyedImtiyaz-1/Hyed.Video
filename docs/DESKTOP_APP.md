# Desktop app: Ask AI that brings a video in by itself

Draft, 3 November 2026. **Decision (Taibanaz, 3 Nov):** build a Hyped desktop app, as Cardboard has its Mac app, so
that "pull my video from Downloads" puts the video in the editor's Library with no file window. Syed builds and
ships it; the open choices are at the end.

## Why an app

A web page can't read a file the customer hasn't chosen. Every browser enforces this, and Chrome won't hand a site the
whole Downloads, Desktop or Documents folder even when the customer agrees. A desktop app is a program on the
computer, so with the customer's one-time OK it can read their videos.

What the browser does today (PR #13, `web/components/reels/empty-workspace.tsx`):
- Asking Ask AI to pull a video opens the file window straight in that folder (inside the customer's own Enter, the
  only moment a browser allows it), and the Library shows the file asked for. One double-click brings it in.
- A video dragged from Finder or Explorer onto the editor opens with no window at all.

## What the customer gets

- They download Hyped for Mac (then Windows) from hyped.video and sign in with the same account.
- The first time, Hyped asks: "Let Hyped see the videos in Downloads, Desktop and Movies?" They can change it in Settings.
  macOS also asks once per folder itself.
- They say "pull my video from Downloads" → the newest video there appears in the Library with its thumbnail and opens
  in the editor. A file name or a pasted path brings that file. When it's unclear which, the three newest show as
  tiles in the chat to click, still with no window.
- Later (D3): new screen recordings show up in the Library by themselves, if they turn it on.
- The rest is the same site. The browser version keeps working as today.

## How (recommendation)

**A thin shell around hyped.video, built with Electron.** It's the standard pattern for a remote site with a preload
bridge, uses the same Chromium everywhere, suits a TypeScript team, and electron-builder covers signing, notarizing
and updates. Tauri is the lighter alternative (about 10 MB to download instead of about 100 MB, the system's own
webview, Rust on the file side).

- The window loads `https://hyped.video/dashboard` only; links to other sites open in the browser. Context isolation
  and the sandbox are on, with no Node in the page.
- A preload exposes one narrow API, `window.hypedDesktop.files`:
  - `folders()`: the folders the customer allowed.
  - `find({ folder, name? })`: the videos (mp4, m4v, mov, webm) in an allowed folder, newest first, matched by name
    when one is given: name, size, modified time and an opaque id, never a path.
  - `open(id)`: a one-time `hyped-file://<token>` URL. The main process streams the file through `protocol.handle`,
    and the page fetches it into a `File`.
  - Read-only. Nothing outside the allowed folders (real paths resolved, links out of them refused), no writes, no shell.
- On the web, little is left to do. `pickAsked` and the assistant's `pick` and `file` already say what was asked
  (`packages/core/src/project-chat.ts`). In `empty-workspace.tsx`, when `window.hypedDesktop` exists: `find`, then
  `open`, then the same `take(file)` as a picked clip, and the assistant is told what was found. Without the app,
  today's flow stays.
- Keyless: the app holds no secrets. Sign-in stays Clerk, in the page.
- Builds run on GitHub Actions' macOS and Windows runners: a signed and notarized `.dmg`, a signed installer, and
  automatic updates from GitHub Releases (electron-updater). hyped.video gets a download page.

## Steps

| Step | What | Rough size (one developer; to check with Syed) |
|---|---|---|
| D1 | Mac: the shell, the file bridge for Downloads, Desktop and Movies, Ask AI wired to it, signed and notarized, auto-update | 1–2 weeks |
| D2 | Windows: installer, signing, the same bridge (Videos instead of Movies) | about a week |
| D3 | Watched folders: new recordings appear in the Library; "my latest screen recording" | a few days |
| D4 | Optional: uploads that carry on with the window closed, for big files | later |

## Costs

- Apple Developer Program: $99 a year, needed to sign and notarize the Mac app.
- Windows code signing: a yearly certificate or Microsoft's signing service. Check today's prices before buying.
  Unsigned builds get SmartScreen warnings.
- Downloads hosted on GitHub Releases (free) or R2.

## Risks

- **Trust:** an app that reads folders must ask plainly, read videos only, and only from the folders allowed. The
  download page says so.
- **Two things to keep up:** the site and the app. Keeping the app a thin shell means most changes still ship with the site.
- **Mac App Store:** its sandbox limits folder access, so ship outside it (a notarized direct download), as most
  creator tools do.

## Open choices (Syed, with Taibanaz)

1. Electron (recommended) or Tauri.
2. Mac first (recommended: Syed works on a Mac, and many creators do), or both at once.
3. The folders allowed by default: Downloads, Desktop and Movies/Videos (recommended), or ask for each.
4. Watched folders in D3 (recommended) or in D1.
