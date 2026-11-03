"use client";
import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { REEL_AUDIO_NONE } from "@launchreel/core/music-beds";
import { parsePicture } from "@launchreel/core/picture";
import { REEL_DEFAULTS, type ReelEdit } from "@launchreel/core/reel";
import { reelName } from "@/components/reels/labels";
import { measureVideo } from "@/components/reels/measure";
import { EmptyWorkspace } from "@/components/reels/empty-workspace";
import { ReelEditor } from "@/components/reels/reel-editor";
import { takeChat, takeClip, type HandedChat } from "@/lib/clip-handoff";
import { takePendingClip } from "@/lib/pending-clip";

type Opened = { url: string; name: string; edit: ReelEdit };

/** A blank edit of a clip, at its own length and size: nothing cut, captioned or added yet. */
function blankEdit(duration: number, width: number, height: number): ReelEdit {
  return {
    version: 1,
    duration,
    width,
    height,
    words: [],
    hidden: [],
    breaks: [],
    keywords: [],
    emojis: [],
    emojiStyle: { size: "m", place: "auto" },
    zooms: [],
    transitions: [],
    sounds: [],
    hookSound: null,
    effects: [],
    picture: parsePicture({}),
    cuts: [],
    hook: "",
    trims: [],
    audio: REEL_AUDIO_NONE,
    broll: [],
  };
}

// Bigger files than this aren't decoded here for their sound: it would take the whole file into memory at once.
const HEAR_MAX_BYTES = 150 * 1024 * 1024;

/** The clip's sound as 16 kHz mono WAV, as the reel pipeline sends it to be heard; null when it has none. */
async function speechOf(file: File): Promise<Blob | null> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const pcm = (await offline.startRendering()).getChannelData(0);
    const out = new DataView(new ArrayBuffer(44 + pcm.length * 2));
    const text = (at: number, s: string) => [...s].forEach((c, i) => out.setUint8(at + i, c.charCodeAt(0)));
    text(0, "RIFF");
    out.setUint32(4, 36 + pcm.length * 2, true);
    text(8, "WAVEfmt ");
    out.setUint32(16, 16, true);
    out.setUint16(20, 1, true); // PCM
    out.setUint16(22, 1, true); // mono
    out.setUint32(24, 16000, true);
    out.setUint32(28, 32000, true);
    out.setUint16(32, 2, true);
    out.setUint16(34, 16, true);
    text(36, "data");
    out.setUint32(40, pcm.length * 2, true);
    pcm.forEach((v, i) => out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
    return new Blob([out.buffer], { type: "audio/wav" });
  } catch {
    return null; // no sound track, or one this browser can't decode
  } finally {
    void ctx.close();
  }
}

type Hearing = { state: "hearing" } | { state: "done"; words: ReelEdit["words"] } | { state: "none"; why: string };

/**
 * The editor on a clip from this computer, at once: the clip the prompt box handed over, or one chosen on this page. It
 * plays from the file itself and the editing that needs no server works on it as it plays; the editor says what needs
 * the clip uploaded. Its captions follow in a few seconds: its sound is heard (/api/local/transcribe, local development
 * only) and the words drop into the editor.
 */
