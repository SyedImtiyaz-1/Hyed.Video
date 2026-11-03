# Recipe: App Store Preview (`app-store-preview`)

The video at the top of an app's App Store page, which also plays in search results. Default: 30 s (rendered at
29-29.5 s), vertical, app-store tone, library music, no voiceover. It autoplays muted in a card narrower than the
phone, to someone deciding whether to tap Get, and App Review checks it against Guideline 2.3.4 before it goes live.
So every frame is the app's own screen, full screen, and the whole thing reads without sound.

The `app-store` tone here means its clean type, neat labels and smooth movement, never its device frames: Apple
rejects them.

The job prompt lists the template's beats, scaled to the chosen length. This recipe fills them in; it never changes
their order or meaning.

## Beat sheet at 30 s

| Beat | Time | Scenes | What it must do |
|---|---|---|---|
| Hook | 0-3 | 1 | The app's core moment, full screen, with the hook line |
| Promise | 3-7 | 1 | The app's main screen with its promise, settled at 5 s: the poster frame |
| In use | 7-25 | 3 | Three moments of the app in use, about 6 s each, a label on each |
| End | 25-29.5 | 1 | The icon and the name over the app's best screen, and any disclosure |

Every scene uses the vertical layouts in [../SKILL.md](../SKILL.md): the preview is the centre column x 97-983 of
the 1080×1920 frame, and the strips either side carry only background.

### Hook (0-3 s)
- **Screen**: the core moment already under way, full screen: the result appearing in the app (the week's meals
  filling in, the photo coming clean, the streak ticking up). Frame 0 shows the app, never a logo or a card.
- **Copy**: at most 5 words in the "line over the app" panel, readable at frame 0: what the app does for the viewer,
  in plain words. *"Your week of meals, planned."* (Mossbook, a fictional meal planner.) Not the app's name; that's
  the promise's and the end's job.
- **Camera**: on `"viewport"`, holding with `drift` 0.015 or less. If the moment is a tap, its touch point lands by
  0.8 s and the result appears by 2 s.
- **Out**: a 0.3 s dissolve, or the app's own push to its main screen.
- **Sound**: the music from frame 0 (start the track at a strong cue near its top if its intro is weak); a soft tap
  under the touch point.

### Promise (3-7 s)
- **Screen**: the app's main screen (home, today, the dashboard), whole, full screen. Settled by 4.5 s and still
  until 5.5 s: the frame at 5.0 s is Apple's default poster, and it's the `brag.jpg` you deliver.
- **Copy**: the promise: the listing's subtitle if it's 5 words or fewer and concrete, else the site's headline cut
  to 5 words. The app's name may sit above it as a 52-60 px label: a poster with the name sells better.
- **Camera**: hold. Nothing but a very slow drift moves between 4.5 and 5.5 s.
- **Out**: a dissolve, or the app's own transition into the first moment's screen.
- **Sound**: put the promise's landing on a strong cue.

### In use (7-25 s: three moments of about 6 s)
Each moment: its label arrives with the scene; the action starts by 1.5 s (a tap, typing, a scroll); the result is
in by 3.5 s; then it holds, settled, to the end of the scene.
- **Screen**: full screen. The action and its result sit in the middle and lower part of the screen; the label sits
  above them in the panel or a chip.
- **Copy**: a label of at most 4 words: the feature's own name in the app, or a verb phrase. *"Swap any meal"*,
  *"Shopping list, done"*. With music only, the label may grow to a 5-word line in the panel instead.
- **Camera, on a web capture**: touch points (`cursor` marks with `click: true`) on the real elements, `type` marks in
  the real field, `scroll` as a finger would. At most one zoom in the three moments, to 1.6× at most, only to make the
  result readable, then back to the whole screen.
- **Camera, on stills**: two or three screenshots that show the change (the list, then the detail it opens), joined
  by the app's own kind of transition, each held long enough to read. No touch points or rings on stills.
- **Order**: the order a new user meets them; the most visual moment last, never buried in the middle.
- **Out**: vary between a dissolve, a cut on the beat, and the app's own push; 0.2-0.4 s, never the same twice in a
  row.
- **Sound**: a soft tap under each touch point, light keys under typing, one gentle chime when the best result
  lands. Six effects at most across the three moments.

### End (25-29.5 s)
- **Screen**: the end frame: the app's best screen dimmed or blurred behind the icon (the listing's, with rounded
  corners), the name, and the promise again or one benefit line. Settled by 25.8 s and held to the last frame.
