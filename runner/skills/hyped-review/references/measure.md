# Measure by hand

`scripts/review.mjs measure` runs everything below in one go. Use these commands when the tool fails, or to check one
thing again after a fix. All of them work with ffmpeg 4.4 (the render server's) and newer. Run them from the workspace
root.

## Measure

```bash
V=brag-output/brag.mp4; R=brag-output/work/review; mkdir -p "$R/stills" "$R/seq"

# The file: size, fps (r_frame_rate 30/1), pix_fmt (yuv420p), codecs (h264, aac), duration, bytes.
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate:format=duration,size -of json "$V"

# Loudness. The Summary at the end gives I (integrated, target -14 ±2 LUFS) and the true peak (at or under -1 dBTP).
# The last "M:" line before it is the last 0.4 s: at least 10 LU under I when the sound fades out.
ffmpeg -hide_banner -nostats -i "$V" -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 | tail -16

# Still stretches of 2 s or more. A freeze_start with no freeze_end runs to the end of the video.
ffmpeg -hide_banner -nostats -i "$V" -map 0:v:0 -vf "scale=640:-2,freezedetect=n=0.001:d=2" -f null - 2>&1 | grep freeze_

# Black stretches of 0.3 s or more. It misses blank light frames, and a dark-themed product can trip it: confirm each
# one on a still.
ffmpeg -hide_banner -nostats -i "$V" -map 0:v:0 -vf "scale=640:-2,blackdetect=d=0.3:pix_th=0.10" -f null - 2>&1 | grep black_start

# A full-size still at 1.5 s, and the last frame.
ffmpeg -hide_banner -v error -y -ss 1.5 -i "$V" -frames:v 1 -q:v 3 "$R/stills/hook-1.5.jpg"
ffmpeg -hide_banner -v error -y -sseof -0.5 -i "$V" -update 1 -q:v 3 "$R/stills/last.jpg"

# A sheet: copy its stills into $R/seq as 001.jpg, 002.jpg, ... in order, then tile them. This one is landscape at
# phone size, 3 across, with the text-safe box (x 115-1805, y 86-972) drawn on.
cp "$R/stills/hook-1.5.jpg" "$R/seq/001.jpg"; cp "$R/stills/last.jpg" "$R/seq/002.jpg"
ffmpeg -hide_banner -v error -y -framerate 1 -i "$R/seq/%03d.jpg" -vf "drawbox=x=115:y=86:w=1690:h=886:color=0xFF00FF@0.9:t=8,scale=480:270,tile=2x1:padding=8:margin=8:color=0x202020" -frames:v 1 -q:v 3 "$R/sheet-check.jpg"

# Frame 0 against the poster: 30 dB or more means the poster is baked in. (A README Loop's seam: compare frame 0 with
# last.jpg the same way; it needs 40 dB or more.)
ffmpeg -hide_banner -v error -y -i "$V" -frames:v 1 "$R/stills/frame0.png"
ffmpeg -hide_banner -nostats -i "$R/stills/frame0.png" -i brag-output/brag.jpg -lavfi "[0:v]format=yuv420p[a];[1:v]scale=1920:1080,format=yuv420p[b];[a][b]psnr" -f null - 2>&1 | grep -o "average:[^ ]*"
```

Phone-size tiles: landscape `scale=480:270`, square `scale=390:390`, portrait `scale=390:488`, vertical
`scale=360:640`. Text-safe boxes for `drawbox` (x, y, w, h): landscape `115:86:1690:886` (voiceover `115:86:1690:800`),
square `76:86:928:886` (voiceover `76:86:928:800`), portrait `86:95:908:1147` (voiceover `86:95:908:931`), vertical
`120:270:840:980`.

The tool finds blank frames another way: it runs `format=gray,edgedetect=low=0.1:high=0.25,signalstats` and calls a
frame blank when its average edge value (`YAVG`, 0-255) is under 0.5, which means only background and at most a tiny
label. That works on dark and light products alike.

## Fix

Each command writes `brag-output/work/fixed.mp4` and, if ffmpeg succeeds, moves it over `brag.mp4`; run one, then
the other if both are needed. Both keep frame 0, so the poster stays baked in.

```bash
V=brag-output/brag.mp4

# yuvj420p (or another pixel format) → yuv420p, audio untouched.
ffmpeg -hide_banner -v error -y -i "$V" -map 0:v:0 -map 0:a:0 -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a copy -movflags +faststart brag-output/work/fixed.mp4 && mv brag-output/work/fixed.mp4 "$V"

# The audio faded out over the last 1.5 s and mastered to -14 LUFS, the picture untouched. st = the length - 1.5
# (18.5 for a 20 s video).
ffmpeg -hide_banner -v error -y -i "$V" -map 0:v:0 -map 0:a:0 -c:v copy -af "afade=t=out:st=18.5:d=1.5,loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 192k -movflags +faststart brag-output/work/fixed.mp4 && mv brag-output/work/fixed.mp4 "$V"
```

Better still, fix the mix you built (`work/mix.m4a`, or your music bed) and mux it again, so the AAC is encoded once.
With a voiceover, rerun the voice tool's `mix` instead: it fades the music and masters the result. A wrong frame rate
can't be fixed by re-encoding without dropping or doubling frames: capture again at `t = n / 30`.
