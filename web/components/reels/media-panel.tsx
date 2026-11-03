"use client";
import { Film, Music, Plus, Video } from "lucide-react";
import { bedLabel, type ReelAudio } from "@launchreel/core/music-beds";
import type { BrollRow } from "./broll-panel";

const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const seconds = (s: number) => `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;

/** A shape's usual name (9:16, 1:1, 16:9…), or its size when it has none. */
export function shapeName(width: number, height: number) {
  const named: [string, number][] = [["9:16", 9 / 16], ["3:4", 3 / 4], ["4:5", 4 / 5], ["1:1", 1], ["4:3", 4 / 3], ["16:9", 16 / 9]];
  const r = width / Math.max(1, height);
  const [name, ratio] = named.reduce((a, b) => (Math.abs(b[1] - r) < Math.abs(a[1] - r) ? b : a));
  return Math.abs(ratio - r) < 0.03 ? name : `${width}×${height}`;
}

/**
 * What's in the project: the clip it's made from, the stock B-roll in it and its music, each opening the tool that edits
 * it. Several uploads a video (clips, photos, audio) are on the roadmap: a row says so, rather than a button that
 * doesn't work.
 */
export function MediaPanel({
  name,
  previewUrl,
  duration,
  cutLength,
  width,
  height,
  broll,
  music,
  onShot,
  onMusic,
}: {
  name: string;
  previewUrl: string;
  duration: number;
  cutLength: number;
  width: number;
  height: number;
  broll: BrollRow[];
  music: ReelAudio["music"];
  onShot: (index: number) => void;
  onMusic: () => void;
}) {
  const shown = broll.filter((r) => r.at !== null).length;
  return (
    <div className="space-y-5">
      <section>
        <p className="mb-2 text-[13px] text-gray-900">Your clip</p>
        <div className="flex items-center gap-3 rounded-lg border border-gray-alpha-400 p-2">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black">
            {/* The clip's first moments as its thumbnail (#t: the browser loads just enough to show that frame). */}
            <video src={`${previewUrl}#t=0.5`} preload="metadata" muted playsInline className="absolute inset-0 size-full object-cover" aria-hidden />
            <Video className="relative size-4 text-white/70" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-1000">{name}</p>
            <p className="mt-0.5 text-xs text-gray-900">
              {clock(cutLength)} after cuts · {clock(duration)} recorded · {shapeName(width, height)}
            </p>
          </div>
          <button type="button" disabled title="Replacing the clip is coming soon" className="h-8 shrink-0 rounded-md border border-gray-alpha-400 px-2.5 text-xs text-gray-900 disabled:opacity-60">
            Replace
          </button>
        </div>
      </section>

      <section>
        <p className="mb-2 text-[13px] text-gray-900">
          B-roll{broll.length ? ` · ${shown} in the video` : ""}
        </p>
        {broll.length ? (
          <ul className="space-y-1">
            {broll.map((r, i) => (
              <li key={`${r.shot.clip.source}:${r.shot.clip.id}:${r.shot.at}`}>
                <button type="button" onClick={() => onShot(i)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-alpha-100">
                  <Film className="size-4 shrink-0 text-gray-900" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-gray-1000">{r.shot.query || "Stock clip"}</span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-900">{r.at === null ? "not shown" : `${clock(r.at)} · ${seconds(r.length)}`}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-900">No B-roll yet. Add stock shots from the B-roll tool, or ask the AI for some.</p>
        )}
      </section>

      <section>
        <p className="mb-2 text-[13px] text-gray-900">Music</p>
        <button type="button" onClick={onMusic} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-alpha-100">
          <Music className="size-4 shrink-0 text-gray-900" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-gray-1000">{music ? bedLabel(music.track) : "No music"}</span>
          <span className="shrink-0 text-xs text-gray-900">{music ? `${Math.round(music.volume * 100)}%` : "Pick a track"}</span>
        </button>
      </section>

      <div aria-disabled className="flex items-start gap-2.5 rounded-lg border border-dashed border-gray-alpha-500 p-3">
        <Plus className="mt-0.5 size-4 shrink-0 text-gray-900" />
        <span>
          <span className="block text-[13px] font-medium text-gray-1000">Add media · soon</span>
          <span className="mt-0.5 block text-xs text-gray-900">More clips, photos and audio in one video are on the way.</span>
        </span>
      </div>
    </div>
  );
}