- **Copy**: the name as the store shows it. If a feature shown needs a subscription, a purchase or an account, a
  36-40 px line under it: *"Some features need a subscription."* or *"Requires an account."* Never "Download", "on
  the App Store", a badge, a web address or a price.
- **Sound**: the music resolves, faded over the last 1.5 s. The file ends by 29.5 s.

## Other lengths

Apple takes 15 to 30 seconds only. The rendered file runs between 15.5 and 29.5 seconds whatever the job asks; the
Hook keeps at least 2.5 s and the End at least 2.5 s settled.

| Length asked | Shape (render length) |
|---|---|
| 15 s | 16 s: Hook 0-3 · Promise 3-6 (the poster at 5 s) · one moment with two actions 6-13 · End 13-16 |
| 20 s | 20 s: Hook 0-3 · Promise 3-6.5 · two moments 6.5-16.5 · End 16.5-20 |
| 30 s | 29-29.5 s: the beat sheet above |
| 60 or 90 s | 29.5 s: the 30 s shape. Say in the Store upload notes that Apple takes 30 s at most, and suggest what a second and third preview could show (Apple allows three per language) |

## Other formats

- **Landscape** (an app used sideways: a game, a video or drawing app): 1920×1080, with the preview in the band
  y 97-983 (Apple's 1920×886 for current iPhones); everything that matters inside it, background only above and
  below. Use the app's landscape screens. If the app is used upright, a landscape preview is the wrong shape: make
  the most of the frame and say so in the notes.
- **A Mac app**: landscape 1920×1080 is exactly Apple's Mac size. The Mac app's own window content fills the frame:
  no browser window around it, no desktop.
- **iPad**: Apple wants 1200×1600 (3:4); Hyped has no such frame. Make the iPhone preview and say so in the notes.
- **Square or 4:5**: Apple takes neither. Make the best store-style video in the frame and say in the notes that it
  can't be uploaded to the App Store as it is.

## Voiceover or music only

- **Music only** (the default): the lines carry the story; read them alone, in order, and they tell it. One track
  from start to finish; cut on its beats.
- **Voiceover** (if the job has one): one short line per beat, saying what's on screen; the overlay agrees with the
  line. Keep the script short enough that the video still ends by 29.5 s: cut words, never run past it. Captions are
  burned in at the bottom, inside the 886 column, so overlays stay in the top panel.

## Store upload notes

End `brag-plan.md` with this section, filled in:

```
## Store upload (App Store)
- For current iPhones, Apple takes 886×1920. Crop this video before uploading (ffmpeg, one line):
  ffmpeg -i brag.mp4 -vf "crop=886:1920:97:0" -r 30 -c:v libx264 -profile:v high -level:v 4.0 -pix_fmt yuv420p -b:v 11M -maxrate 12M -bufsize 22M -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart app-preview.mp4
  Upload app-preview.mp4 in App Store Connect for the largest iPhone display; Apple scales it to the smaller iPhones.
- The video as delivered (1080×1920) is accepted only for older iPhones with a Home button.
- Length: <seconds> (Apple accepts 15-30 s).
- Poster frame: 5.0 s, Apple's default (<what's on screen there>). To use another frame, set it in App Store Connect
  before you submit; it can't change after approval without a new preview.
- Disclosures shown: <the line on the end frame, or "none needed">.
- Screens: <each source>. <If stills only: "Built from still screenshots: Apple asks for screen captures, so review may
  ask for a screen recording.">
```

For a landscape preview, the crop is `crop=1920:886:0:97`; for a Mac app, upload the video as it is.

## Done when
- [ ] `ffprobe`: 1080×1920, 30 fps, an audio stream, and a duration between 15.5 and 29.5 s.
- [ ] Stills cropped to the column (`ffmpeg ... -vf crop=886:1920:97:0`) at 1.5 s, 5.0 s, the middle of each moment and
      the last second: every word and the app's screen are whole in the crop, and the strips held only background.
- [ ] Every frame is the app's own screen, an overlay on it, or the end frame over it: no device, frame, border,
      backdrop, hand, person, browser window or marketing-site section.
- [ ] Frame 0: the app with the hook line readable. The frame at 5.0 s: settled, full screen, the promise; `brag.jpg`
      is that frame.
- [ ] Every tap is a fingertip touch point on a real element; no arrow cursor; nothing placed by eye on a still.
- [ ] No price, "Free", date, season, ranking, rating, "Download", badge, web address or other platform.
- [ ] Transitions are dissolves, fades, cuts or the app's own pushes; one music track from start to finish.
- [ ] The plan ends with the Store upload notes.
