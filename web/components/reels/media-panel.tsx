"use client";
import { Film, Music, Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import { REEL_MUSIC, type ReelAudio } from "@launchreel/core/music-beds";
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
 * The project's library, as Cardboard's: a search over what's in it and Add, then its media as tiles: the clip it's made
 * from (its first moments as the picture, its length on it), the stock B-roll in it and its music, each opening the tool
 * that edits it. Several uploads a video (clips, photos, audio) are on the roadmap, so Add says so rather than working.
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
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shows = (label: string) => !q || label.toLowerCase().includes(q);
  const shots = broll.map((r, i) => ({ r, i })).filter(({ r }) => shows(r.shot.query || "Stock clip"));
  const track = music ? REEL_MUSIC[music.track].label : null;
  const nothing = !shows(name) && !shots.length && !(track && shows(track));
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-gray-alpha-100 px-2.5 text-gray-900 focus-within:ring-1 focus-within:ring-gray-alpha-500">
          <Search className="size-3.5 shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search project media" aria-label="Search project media" className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-1000 outline-none placeholder:text-gray-900" />
        </label>
        <button type="button" disabled title="More clips, photos and audio in one video: coming soon" className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-gray-alpha-400 px-3 text-[13px] text-gray-1000 disabled:opacity-50">
          <Plus className="size-3.5" />
          Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shows(name) && (
          <div title={`${clock(cutLength)} after cuts · ${clock(duration)} recorded · ${shapeName(width, height)}`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-black">
              {/* The clip's first moments as its picture (#t: the browser loads just enough to show that frame). */}
              <video src={`${previewUrl}#t=0.5`} preload="metadata" muted playsInline className="absolute inset-0 size-full object-cover" aria-hidden />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] tabular-nums text-white">{clock(cutLength)}</span>
            </div>
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-gray-1000">
              <Play className="size-3 shrink-0 fill-current text-gray-900" />
              <span className="truncate">{name}</span>
            </p>
          </div>
        )}
        {shots.map(({ r, i }) => (
          <button key={`${r.shot.clip.source}:${r.shot.clip.id}:${r.shot.at}`} type="button" onClick={() => onShot(i)} className="text-left">
            <span className="relative flex aspect-[4/5] items-center justify-center rounded-lg bg-gray-alpha-100 transition-colors hover:bg-gray-alpha-200">
              <Film className="size-5 text-gray-900" />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] tabular-nums text-white">{r.at === null ? "not shown" : seconds(r.length)}</span>
            </span>
            <span className="mt-1.5 block truncate text-xs text-gray-1000">{r.shot.query || "Stock clip"}</span>
          </button>
        ))}
        {track && shows(track) && (
          <button type="button" onClick={onMusic} className="text-left">
            <span className="relative flex aspect-[4/5] items-center justify-center rounded-lg bg-gray-alpha-100 transition-colors hover:bg-gray-alpha-200">
              <Music className="size-5 text-gray-900" />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] tabular-nums text-white">{Math.round(music!.volume * 100)}%</span>
            </span>
            <span className="mt-1.5 block truncate text-xs text-gray-1000">{track}</span>
          </button>
        )}
      </div>
      {nothing && <p className="mt-2 text-xs text-gray-900">Nothing in this project matches “{query.trim()}”.</p>}
      {!q && !music && (
        <button type="button" onClick={onMusic} className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000">
          <Music className="size-3.5" />
          Add music
        </button>
      )}
    </div>
  );
}
