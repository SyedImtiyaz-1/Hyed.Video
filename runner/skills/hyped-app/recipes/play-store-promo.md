# Recipe: Play Store Promo (`play-store-promo`)

The preview video on an app's Google Play listing. The customer uploads it to YouTube and pastes the link into Play
Console; Play shows it before the screenshots, with a play button over the feature graphic, and may autoplay it muted
for up to 30 seconds on the listing, home and search pages. Default: 30 s, landscape, playful tone, library music, no
voiceover. The viewer is deciding whether to install, often with the sound off, so the app is on screen from the
first frame and the story is told, readable, by second 30.

The job prompt lists the template's beats, scaled to the chosen length. This recipe fills them in; it never changes
their order or meaning.

## Beat sheet at 30 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Hook | 0-3 | 1 | The app's core moment in its real screens, with the hook line |
| Core | 3-11 | 2 | The main thing people do in the app: the action, then the result |
| More | 11-25 | 2 | Two more features in use, about 7 s each, a label on each |
| End | 25-30 | 1 | The icon, the name and the promise, with the app beside them |

Google wants at least 80% of the video to show the app in use: count the seconds of title cards, logo and end
frame, and keep them to 6 of 30 at most.

## Layouts (1920×1080)

Most Play apps are phone apps used upright. In this wide frame their screens sit beside the words as large,
frameless panels: no phone body, no black bars, never a small screen floating in empty space.

| Layout | Geometry | Use it for |
|---|---|---|
| **Screen and words** (default) | The words in a column x 115-860, left-aligned (the landscape guide's split layout: a 32-40 px label, an 80-104 px line). The app in a panel x 960-1760, y 60-1020 (800×960) with rounded corners (36-48 px) and a soft shadow: `.hyped/camera.js` inside it with `frame: "none"`, showing the part of the screen in use at about 2× (the screen's full width, about half its height), moving and scrolling with the action. | Most scenes |
| **Whole screen** | One whole screen in a panel y 90-990 (about 415 wide), beside the words | Orientation only, 2 s at most: its text is small |
| **Three screens** | Three whole screens about 760 tall and 350 wide, 80 px apart, centred; the active one bright, the others dimmed to 50% | A flow at a glance, 3 s at most |
| **Full frame** | The app's screen fills the frame; the label on a chip at x 115, y 86 | Apps that run in landscape: tablets, Chromebooks, games |
| **End frame** | The brand colour; centred in y 200-820: the icon 200-240 px (rounded corners), the name 88-104 px, the promise 48-56 px; a whole-screen panel of the app's best screen may stand beside them | The last 3-5 s |

Capture a web app at `--viewport 390x845` (mobile, sharp at 3×) for phone screens; for a landscape app, at the
app's own landscape size (for example `--viewport 1280x800`).

### Hook (0-3 s)
- **Screen**: the core moment already under way in "screen and words": the result appearing on the app's screen.
  Frame 0 shows the app and the line, never a logo.
- **Copy**: at most 5 words in the column: what the app does for the viewer. *"Every receipt, already sorted."*
  (Tallybird, a fictional expense app.)
- **Camera**: on the part of the screen where the result appears; a touch point lands by 0.8 s on a web capture.
- **Out**: a 0.3 s dissolve or a cut on the beat into Core.
- **Sound**: the music from frame 0; a soft tap under the touch point.

### Core (3-11 s, two scenes)
- **Screen**: the main thing people do, from the first tap to the result. Scene A: the action (the field filling,
  the button tapped). Scene B: the result, close enough to read, then a beat on the whole screen for context.
- **Copy**: a label of at most 4 words, the feature's own name in the app (*"Snap a receipt"*), and with music only
  one benefit line of at most 6 words under it.
- **Camera**: web capture: touch points on the real elements, `type` in the real field, `scroll` as a finger would;
  at least 1.5 s between moves. Stills: two screenshots, before and after, joined by a dissolve or the app's own push.
- **Out**: a dissolve or a sideways push, on a beat.
- **Sound**: taps and light keys under the action, one soft chime on the result.

