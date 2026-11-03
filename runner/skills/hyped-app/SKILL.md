---
name: hyped-app
description: Use when the job prompt names /hyped-app (or $hyped-app) - a preview video for an app's App Store or Google Play page, made only from the app's real screens and kept inside each store's rules (length, frame size, no device frames, no calls to action). Holds the recipes for Hyped's App Store Preview and Play Store Promo templates. Builds on the core skill `hyped`.
---

# Hyped: app store videos

Read [../hyped/SKILL.md](../hyped/SKILL.md) first, then the format guide for the job's format
(`../hyped/formats/<format>.md`), then the recipe for the job's template (below). This skill adds what a store video
needs. The job prompt still wins over all of them.

Where this skill and the core disagree, this skill wins: the stores reject videos that break their rules, and a
rejected preview is worth nothing to the customer. It sets aside these core rules on purpose: the end card holds the
app's icon and name, not a web address; transitions are plain (dissolves, fades, cuts); raw screen recordings of the
app may carry the whole video; and the `app-store` tone never brings device frames.

## What a store video does

The viewer is already on the app's store page, or looking at it in search results, deciding whether to install. The
video plays there before the screenshots, usually muted, in a card narrower than the phone. Its one job is
conversion: in the first 3 seconds the viewer sees what the app does and wants it; by the end they know exactly what
they'll get after installing. It sells by showing, and the stores only let it show the app.

| | Store video (`hyped-app`) | Launch (`hyped-launch`) | Ad (`hyped-ads`) |
|---|---|---|---|
| The viewer | on the store page, deciding to install | has never heard of the product | scrolling a feed |
| Shows | only the app's own screens, full screen | the product, in designed scenes | a pain, then the product |
| Opens on | the app's core moment | its best result | a pain or a result |
| Ends on | the app's icon and name | the web address | a reason to click |
| Sound | plays muted first; one music track | music, often a voice | must work muted |

Two still frames matter as much as the motion: what shows before the video plays (Apple's poster frame, which is
the frame at 5 seconds unless the developer picks another; Google's feature graphic, with a play button on it), and
frame 0, where autoplay starts.

## The stores' rules

From the stores' own pages (Sources, at the end) unless marked as ours. Quotes are Apple's or Google's words.

### App Store (Apple)

Do:
- Show only the app: "previews may only use video screen captures of the app itself" (App Review Guideline 2.3.4).
  Its real screens, its real content, its real flow.
- Fill the frame with the app's screen. App Review rejects previews that include "device images and/or device
  frames" or "framing around the video screen capture" (rejection notices quoted on Apple's developer forums,
  2020-2026). Apple's guideline doesn't say this in words, but its reviewers enforce it: treat it as a rule.
- Add text where it helps: Apple allows "narration and video or textual overlays to help explain anything that isn't
  clear from the video alone", and asks that text be legible and stay on screen long enough to read.
- Show taps with a touch point: Apple suggests graphic elements such as touch hotspots to show interaction.
- Use one music track from start to finish ("a single musical score"), plus the app's own kind of interface sounds.
- Disclose it when a feature shown needs an in-app purchase, a subscription or a login, in the footage or on the end
  frame.
- Use "straightforward transitions, like dissolves and fades", none that implies something the app doesn't do.
- Keep everything fit for a 4+ rating, even if the app is rated higher (2.3.8), and show fictional account details,
  never a real person's (2.3.9).
- Make it 15 to 30 seconds long, at 30 frames a second at most.

Don't:
- Show a device, a phone frame, a border or a backdrop around the screen, hands, people, an over-the-shoulder shot,
  the marketing website, stock footage or any other app.
- Show prices (they vary by country), dates or seasonal words ("new for spring").
- Show other platforms' names, icons or imagery: Android, Google Play, their badges (2.3.10).
- Zoom much: Apple recommends "capturing the native UI resolution rather than zooming in on the view".
- Ours, not Apple's words: no "Download", no store badge, no web address, no ratings, rankings or award claims. The
  viewer is already on the store page, and 2.3.7 keeps descriptions "not specific to the metadata type" out of
  previews.

### Google Play

The preview video is a YouTube link pasted into Play Console. Play shows it before the screenshots, with a play
button over the feature graphic, and "may autoplay inline with muted audio up to 30 seconds", on the listing and on
the home and search pages.

