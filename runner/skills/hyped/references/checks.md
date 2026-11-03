# Checks: look at your own frames before the full render

You can see images: use that. Every check below is about what's actually in the frames, not what the code meant.
These are the things the `hyped-review` skill scores in the finished video: a failure caught in a still costs a
screenshot, one caught after the render costs a re-render.

## Before the full render

Render single frames (call `render(t)` and screenshot) and look at them:

- **The middle of every scene**, once everything has arrived.
- **The middle of every transition**.
- **Second 1.5 and second 3** (the hook) and **the last second** (the end card).

Put them side by side in one contact sheet (ffmpeg `tile`, or a grid page) so you see the whole video at once.

Each still passes when:

- [ ] It's clearly about this product: its UI, its words, its colours.
- [ ] Every line of text is readable at phone size, in the right font (no fallback), with enough contrast.
- [ ] Nothing overlaps by accident, nothing is cut off at an edge, nothing sits in the format's unsafe zones or (with
      a voiceover) in the caption band.
- [ ] The product's UI fills most of the frame; small UI text is readable.
- [ ] Rings, cursors, typed text and labels sit exactly on their elements.
- [ ] A transition frame isn't a muddy double exposure.
- [ ] The hook stills show real UI or a real result plus the hook line; the last still shows the call to action large.

Fix every failure and check those stills again. Then render the whole video.

## After the render

Bake in the poster (below), then review the finished video with the `hyped-review` skill. It measures the file (size,
fps, pixel format, length, loudness, still and blank stretches, the poster), makes contact sheets of what the encoded
video really shows, runs the voiceover's `frames` check with you, scores it against its rubric and takes you through
up to two fix rounds. Don't repeat those checks here.

## The poster

Pick the strongest **settled** frame (text fully in, not mid-transition): usually the hook's payoff or the hero shot,
not the end card. Save it as `brag-output/brag.jpg` at full size, and bake it in as frame 0 of `brag.mp4` (replace
frame 0, don't add a frame, so the length and audio sync don't change). Platforms use frame 0 as the thumbnail. Do it
right after the render, before the review: the review checks that frame 0 is the poster.

## Share copy

`brag-output/share-copy.txt`: 1-3 sentences, postable as-is, in the video's tone, specific to this product (what it
does, for whom, the link). No "excited to share", no hashtags wall, at most one emoji.