export function LocalEditor() {
  const [clip, setClip] = useState<Opened | null>(null);
  const [reading, setReading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hearing, setHearing] = useState<Hearing | null>(null);
  // Sent here because the clip's upload failed (local development without the render Worker: prompt-box.tsx).
  const [notUploaded, setNotUploaded] = useState(false);
  // What was said to Ask AI before the clip (in the empty editor): it carries on in the editor's Ask AI.
  const [chat, setChat] = useState<HandedChat | null>(null);
  const started = useRef(false);

  async function hear(file: File) {
    if (file.size > HEAR_MAX_BYTES) return setHearing({ state: "none", why: "This file is too big to caption here. Uploaded clips get their captions from the server." });
    setHearing({ state: "hearing" });
    const audio = await speechOf(file);
    if (!audio) return setHearing({ state: "none", why: "This clip has no sound, so there's nothing to caption." });
    const form = new FormData();
    form.append("audio", audio, "speech.wav");
    const res = await fetch("/api/local/transcribe", { method: "POST", body: form }).catch(() => null);
    const data = res ? ((await res.json().catch(() => ({}))) as { words?: ReelEdit["words"]; error?: string }) : { error: "You're offline." };
    if (!res?.ok || !data.words) return setHearing({ state: "none", why: data.error ?? "The captions didn't come through." });
    setHearing(data.words.length ? { state: "done", words: data.words } : { state: "none", why: "No speech in this clip, so there's nothing to caption." });
  }

  async function open(file: File) {
    setReading(true);
    setError(null);
    setHearing(null);
    try {
      const info = await measureVideo(file);
      if (!info.playable || !info.width || !info.height) throw new Error("This browser can't play that file. Try an MP4.");
      setClip({ url: URL.createObjectURL(file), name: file.name, edit: blankEdit(Math.round(info.duration * 100) / 100, info.width, info.height) });
      void hear(file);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReading(false);
    }
  }

  // Once: the clip the prompt box handed to this page (in memory), or one kept in this browser.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setNotUploaded(new URLSearchParams(window.location.search).get("upload") === "failed");
    const handed = takeClip();
    setChat(takeChat());
    if (handed) void open(handed);
    else void takePendingClip().then((kept) => (kept ? open(kept.file) : setReading(false)));
  }, []);
  useEffect(() => () => void (clip && URL.revokeObjectURL(clip.url)), [clip]);

  if (clip) {
    const { style, look, fonts, emojis, zooms, sfx, hook } = REEL_DEFAULTS;
    // Bigger than 1080p plays from the original file here; an uploaded clip gets a lighter preview to edit on.
    const big = clip.edit.width * clip.edit.height > 1920 * 1080 * 1.1;
    // The notes go inside the editor, under its bar, so it still fits the window with its timeline.
    const notes = [
      notUploaded && (
        <p key="upload" className="truncate rounded-lg border border-amber-400 bg-amber-100 px-3 py-1.5 text-[13px] text-amber-900" role="status" title="Editing and captions work here; Ask AI, B-roll search and Export need the upload.">
          Your clip couldn&apos;t upload (the local render Worker isn&apos;t running), so it opened from your computer. Ask AI, B-roll search and Export need the upload.
        </p>
      ),
      big && (
        <p key="big" className="truncate rounded-lg border border-amber-400 bg-amber-100 px-3 py-1.5 text-[13px] text-amber-900" title="Uploaded clips get a lighter preview to edit on.">
          This clip is {clip.edit.width}×{clip.edit.height}, so it may play slowly here: it plays from the original file.
        </p>
      ),
      hearing && hearing.state !== "done" && (
        <p key="hearing" className="flex items-center gap-2 rounded-lg border border-gray-alpha-400 px-3 py-1.5 text-[13px] text-gray-900" aria-live="polite">
          {hearing.state === "hearing" ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" /> Hearing your clip for its captions…
            </>
          ) : (
            hearing.why
          )}
        </p>
      ),
    ].filter(Boolean);
    return (
      <ReelEditor
        jobId="local"
        name={reelName(clip.name)}
        options={{ style, look, fonts, emojis, zooms, sfx, hook }}
        edit={clip.edit}
        previewUrl={clip.url}
        initialExport={null}
        editableUntil={new Date(Date.now() + 7 * 86_400_000).toISOString()}
        local
        heard={hearing?.state === "done" ? hearing.words : null}
        notice={notes.length ? notes : undefined}
        askFirst={chat?.ask}
        chatBefore={chat?.messages}
        startOnMedia
      />
    );
  }

  // No clip yet: the editor, empty, as a new project's (a clip picked here opens from this computer, not uploaded).
  return <EmptyWorkspace onFile={(file, said) => (setChat(said), void open(file))}busy={reading ? "Opening your clip…" : null} error={error} note="It opens in the editor straight from your computer, without uploading." />;
}