### More (11-25 s, two features)
- **Screen**: each feature working, one scene each: the action, then its result held settled for at least 1.5 s.
  Show a different part of the app each time; use "three screens" once if a feature is a flow.
- **Copy**: one label per feature, at most 4 words; with music only, a benefit line of at most 6 words.
- **Order**: the more visual feature last.
- **Out**: vary between a dissolve, a cut on the beat and a push; never the same twice in a row.
- **Sound**: no more than six effects across Core and More together.

### End (25-30 s)
- **Screen**: the end frame, settled by 25.6 s and held to the last frame.
- **Copy**: the name as the listing shows it and the promise. No "Download now", "Install now" or "Try now", no store
  badge, no web address, no price or "Free".
- **Sound**: the music resolves, faded over the last 1.5 s.

## Other lengths

| Length | Shape |
|---|---|
| 15 s | Hook 0-3 · Core 3-9 (one scene) · one more feature 9-12 · End 12-15 |
| 20 s | Hook 0-3 · Core 3-9 · one more feature 9-16 · End 16-20 |
| 30 s | The beat sheet above |
| 60 s | The first 30 s tell the whole story, since only they autoplay: Hook 0-3 · Core 3-11 · two features 11-24 · the icon and name over the app 24-28 · then two or three more features or a second flow 28-54 · End 54-60 |
| 90 s | As 60 s, with more features after second 30; nothing essential comes after it |

## Other formats

- **Vertical** (an app used upright, if the job is vertical): the app fills the whole 1080×1920 frame, edge to edge:
  Google asks for no black bars beside a portrait video, so no strips or panels either. Capture a web app at
  `--viewport 390x693` (the frame's 9:16 shape); show a taller screenshot with the camera's `zoom` set so it fills the
  width (about 1.22 for a 19.5:9 screenshot) and move between its top and bottom. Words follow the vertical format
  guide's text-safe box.
- **Square or 4:5**: YouTube plays them, but Google names only landscape and portrait for the listing: make the
  video in the job's frame and say in the notes that landscape or vertical is safer.

## Voiceover or music only

- **Music only** (the default): the lines carry the story, and by second 30 they've told it with the sound off.
- **Voiceover** (if the job has one): one short line per scene, saying what's on screen; the label agrees with it.
  Google recommends captions with speech; Hyped burns them in at the bottom, so keep every word above y 886, and give
  the panel's camera the share of the panel below that line as its inset (`inset: { bottom: 0.14 }` for the default
  panel).

## Store upload notes

End `brag-plan.md` with this section, filled in:

```
## Store upload (Google Play)
- Upload brag.mp4 to YouTube as it is (1920×1080, H.264, 30 fps, AAC stereo: within YouTube's recommended settings).
- On YouTube: set it to Public or Unlisted (not Private), turn ads and monetization off, don't age-restrict it, and
  allow embedding.
- In Play Console, paste the video's own link (https://www.youtube.com/watch?v=...), not a playlist or channel, with
  no timecode or other parameters.
- Play shows the video behind your feature graphic (1024×500, JPEG or 24-bit PNG without transparency), which every
  listing needs: keep its main elements near the centre.
- Language: <the video's language>. A localised listing gets its own video.
- Screens: <each source>.
```

## Done when
- [ ] `ffprobe`: 1920×1080 (or the job's frame), 30 fps, an audio stream, the requested length within 10%.
- [ ] The app's real screens from frame 0; title, logo and end-frame seconds are 20% of the length or less.
- [ ] Read the lines alone, in order: by second 30 they tell what the app does and its name.
- [ ] No call to action, badge, web address, price, date, ranking, download count, or "Best", "#1", "Top", "New",
      "Free", "Sale".
- [ ] No device frame, hands, people or black bars; no screen small in empty space.
- [ ] Every tap is a fingertip touch point on a real element; nothing placed by eye on a still.
- [ ] The end frame is settled for at least 2.5 s.
- [ ] The plan ends with the Store upload notes.
