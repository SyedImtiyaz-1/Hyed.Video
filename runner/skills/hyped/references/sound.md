# Sound

The job prompt says which kind of sound this video has. Sound is half of how a video feels: a real track, cut to the
picture, with a few effects that land with the motion.

## Library music (the default)

1. Read `.hyped/audio/README.md`. If the job prompt names a track, use it; otherwise choose one at least as long as
   the video, with a tempo that suits the tone.
2. Open the track's cue file (`music/cues/<track>.music-cues.md`): beat times and strong cues. Start the track at a
   strong cue near its top if its intro is weak.
3. Cut to it: lock 1-3 **major moments** (the reveal, the biggest transition, the end card) within 0.15 s of strong
   cues; snap small sequential events (items arriving one by one) within 0.1 s of beats. Readability comes first: if
   beats are less than 0.6 s apart, reveal readable lines on every other beat.
4. Trim it to the video's length: fade in over 0.2 s, fade out over the last 1.5 s so the end card resolves.
5. Write the track's file name to `brag-output/music.txt`.

## Composed music

Only when the job asks for it. Write the music and the effects as one piece: the same key, the same space, effects
blended in, not laid on top. Keep it simple and well mixed: a steady pulse, a clear lift at the reveal, a resolution
on the end card. Nothing harsh, no clipping.

## No music

At most a few subtle sound effects at key moments, or none. Silence is fine: the picture carries it.

## Sound effects

- From `.hyped/audio/sfx/`. Check `sfx-analysis.md`: for repeated or polished moments use sounds marked low
  high-frequency risk; keep bright, sharp ones for single accents.
- Match the motion: a soft whoosh on a push or wipe, a click on a cursor click, keys on typing, a gentle hit or bell
  when the result lands, a riser into the reveal. The sound starts with the motion (a whoosh peaks on the cut).
- Few: 4-8 in a 20-second video. Repeated small sounds sit far below the music. None on every single item.
- Mix them 8-14 dB under the music's peaks; nothing spiky.

## Mix and loudness

- Master the final mix to about -14 LUFS integrated, peaks under -1 dBTP (ffmpeg's `loudnorm` with
  `I=-14:TP=-1:LRA=11`).
- With a voiceover, the voice tool ducks the music under the voice and masters the mix (the job prompt gives the
  command): use its `mix.m4a`.
- Check the result: listen for clipping, an abrupt end, or effects louder than the music.
