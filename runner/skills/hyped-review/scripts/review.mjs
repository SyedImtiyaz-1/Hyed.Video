#!/usr/bin/env node
// hyped-review's tool: measures a finished video and checks the review file. Needs Node 18+, ffmpeg and ffprobe
// (4.4 or newer). Nothing here calls the network.
//
//   node review.mjs measure <video.mp4> [options]
//       Probes the file, measures loudness, finds frozen and blank stretches, checks the poster, and makes contact
//       sheets to look at. Writes <out>/measure.json and <out>/sheet-*.jpg, and prints a summary with flags.
//       --out <dir>          where to write (default: brag-output/work/review)
//       --length <s>         the job's requested length, to check the duration
//       --scenes <a,b,...>   scene boundaries from brag-plan.md's storyboard, in seconds: 0,3,6.5,11,15.5,20
//       --voiceover          the video has a voiceover (caption band, 15% duration tolerance)
//       --loop               a seamless loop (README Loop): checks the seam, skips the hook-motion flag
//       --poster <file>      the poster to compare with frame 0 (default: brag.jpg next to the video)
//       --size <WxH>         the job's exact frame size (default: any Hyped size)
//       --safe <x0,y0,x1,y1> the text-safe box in frame pixels, for a format this tool doesn't know
//
//   node review.mjs score <review.json> [--measure <measure.json>]
//       Checks review.json against the schema in SKILL.md, fills in each criterion's weight and max, computes score
//       and passed (no hard fails, no criterion at 0, score >= 80), copies "measured" from measure.json (default:
//       work/review/measure.json beside review.json), and writes it back. Prints what's wrong and exits 1 if the file
//       doesn't fit the schema.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const CRITERIA = [
  { id: "hook", weight: 12 },
  { id: "clarity", weight: 12 },
  { id: "real-material", weight: 12 },
  { id: "readability", weight: 10 },
  { id: "layout", weight: 8 },
  { id: "motion", weight: 10 },
  { id: "camera", weight: 6 },
  { id: "sound", weight: 8 },
  { id: "end-card", weight: 8 },
  { id: "technical", weight: 6 },
  { id: "scenario", weight: 8 },
];
const HARD_FAILS = ["wrong-size", "missing-audio", "frozen", "blank", "fallback-font", "invented-claim", "unsafe-text", "no-cta", "secret-on-screen"];
const PASS_SCORE = 80;
const MAX = 2;

// Frame sizes Hyped renders (packages/core FORMAT_FRAMES), from the format guides in ../hyped/formats/. safe/safeVoice:
// the text-safe box (x0, y0, x1, y1), without and with a voiceover. tile: the phone-size width a still is checked at.
// change: the longest stretch with no visible change.
const FORMATS = {
  "1920x1080": { name: "landscape", safe: [115, 86, 1805, 972], safeVoice: [115, 86, 1805, 886], tile: 480, change: 3 },
  "1080x1080": { name: "square", safe: [76, 86, 1004, 972], safeVoice: [76, 86, 1004, 886], tile: 390, change: 2.5 },
  "1080x1920": { name: "vertical", safe: [120, 270, 960, 1250], safeVoice: [120, 270, 960, 1250], tile: 360, change: 2 },
  "1080x1350": { name: "portrait", safe: [86, 95, 994, 1242], safeVoice: [86, 95, 994, 1026], tile: 390, change: 2.5 },
};
const FREEZE_NOISE = 0.001; // freezedetect's tolerance: below it, nothing visibly changed
const FREEZE_REPORT = 2; // report frozen stretches this long or longer
const FREEZE_HARD = 5; // a frozen stretch this long (not the end card's hold) can't ship
const END_HOLD_MAX = 5; // an end card held perfectly still longer than this drags
const BLANK_EDGES = 0.5; // edge density (0-255) under which a frame is only background, at most a tiny label
const BLACK_LUMA = 40; // a blank frame this dark is black
const BLANK_HARD = 1; // seconds of blank that can't ship
const BLANK_REPORT = 0.4; // seconds of blank worth a flag
const LOUD_TARGET = -14;
const LOUD_TOLERANCE = 2;
const PEAK_MAX = -1;
const FADE_DROP = 10; // the last 0.4 s sits at least this many LU under the integrated loudness
const AUDIBLE = -50; // integrated loudness above this means there's sound
const POSTER_PSNR = 30;
const SEAM_PSNR = 40;
const SHEET_PIXELS = 1.25e6; // keep sheets small enough that viewers don't shrink them further
const SHEET_WIDTH = 1600;