Required by Google (the customer does these; they go in the plan's Store upload notes): the URL of one YouTube video
(not a playlist or channel, no timecode or other parameters), public or unlisted, ads and monetization off, not
age-restricted, embeddable.

Do (Google's "highly recommended"):
- Show the real app from the start: "the actual in-app or in-game experience, focusing on the core features and
  content as early as possible", and make at least 80% of the video "representative of the user experience".
- Pick the orientation that matches the app: landscape or portrait, both supported. "Do not leave black bars on
  either side of a portrait video."
- Keep it short: only the first 30 seconds autoplay. Add copy for muted viewers, in readable fonts and sizes.
- Burn in captions when there's speech (Hyped does this with a voiceover), and localise text and audio.

Don't:
- Show "people interacting with the device".
- Spend long on "title screens, logos, cutscenes, or other pre-rendered or promotional content".
- Use calls to action: "Download now", "Install now", "Play now", "Try now".
- Use "Best", "#1", "Top", "New", "Discount", "Sale" or "Million Downloads" (Google Play's own awards, such as "Best
  of", are allowed), prices or promotions, or anything time-sensitive.
- Ours, to be safe: no "Free" (Google lists it for the feature graphic), no store badges (listed for screenshots
  and the feature graphic), no web address, and no device frames (Google discourages device imagery in its graphics
  because it dates; it says nothing about frames in the video).

## The app's real screens

Every screen in the video is the app's own UI, from a source you can name in the plan. Never invent, redraw or
"improve" a screen, never present the marketing website as the app, and never show another app's UI. The website
gives you the copy, colours, fonts and icon; the screens come from the sources below. If a moment has no real
screen, leave the moment out.

Best first:

1. **Screen recordings of the app**: videos on the site, its press kit or its docs that show the app's own screen
   in use. A raw recording (no voice, titles, people or device) may carry the whole video: this sets aside the core
   rule about existing footage. Cut it with ffmpeg into short clips, extract each clip's frames
   (`work/clips/<name>/%05d.png` at 30 fps) and show the frame for `t`, so the page stays a pure function of time. If
   the recording shows the screen inside a phone, crop to the screen and check that no bezel, shadow or rounded
   corner is left. A finished promo, an ad or the app's current store preview is not material: don't re-cut it.
2. **The web app**, when it is the same product with the same screens as the store app (compare with the listing's
   screenshots first): `node .hyped/capture.mjs <url> brag-output/work/capture/<name> --viewport 390x845`. That
   viewport has an iPhone screen's shape, which is also Apple's 886×1920. Add `--type "<text>"` to film typing. Only
   public pages or a public demo: never sign in, and never show a real person's data.
3. **The store listings' screenshots** (public):
   - **App Store**: find the app's id in the site's links to `apps.apple.com/.../id<digits>`, in its
     `<meta name="apple-itunes-app" content="app-id=...">` tag, or with
     `https://itunes.apple.com/search?term=<name>&entity=software&country=us` (use a result only if its `sellerUrl`
     or seller name matches the site). `https://itunes.apple.com/lookup?id=<id>&country=us` returns JSON with
     `screenshotUrls` (iPhone), `ipadScreenshotUrls`, `artworkUrl512` (the icon), `trackName` and `description`.
     Each image URL ends in a size such as `/392x696bb.png`: replace it with `/9999x9999bb.png` to get the original
     (the server stops at the real size). The listing page, `https://apps.apple.com/us/app/id<id>`, shows the
     subtitle and whether the app has in-app purchases.
   - **Google Play**: from the site's links to `play.google.com/store/apps/details?id=<package>`, load that page with
     `&hl=en&gl=US`. Screenshots and the icon are on `play-lh.googleusercontent.com`; replace the size after `=` (such
     as `=w526-h296`) with `=s0` for the original. The page also says "Contains ads" and "In-app purchases".
   - Most store screenshots are marketing images: a caption over a phone. Use only the screen inside: crop it out
     with ffmpeg, look at the result, and keep it only if no caption, bezel or shadow is left and it's still sharp
     (at least 800 px wide for a vertical video). Otherwise don't use it.
4. **Screenshots on the site** (hero images, feature sections), under the same cropping rule.

Use each store's own platform: App Store screenshots in an Apple preview, Play screenshots in a Play video. An Apple
preview never shows Android's system bars or navigation.

**Stills through the camera.** A screenshot is shown like any captured page: write a page that shows it edge to edge
(`brag-output/work/screens/<name>.html`: a zero-margin body and one `<img>` filling the viewport), capture it at a
third of its size (`--viewport 430x932 --scale 3` for a 1290×2796 screenshot), and show it with `.hyped/camera.js`.
The camera holds it, pushes in gently and moves between screens. A still has no measured buttons or fields, so it
gets no touch points, rings or typing: never place one by eye. Show the change across two or three screenshots
instead (the list, then the detail).

**Stills are the weakest material.** Apple's rule speaks of video screen captures; a preview made only of stills
may be rejected (nothing published says either way). If the video is built from stills only, say so in the Store
upload notes.

**The icon**: the listing's (`artworkUrl512` with `/1024x1024bb.png`, or the Play icon with `=s0`), else the site's.
Show it with rounded corners (about 22% of its width); never redraw it.

## Before you plan

Add these to `brag-plan.md`, under the core plan's angle:

- **The store and the screen**: iPhone portrait (the default), iPhone landscape (games and apps used sideways), Mac,
  or a Play phone video, and why.
- **The sources**: every screen you'll show, with its URL or file, and whether it's a recording, a web capture or a
  still.
- **The core moment**: the one change on screen that shows what the app does (the week's meals filling in, the photo
  coming clean, the lesson marked done). It opens the video.
- **Three moments** of the app in use, in the order a new user meets them, the most visual one last.
- **The promise**: the App Store subtitle (30 characters at most, often the sharpest line the app has) or the site's
  headline, at most 5 words.
- **The poster frame** (App Store): 5.0 s unless you have a reason; what's on screen there.
- **Disclosures**: the features shown that need a subscription, a purchase or an account, from the listing or the
  site's pricing page; or "none".
- **Store upload**: the notes the customer needs to upload the file (the recipe gives them). The plan is shown to
  the customer, so write these plainly.

## Frames and export

Hyped renders the job's format at its exact size. The stores accept:

| Where | Accepted size | From Hyped's frames |
|---|---|---|
| App Store, current iPhones (Face ID, Dynamic Island, iPhone Duo), portrait | 886×1920 | vertical 1080×1920, cropped to its centre: x 97-983 |
| App Store, current iPhones, landscape | 1920×886 | landscape 1920×1080, cropped to its centre: y 97-983 |
| App Store, iPhones with a Home button: 5.5" (8 Plus and older Plus) and 4" (SE 1st gen) | 1080×1920, 1920×1080 | vertical or landscape as rendered |
| App Store, iPad (every size) | 1200×1600, 1600×1200 (some older iPads also 900×1200) | none: 3:4 isn't a Hyped frame |
| Mac App Store, Apple TV | 1920×1080 | landscape as rendered |
| Google Play (a YouTube video) | landscape or portrait | landscape or vertical as rendered |

So for current iPhones the customer crops the video before uploading; Apple scales one 886×1920 preview down to the
smaller iPhones. **Design every App Store video for the crop**: in a vertical video, the preview is the centre column
x 97-983, top to bottom, and the 97 px strips on either side are background only (the scene's own colour, continued),
because the crop removes them. A screen captured at `--viewport 390x845` fills that column exactly (2.27 frame px per
CSS px). In a landscape video the preview is the band y 97-983.

Apple's other file rules, all met by the crop command in the recipe: H.264 (High Profile, level 4.0 at most),
progressive, at most 30 fps, a 10-12 Mbps target, stereo AAC at 256 kbps and 44.1 or 48 kHz, an audio track even when
there's no sound, 15-30 seconds, at most 500 MB, as .mov, .m4v or .mp4. Up to three previews per device size and
language.

If the job's format is one Apple can't take (square, 4:5), make the best store-style video in that frame and say in
the Store upload notes that it can't be uploaded to the App Store as it is.

## Layouts

### App Store, vertical (in the 1080×1920 frame)

| Layout | Geometry | Use it for |
|---|---|---|
| **Full-screen app** (default) | `.hyped/camera.js` in an element x 97-983, y 0-1920, `frame: "none"`, shot on `"viewport"`. Strips x 0-97 and 983-1080 in the screen's background colour. | The app in use: most of the video |
| **Line over the app** | The full-screen app, and over its top a panel x 97-983, y 0-600 in the app's own colour (90% opaque or more), the line centred in y 340-560. Camera `inset: { top: 0.32 }`, so the action lands below the panel. | The hook, the promise, each moment's label |
| **Label chip** | A chip with 52-60 px text near the top of the screen (from y 340), over the app's own header, never over the part being used | A short label when the screen must stay whole |
| **Text card** | The whole column in the app's colour, 1-5 words at 112-150 px | At most one in the video, 1.5 s at most, never at frame 0 |
| **End frame** | The app's best screen, dimmed to 40% or less or blurred 16-24 px; centred in y 560-1300: the icon 240-280 px, the name 88-104 px, the promise 52-60 px, a disclosure 36-40 px | The last 3-5 s |

The vertical format guide's platform safe zones are for social feeds; nothing covers a store preview, so use this
column instead. Keep text at least 64 px inside it (x 161-919), out of the top 150 px and the bottom 150 px, and
out of Hyped's mark spot on free plans (x 700-950, y 290-325).

### Google Play, landscape (1920×1080)

See [recipes/play-store-promo.md](recipes/play-store-promo.md): the app's screens as large, frameless panels beside
the words, or full frame for an app that runs in landscape.

## Text on screen

- **Few words, big**: a line has at most 5 words and a label at most 4, one line on screen at a time. In the
  vertical App Store frame: lines 96-120 px, weight 700-800, at most 2 lines of about 14 characters, at most 760 px
  wide; labels 52-60 px; nothing smaller than 36 px. The preview plays in a card about a quarter to a half of the
  phone's width (our estimate of the store's layout, not Apple's figure), so a 100 px line shows at roughly 13-27 pt.
- **The app's own words**: the subtitle, the feature names in its UI, the captions on its store screenshots (they're
  the app's own marketing lines), the site's headline. Never a claim the listing or site doesn't make.
- **Placed on the app's chrome**, on a solid panel or chip, never over the part being used.
- **Read time**: settled for 0.3 s a word plus 0.5 s (the core rule).
- **One language**: the listing's. A version for another language is another video.
- **Never**: prices or "Free", dates or seasons, rankings, ratings, download counts, awards (except Play's own on a
  Play video), "Download", "Install now", "Try now", store badges, web addresses, another platform's name.

## Motion and pacing

- **The app moves, not the camera.** Scenes of 3-6 s; something changes every 2-3 s, and the change is the app's
  own: a tap, a screen opening, a list filling in, a result appearing.
- **The camera**: hold the whole screen (`on: "viewport"`, `drift` 0.015 or less). Zoom in at most twice in the
  whole video, to 1.6× at most, only to make a result readable, then come back out.
- **Taps**: on a web capture shown with `frame: "none"`, a `cursor` mark with `click: true` draws a fingertip that
  presses: a touch point, one for each real tap, on the real element. Never an arrow pointer on a phone screen.
  Scroll with the camera's `scroll`, as a finger would.
- **Typing**: the `type` mark, filmed with `--type` in the real field. Don't draw a keyboard the capture doesn't
  have.
- **Transitions**: dissolves and fades (0.2-0.4 s), cuts on the beat, and a sideways push only where the app itself
  pushes to the next screen. No zoom-throughs, whips, glitches, flips or morphs: on a store page they suggest the app
  animates that way.
- **Overlays** (lines, chips, the end frame's text) arrive with the core's entrances: a 12-24 px rise and fade.

## The poster and frame 0

- **Apple**: autoplay starts at frame 0, so frame 0 shows the app with the hook line already readable. When autoplay
  is off, the store shows the poster frame: the frame at 5 seconds unless the developer sets another in App Store
  Connect (it can't change after approval without a new preview). Make the frame at 5.0 s settled (from 4.5 to
  5.5 s), full screen, with the promise. Use it as `brag.jpg`.
- **Google Play**: the feature graphic (1024×500, which the customer makes) covers the video until it plays; YouTube
  picks or is given its own thumbnail. Frame 0: the app and the hook line. `brag.jpg`: the strongest settled app
  frame.

## Sound

- **Music only by default**: both stores autoplay muted, so the lines carry the story. One library track from the
  first frame to the last (Apple asks for a single score), cut on its beats, faded over the last 1.5 s.
- **Interface sounds**: a soft tap under each touch point (`interface/click_002.ogg` or `ui/click1.ogg`), light keys
  under typing, one gentle chime when the best result lands; 4-6 in all, well under the music. Nothing harsh.
- **A voiceover** only if the job has one: Apple allows narration, and Google recommends captions (Hyped burns them
  in at the bottom, inside the 886 column). Each line says what the screen shows; overlays stay in the top panel. In
  a landscape App Store preview the captions' bottom edge falls below the crop line: note it in the Store upload
  notes.

## Recipes

| The job prompt says | Read |
|---|---|
| Template "App Store Preview" | [recipes/app-store-preview.md](recipes/app-store-preview.md) |
| Template "Play Store Promo" | [recipes/play-store-promo.md](recipes/play-store-promo.md) |
| No template: the brief or the customer names Google Play | [recipes/play-store-promo.md](recipes/play-store-promo.md) |
| No template, otherwise | [recipes/app-store-preview.md](recipes/app-store-preview.md) |

## Common failures

| Failure | Fix |
|---|---|
| The app in a phone frame, or a small screen on a coloured backdrop | Full screen in the 886 column; Apple rejects device frames and framing |
| The marketing site's hero shown as if it were the app | Only the app's screens; the site gives copy, colours and the icon |
| A screen rebuilt in HTML because no capture showed it | Use a listing screenshot, or leave the moment out |
| Text or the app's edge in the side strips, cut off by the 886 crop | Everything in x 97-983; check cropped stills |
| An arrow cursor clicking a phone screen | A touch point: `frame: "none"` on a mobile capture draws a fingertip |
| A touch point or ring placed by eye on a screenshot | Stills get no marks; show the change across two screens |
| Zoom-through, whip or glitch transitions | Dissolves, fades, cuts on the beat, the app's own pushes |
| "Download now", "Free", a store badge or a URL on the end frame | The icon, the name, the promise, any disclosure |
| A 30.4 s App Store preview | 15.5-29.5 s, checked with ffprobe |
| The poster frame at 5 s caught mid-transition | The main screen settled from 4.5 to 5.5 s |
| An Android screen in an Apple preview | Each store gets its own platform's screens |
| A real person's name, email or photo in a captured screen | Public demo data only; Apple asks for fictional account details |
| The story needs the sound | Read the lines alone, in order: they tell it |

## Sources (checked 2026-10-28)

- Apple, App preview specifications (sizes, length, codecs, poster frame default):
  https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/
- Apple, App previews (content, text, music, poster, people):
  https://developer.apple.com/app-store/app-previews/
- Apple, App Review Guidelines, section 2.3 (2.3.3, 2.3.4, 2.3.7-2.3.10):
  https://developer.apple.com/app-store/review/guidelines/
- Apple, Upload app previews and screenshots (poster frame can't change after approval):
  https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Apple Developer Forums, 2.3.4 rejections for device frames and framing: threads 656342 (2020-2024), 797679
  (Aug 2025) and 815379 (Feb 2026), at https://developer.apple.com/forums/thread/<number>
- Google, Add preview assets to showcase your app (video, feature graphic, screenshots):
  https://support.google.com/googleplay/android-developer/answer/9866151
- YouTube, Recommended upload encoding settings: https://support.google.com/youtube/answer/1722171
- iTunes Search API lookup (public JSON; tested on 2026-10-28, including the full-size image trick):
  https://itunes.apple.com/lookup?id=<id>

Not confirmed, so treat with care:
- Device frames: no Apple guideline names them; the ban comes from rejection notices on Apple's forums.
- Whether App Review accepts a preview animated from still screenshots rather than a screen recording.
- Whether current iPhones show a 1080×1920 preview: the specifications list it only for Home-button iPhones, and
  the current classes don't fall back to it.
- The card size a preview plays at on the store page (our estimate) and any word limit for overlays (ours).
- Google: no length, resolution or frame rate for the video beyond YouTube's own; whether "Free" is barred in the
  video itself (it is for the feature graphic).
- Third-party reports that 29.97 fps fails Apple's upload: unconfirmed; Hyped renders exactly 30 fps.