const round = (n, d = 2) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);
const num = (s) => (s === "inf" ? Infinity : s === "-inf" ? -Infinity : Number(s));
const die = (msg) => {
  console.error(`review: ${msg}`);
  process.exit(1);
};

function ffmpeg(args, cwd) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-y", ...args], { cwd, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
  if (r.error) die(`can't run ffmpeg: ${r.error.message}`);
  return { ok: r.status === 0, log: r.stderr ?? "" };
}

function probe(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=index,codec_type,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames,sample_rate,channels:format=duration,size", "-of", "json", file], { encoding: "utf8" });
  if (r.error) die(`can't run ffprobe: ${r.error.message}`);
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

const rate = (s) => {
  const [a, b] = String(s ?? "0/1").split("/").map(Number);
  return b ? a / b : a;
};

/* ---------------- measure ---------------- */

function parseArgs(argv) {
  const opts = { flags: new Set() };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--voiceover" || a === "--loop") opts.flags.add(a.slice(2));
    else if (a.startsWith("--")) opts[a.slice(2)] = argv[++i];
    else rest.push(a);
  }
  return { opts, rest };
}

/** One decode pass: frozen stretches (freezedetect), and per frame its brightness and edge density (signalstats). */
function analyseVideo(video, out) {
  const chain = [
    "scale=640:-2",
    `freezedetect=n=${FREEZE_NOISE}:d=${FREEZE_REPORT}`,
    "signalstats",
    "metadata=mode=print:key=lavfi.signalstats.YAVG:file=luma.txt",
    "format=gray",
    "edgedetect=low=0.1:high=0.25",
    "signalstats",
    "metadata=mode=print:key=lavfi.signalstats.YAVG:file=edges.txt",
  ].join(",");
  const r = ffmpeg(["-i", video, "-map", "0:v:0", "-vf", chain, "-f", "null", "-"], out);
  if (!r.ok) die(`ffmpeg couldn't decode the video:\n${r.log.slice(-1500)}`);
  const freezes = [];
  for (const line of r.log.split("\n")) {
    const s = line.match(/freeze_start: ([\d.]+)/);
    if (s) freezes.push({ start: Number(s[1]), end: null });
    const e = line.match(/freeze_end: ([\d.]+)/);
    if (e && freezes.length) freezes[freezes.length - 1].end = Number(e[1]);
  }
  const series = (file) => {
    const rows = [];
    let t = null;
    for (const line of readFileSync(join(out, file), "utf8").split("\n")) {
      const f = line.match(/pts_time:([-\d.e]+)/);
      if (f) t = Number(f[1]);
      const v = line.match(/YAVG=([-\d.e]+)/);
      if (v && t !== null) rows.push({ t, v: Number(v[1]) });
    }
    return rows;
  };
  const luma = series("luma.txt");
  const edges = series("edges.txt");
  rmSync(join(out, "luma.txt"), { force: true });
  rmSync(join(out, "edges.txt"), { force: true });
  return { freezes, frames: edges.map((e, i) => ({ t: e.t, edges: e.v, luma: luma[i]?.v ?? 0 })) };
}

/** EBU R128: integrated loudness, range, true peak, and the momentary loudness every 0.1 s. */
function analyseAudio(video) {
  const r = ffmpeg(["-i", video, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"]);
  if (!r.ok) return null;
  const momentary = [];
  for (const m of r.log.matchAll(/t:\s*([\d.]+)\s+TARGET:\S+\s+LUFS\s+M:\s*(\S+)/g)) momentary.push({ t: Number(m[1]), m: num(m[2]) });
  const summary = r.log.slice(r.log.lastIndexOf("Summary:"));
  const pick = (re) => {
    const m = summary.match(re);
    return m ? num(m[1]) : null;
  };
  return {
    integrated: pick(/I:\s+(\S+)\s+LUFS/),
    range: pick(/LRA:\s+(\S+)\s+LU\b/),
    truePeak: pick(/Peak:\s+(\S+)\s+dBFS/),
    momentary,
  };
}

function psnr(a, b, w, h) {
  const r = ffmpeg(["-i", a, "-i", b, "-lavfi", `[0:v]scale=${w}:${h},format=yuv420p[a];[1:v]scale=${w}:${h},format=yuv420p[b];[a][b]psnr`, "-f", "null", "-"]);
  const m = r.log.match(/average:(\S+)/);
  return m ? num(m[1]) : null;
}

/** Runs of consecutive frames that pass a test, as { start, end, duration }. */
function runs(frames, test, fps) {
  const out = [];
  let start = null;
  frames.forEach((f, i) => {
    if (test(f) && start === null) start = i;
    if ((!test(f) || i === frames.length - 1) && start !== null) {
      const last = test(f) ? i : i - 1;
      out.push({ start: frames[start].t, end: frames[last].t + 1 / fps, duration: (last - start + 1) / fps, first: start, last });
      start = null;
    }
  });
  return out;
}

/** Columns and rows for n tiles of w×h in a sheet no wider than maxW and no larger than SHEET_PIXELS. */
function grid(n, w, h) {
  const maxCols = Math.max(1, Math.min(n, Math.floor(SHEET_WIDTH / (w + 8)), Math.floor(SHEET_PIXELS / (w * h))));
  const rows = Math.ceil(n / maxCols);
  return { cols: Math.ceil(n / rows), rows }; // balanced: 4 tiles as 2×2 rather than 3 + 1
}

function overviewTile(n, width, height) {
  // The largest tile that fits n stills in about 1536×960.
  let best = { w: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = Math.floor(Math.min(1536 / cols, (960 / rows) * (width / height)) / 2) * 2;
    if (w > best.w) best = { w, cols };
  }
  return best;
}

function measure(argv) {
  const { opts, rest } = parseArgs(argv);
  const video = rest[0] ? resolve(rest[0]) : die("usage: review.mjs measure <video.mp4> [--out dir] [--length s] [--scenes 0,3,...] [--voiceover] [--loop]");
  if (!existsSync(video)) die(`no video at ${video}`);
  const out = resolve(opts.out ?? "brag-output/work/review");
  rmSync(join(out, "stills"), { recursive: true, force: true });
  for (const f of existsSync(out) ? readdirSync(out) : []) if (/^sheet-.*\.jpg$/.test(f)) rmSync(join(out, f));
  mkdirSync(join(out, "stills"), { recursive: true });
  const voiceover = opts.flags.has("voiceover");
  const loop = opts.flags.has("loop");
  const flags = [];
  const flag = (where, text) => flags.push({ where, text });

  // ---- the file
  const info = probe(video);
  const v = info?.streams?.find((s) => s.codec_type === "video");
  if (!v) die(`${video} has no readable video stream (hard fail: wrong-size)`);
  const a = info.streams.find((s) => s.codec_type === "audio") ?? null;
  const width = v.width;
  const height = v.height;
  const fps = rate(v.r_frame_rate) || rate(v.avg_frame_rate);
  const duration = Number(info.format?.duration ?? v.duration ?? 0);
  const bytes = statSync(video).size;
  const size = `${width}x${height}`;
  const format = FORMATS[size] ?? null;
  const safe = opts.safe ? opts.safe.split(",").map(Number) : format ? (voiceover ? format.safeVoice : format.safe) : null;
  if (opts.size && opts.size !== size) flag("HARD wrong-size", `the frame is ${size}, the job asks for ${opts.size}`);
  else if (!format) flag("HARD wrong-size", `${size} isn't a Hyped frame size (${Object.entries(FORMATS).map(([k, f]) => `${f.name} ${k}`).join(", ")})`);
  if (Math.abs(fps - 30) > 0.01) flag("technical", `${round(fps, 3)} fps, not 30`);
  if (v.pix_fmt !== "yuv420p") flag("technical", `pixel format ${v.pix_fmt}, not yuv420p (re-encode with -pix_fmt yuv420p)`);
  if (v.codec_name !== "h264") flag("technical", `video codec ${v.codec_name}, not h264`);
  if (!a) flag("HARD missing-audio", "no audio stream: the runner needs an AAC track, even a silent one");
  else if (a.codec_name !== "aac") flag("technical", `audio codec ${a.codec_name}, not aac`);
  if (opts.length) {
    const want = Number(opts.length);
    const tol = voiceover ? 0.15 : 0.1;
    if (Math.abs(duration - want) > want * tol) flag("technical", `${round(duration)} s long; the job asks for ${want} s (±${tol * 100}%)`);
  }
  if (loop && bytes > 5 * 1024 * 1024) flag("scenario", `${round(bytes / 1048576, 1)} MB; a README loop stays under 5 MB`);

  // ---- motion and blank frames
  const { freezes: rawFreezes, frames } = analyseVideo(video, out);
  if (!frames.length) die("ffmpeg decoded no frames");
  const lastT = frames[frames.length - 1].t;
  const end = lastT + 1 / fps;
  const freezes = rawFreezes.map((f) => {
    const stop = f.end ?? end;
    return { start: round(f.start), end: round(stop), duration: round(stop - f.start), toEnd: stop >= end - 1.5 / fps };
  });
  const change = format?.change ?? 2.5;
  const endHold = freezes.find((f) => f.toEnd) ?? null;
  let longestFreeze = 0;
  for (const f of freezes) {
    if (f.toEnd) {
      if (f.duration > END_HOLD_MAX && !loop) flag("motion", `the last ${f.duration} s are completely still (${f.start}-${f.end} s); an end card holds 2-4 s`);
      continue;
    }
    longestFreeze = Math.max(longestFreeze, f.duration);
    if (f.start < 0.05 && !loop) flag("hook", `nothing moves for the first ${f.duration} s; something should move within 1 s`);
    if (f.duration >= FREEZE_HARD) flag("HARD frozen", `nothing changes for ${f.duration} s (${f.start}-${f.end} s)`);
    else if (f.duration > change) flag("motion", `nothing changes for ${f.duration} s (${f.start}-${f.end} s); ${format?.name ?? "this format"} needs a change at least every ${change} s`);
  }
  if (!loop && (!endHold || endHold.duration < 2)) flag("end-card", `the frame isn't completely still for the last 2 s${endHold ? ` (still for ${endHold.duration} s)` : ""}: fine if only a slow push-in or background drift moves; check sheet-end.jpg`);

  const blanks = runs(frames, (f) => f.edges < BLANK_EDGES, fps).map((b) => {
    const dark = frames.slice(b.first, b.last + 1).reduce((s, f) => s + f.luma, 0) / (b.last - b.first + 1) < BLACK_LUMA;
    return { start: round(b.start), end: round(b.end), duration: round(b.duration), black: dark };
  });
  const blankSec = blanks.reduce((s, b) => s + b.duration, 0);
  for (const b of blanks) {
    const what = b.black ? "black" : "blank (only background)";
    if (b.start < 0.05) flag("HARD blank", `frame 0 is ${what}${b.duration > 0.05 ? ` until ${b.end} s` : ""}: it's the thumbnail`);
    else if (b.duration >= BLANK_HARD) flag("HARD blank", `${what} for ${b.duration} s (${b.start}-${b.end} s)`);
    else if (b.end >= end - 0.05) flag("end-card", `the video ends on a ${what} frame (${b.start}-${b.end} s), not the end card`);
    else if (b.duration >= BLANK_REPORT) flag("motion", `${what} for ${b.duration} s (${b.start}-${b.end} s): a dead moment between scenes`);
  }

  // ---- sound
  let audio = null;
  if (a) {
    audio = analyseAudio(video);
    if (!audio) flag("HARD missing-audio", "the audio stream can't be decoded");
  }
  let lastM = null;
  let silences = [];
  if (audio) {
    const I = audio.integrated;
    const audible = Number.isFinite(I) && I > AUDIBLE;
    lastM = audio.momentary.length ? audio.momentary[audio.momentary.length - 1].m : null;
    silences = runs(audio.momentary.map((m) => ({ t: m.t, m: m.m })), (m) => !(m.m > -45), 10)
      .filter((s) => s.duration >= 1 && s.start > 0.4 && s.end < duration - 0.4)
      .map((s) => ({ start: round(s.start - 0.1, 1), end: round(s.end - 0.1, 1), duration: round(s.duration, 1) }));
    if (!audible) flag("sound", `the audio is silent (${Number.isFinite(I) ? I : "-inf"} LUFS): right only for a silent video (README Loop, or no music and no effects); hard fail missing-audio if the job asked for music or a voice`);
    else {
      if (Math.abs(I - LOUD_TARGET) > LOUD_TOLERANCE) flag("sound", `integrated loudness ${I} LUFS; the target is ${LOUD_TARGET} ±${LOUD_TOLERANCE}`);
      if (audio.truePeak > 0) flag("sound", `true peak ${audio.truePeak} dBTP: it clips`);
      else if (audio.truePeak > PEAK_MAX) flag("sound", `true peak ${audio.truePeak} dBTP; keep peaks under ${PEAK_MAX} dBTP`);
      if (Number.isFinite(lastM) && lastM > I - FADE_DROP) flag("sound", `the last 0.4 s are at ${lastM} LUFS, only ${round(I - lastM, 1)} LU under the mix: fade out over the last 1.5 s`);
      for (const s of silences) flag("sound", `silent ${s.start}-${s.end} s (${s.duration} s) in the middle of the video`);
    }
  }

  // ---- stills: one decode pass picks every frame the sheets need
  const nearest = (t) => {
    let best = 0;
    for (let i = 0; i < frames.length; i++) if (Math.abs(frames[i].t - t) < Math.abs(frames[best].t - t)) best = i;
    return best;
  };
  const shots = [];
  const add = (sheet, label, t, n = nearest(t)) => shots.push({ sheet, label, t: round(frames[n].t), n });
  const nOverview = duration <= 30 ? 12 : 16;
  for (let i = 0; i < nOverview; i++) add("overview", `${i + 1}`, ((i + 0.5) * end) / nOverview);
  add("hook", "frame 0", 0, 0);
  for (const t of [1, 1.5, 3]) if (t < end) add("hook", `${t} s`, t);
  for (const back of [2.5, 2, 1]) if (end - back > 0) add("end", `${back} s before the end`, end - back);
  add("end", "last frame", lastT, frames.length - 1);
  const bounds = (opts.scenes ?? "").split(",").filter((s) => s.trim() !== "").map(Number);
  if (opts.scenes && (bounds.some((b) => !Number.isFinite(b)) || bounds.some((b, i) => i && b <= bounds[i - 1]))) die(`--scenes needs ascending seconds, like 0,3,6.5,11: got ${opts.scenes}`);
  for (let i = 0; i + 1 < bounds.length; i++) add("scenes", `scene ${i + 1} (${bounds[i]}-${bounds[i + 1]} s), middle`, (bounds[i] + bounds[i + 1]) / 2);
  for (let i = 1; i + 1 < bounds.length; i++) add("cuts", `scene ${i} → ${i + 1}`, bounds[i]);
  if (bounds.length < 2) flag("note", "no --scenes given: pass the storyboard's scene boundaries to get a still from the middle of every scene");

  const picks = [...new Set(shots.map((s) => s.n))].sort((x, y) => x - y);
  const tmp = join(out, "stills", "tmp");
  mkdirSync(tmp, { recursive: true });
  const select = `select='${picks.map((n) => `eq(n,${n})`).join("+")}',setpts=N/30/TB`;
  const ex = ffmpeg(["-i", video, "-map", "0:v:0", "-vf", select, "-q:v", "3", join(tmp, "%03d.jpg")]);
  if (!ex.ok) die(`ffmpeg couldn't extract stills:\n${ex.log.slice(-1500)}`);
  const fileFor = new Map(picks.map((n, i) => [n, join(tmp, `${String(i + 1).padStart(3, "0")}.jpg`)]));
  const groups = new Map();
  for (const s of shots) {
    const list = groups.get(s.sheet) ?? [];
    s.file = join(out, "stills", `${s.sheet}-${String(list.length + 1).padStart(2, "0")}-${s.t.toFixed(2)}s.jpg`);
    if (existsSync(fileFor.get(s.n))) copyFileSync(fileFor.get(s.n), s.file);
    list.push(s);
    groups.set(s.sheet, list);
  }
  rmSync(tmp, { recursive: true, force: true });

  // ---- poster and seam
  const firstStill = shots.find((s) => s.n === 0)?.file;
  const lastStill = shots.find((s) => s.n === frames.length - 1)?.file;
  const posterFile = resolve(opts.poster ?? join(dirname(video), "brag.jpg"));
  let poster = null;
  if (existsSync(posterFile)) {
    const p = probe(posterFile)?.streams?.[0];
    const db = firstStill ? psnr(firstStill, posterFile, width, height) : null;
    poster = { file: posterFile, width: p?.width ?? null, height: p?.height ?? null, psnrFrame0: db === Infinity ? 99 : round(db, 1) };
    if (p && (p.width !== width || p.height !== height)) flag("technical", `the poster is ${p.width}x${p.height}, not ${size}`);
    if (db !== null && db < POSTER_PSNR) flag("technical", `frame 0 isn't the poster (PSNR ${round(db, 1)} dB): bake ${basename(posterFile)} in as frame 0`);
  } else flag("technical", `no poster at ${posterFile}`);
  let seam = null;
  if (loop && firstStill && lastStill) {
    const db = psnr(firstStill, lastStill, width, height);
    seam = db === Infinity ? 99 : round(db, 1);
    if (db < SEAM_PSNR) flag("scenario", `the first and last frames differ (PSNR ${seam} dB, needs ${SEAM_PSNR}): the loop jumps`);
  }

  // ---- sheets
  const scaleH = (w) => Math.round((w * height) / width / 2) * 2;
  const sheets = [];
  const makeSheet = (name, list, tileW, box, part) => {
    const tileH = scaleH(tileW);
    const { cols, rows } = grid(list.length, tileW, tileH);
    const seq = join(out, "stills", "seq");
    rmSync(seq, { recursive: true, force: true });
    mkdirSync(seq);
    list.forEach((s, i) => existsSync(s.file) && copyFileSync(s.file, join(seq, `${String(i + 1).padStart(3, "0")}.jpg`)));
    const t = Math.max(2, Math.ceil((2 * width) / tileW));
    const draw = box ? `drawbox=x=${box[0]}:y=${box[1]}:w=${box[2] - box[0]}:h=${box[3] - box[1]}:color=0xFF00FF@0.9:t=${t},` : "";
    const file = join(out, `sheet-${name}${part ? `-${part}` : ""}.jpg`);
    const r = ffmpeg(["-framerate", "1", "-i", join(seq, "%03d.jpg"), "-vf", `${draw}scale=${tileW}:${tileH},tile=${cols}x${rows}:padding=8:margin=8:color=0x202020`, "-frames:v", "1", "-q:v", "3", file]);
    rmSync(seq, { recursive: true, force: true });
    if (!r.ok) die(`ffmpeg couldn't make ${basename(file)}:\n${r.log.slice(-1500)}`);
    sheets.push({ file, phoneSize: Boolean(box) || name === "hook" || name === "end" || name === "scenes", tile: `${tileW}x${tileH}`, shots: list.map((s) => ({ label: s.label, t: s.t, still: s.file })) });
  };
  const phoneW = format?.tile ?? (width >= height ? 480 : 360);
  const small = overviewTile(nOverview, width, height).w;
  // Tiles per sheet: the most that fit SHEET_WIDTH across and SHEET_PIXELS in all (landscape 9, square 8, portrait 6,
  // vertical 4).
  const perSheet = (w) => {
    const most = Math.max(1, Math.floor(SHEET_PIXELS / (w * scaleH(w))));
    let best = 1;
    for (let cols = 1; cols <= Math.min(most, Math.floor(SHEET_WIDTH / (w + 8))); cols++) best = Math.max(best, cols * Math.floor(most / cols));
    return best;
  };
  for (const [name, list] of groups) {
    const phone = name === "hook" || name === "end" || name === "scenes";
    const w = phone ? phoneW : name === "overview" ? small : Math.min(small, 384);
    const max = name === "overview" ? list.length : perSheet(w);
    for (let i = 0, part = 1; i < list.length; i += max, part++) makeSheet(name, list.slice(i, i + max), w, phone ? safe : null, list.length > max ? part : 0);
  }

  // ---- report
  const measured = {
    width,
    height,
    fps: round(fps, 3),
    pixFmt: v.pix_fmt,
    videoCodec: v.codec_name,
    audioCodec: a?.codec_name ?? null,
    durationSec: round(duration),
    bytes,
    loudnessLufs: audio && Number.isFinite(audio.integrated) && audio.integrated > AUDIBLE ? audio.integrated : null,
    truePeakDbtp: audio && Number.isFinite(audio.truePeak) ? audio.truePeak : null,
    longestFreezeSec: round(longestFreeze),
    endHoldSec: endHold ? endHold.duration : 0,
    blankSec: round(blankSec),
    posterPsnrDb: poster?.psnrFrame0 ?? null,
  };
  const report = {
    version: 1,
    video,
    format: format?.name ?? null,
    safeBox: safe,
    voiceover,
    loop,
    measured,
    audio: audio ? { integratedLufs: audio.integrated, rangeLu: audio.range, truePeakDbtp: audio.truePeak, last04sLufs: lastM, silences } : null,
    freezes,
    blanks,
    poster,
    seamPsnrDb: seam,
    flags,
    sheets,
  };
  const json = (x) => JSON.stringify(x, (k, val) => (typeof val === "number" && !Number.isFinite(val) ? null : val), 2);
  writeFileSync(join(out, "measure.json"), json(report));

  const mb = round(bytes / 1048576, 1);
  console.log(`${video}`);
  console.log(`  ${width}x${height} ${format?.name ?? "(unknown format)"}, ${round(fps, 3)} fps, ${v.pix_fmt}, ${v.codec_name}${a ? ` + ${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch` : ", NO AUDIO"}, ${round(duration)} s, ${mb} MB`);
  const db = (x) => (x === -Infinity ? "-inf" : x);
  if (audio) console.log(`  loudness ${db(audio.integrated)} LUFS integrated, range ${db(audio.range)} LU, true peak ${db(audio.truePeak)} dBTP, last 0.4 s at ${db(lastM)} LUFS`);
  console.log(`  frozen ≥ ${FREEZE_REPORT} s: ${freezes.length ? freezes.map((f) => `${f.start}-${f.end} s (${f.duration} s${f.toEnd ? ", to the end" : ""})`).join(", ") : "none"}`);
  console.log(`  blank or black: ${blanks.length ? blanks.map((b) => `${b.start}-${b.end} s (${b.duration} s${b.black ? ", black" : ""})`).join(", ") : "none"}`);
  if (poster) console.log(`  poster ${basename(poster.file)} ${poster.width}x${poster.height}, frame 0 PSNR ${poster.psnrFrame0} dB`);
  if (seam !== null) console.log(`  loop seam: first vs last frame PSNR ${seam} dB`);
  console.log(flags.length ? `\nFLAGS (criterion, or HARD <hard fail id>):` : "\nFLAGS: none");
  for (const f of flags) console.log(`  [${f.where}] ${f.text}`);
  console.log(`\nLOOK at every sheet (tiles run left to right, top to bottom). Full-size stills are in ${join(out, "stills")}.`);
  if (safe) console.log(`On the phone-size sheets the magenta outline is the text-safe box${voiceover ? " (its bottom edge is the top of the caption band)" : ""}. The review draws it; it isn't in the video.`);
  else console.log("No text-safe box drawn: pass --safe x0,y0,x1,y1 from the format guide.");
  for (const s of sheets) console.log(`  ${s.file}${s.phoneSize ? "  [phone size]" : ""}\n    ${s.shots.map((x, i) => `${i + 1}. ${x.label} @ ${x.t} s`).join("\n    ")}`);
  console.log(`\nWritten: ${join(out, "measure.json")}`);
}

/* ---------------- score ---------------- */

function score(argv) {
  const { opts, rest } = parseArgs(argv);
  const file = rest[0] ? resolve(rest[0]) : die("usage: review.mjs score <review.json> [--measure <measure.json>]");
  let review;
  try {
    review = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    die(`${file} isn't valid JSON: ${err.message}`);
  }
  const errors = [];
  if (review.version !== 1) errors.push('"version" must be 1');
  if (!Number.isInteger(review.rounds) || review.rounds < 1 || review.rounds > 3) errors.push('"rounds" must be 1, 2 or 3: how many times you measured and scored the finished video');
  const given = Array.isArray(review.criteria) ? review.criteria : (errors.push('"criteria" must be an array'), []);
  for (const c of given) if (!CRITERIA.some((k) => k.id === c?.id)) errors.push(`unknown criterion "${c?.id}" (use: ${CRITERIA.map((k) => k.id).join(", ")})`);
  const criteria = CRITERIA.map((k) => {
    const c = given.find((x) => x?.id === k.id);
    if (!c) {
      errors.push(`criterion "${k.id}" is missing`);
      return { id: k.id, weight: k.weight, score: null, max: MAX, note: "" };
    }
    if (!(c.score === null || (Number.isInteger(c.score) && c.score >= 0 && c.score <= MAX))) errors.push(`"${k.id}".score must be 0, 1, 2, or null when it doesn't apply`);
    if (typeof c.note !== "string" || (c.score !== MAX && !c.note.trim())) errors.push(`"${k.id}".note must say what you saw${c.score === null ? " and why it doesn't apply" : ""}`);
    return { id: k.id, weight: k.weight, score: c.score ?? null, max: MAX, note: String(c.note ?? "") };
  });
  const hardFails = Array.isArray(review.hardFails) ? review.hardFails : (errors.push('"hardFails" must be an array of ids'), []);
  for (const h of hardFails) if (!HARD_FAILS.includes(h)) errors.push(`unknown hard fail "${typeof h === "string" ? h : JSON.stringify(h)}" (use: ${HARD_FAILS.join(", ")})`);
  for (const key of ["fixed", "remaining"]) {
    if (!Array.isArray(review[key]) || review[key].some((x) => typeof x !== "string")) errors.push(`"${key}" must be an array of sentences`);
  }
  if (hardFails.length && Array.isArray(review.remaining) && review.remaining.length === 0) errors.push('"remaining" must describe each hard fail still in "hardFails"');
  if (errors.length) {
    console.error(`${file} doesn't fit the schema:\n  - ${errors.join("\n  - ")}`);
    process.exit(1);
  }
  const applicable = criteria.filter((c) => c.score !== null);
  const weight = applicable.reduce((s, c) => s + c.weight, 0);
  const total = weight ? Math.round((100 * applicable.reduce((s, c) => s + c.weight * (c.score / c.max), 0)) / weight) : 0;
  const measureFile = resolve(opts.measure ?? join(dirname(file), "work", "review", "measure.json"));
  let measured = review.measured ?? null;
  try {
    measured = JSON.parse(readFileSync(measureFile, "utf8")).measured ?? measured;
  } catch {}
  const outJson = {
    version: 1,
    rounds: review.rounds,
    score: total,
    passed: hardFails.length === 0 && total >= PASS_SCORE && !criteria.some((c) => c.score === 0),
    hardFails: [...new Set(hardFails)],
    criteria,
    fixed: review.fixed,
    remaining: review.remaining,
    measured,
  };
  writeFileSync(file, JSON.stringify(outJson, null, 2) + "\n");
  const zeros = criteria.filter((c) => c.score === 0).map((c) => c.id);
  console.log(`${file}: score ${total}/100, ${outJson.passed ? "PASSED" : "NOT PASSED"}${hardFails.length ? `, hard fails: ${hardFails.join(", ")}` : ""}${zeros.length ? `, scored 0: ${zeros.join(", ")}` : ""}`);
  if (!outJson.passed && review.rounds < 3) console.log("Fix the hard fails first, then the criteria scored 0, re-render, and review again.");
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "measure") measure(args);
else if (cmd === "score") score(args);
else die("usage:\n  node review.mjs measure <video.mp4> [--out dir] [--length s] [--scenes 0,3,...] [--voiceover] [--loop] [--poster file] [--size WxH] [--safe x0,y0,x1,y1]\n  node review.mjs score <review.json> [--measure measure.json]");
