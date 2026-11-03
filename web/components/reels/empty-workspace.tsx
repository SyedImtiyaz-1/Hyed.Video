"use client";
import { ArrowLeft, FolderOpen, LoaderCircle, Plus, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PickFolder } from "@launchreel/core/project-chat";
import { CLIP_ACCEPT } from "@/components/create/use-clip";
import { Button, ButtonLink } from "@/components/ui/button";
import type { HandedChat } from "@/lib/clip-handoff";
import { cn } from "@/lib/cn";
import { ChatPanel, type ChatIntro, type ChatMessage } from "./chat-panel";

/** An answer, with the folder it offers to pick the clip from. */
type Said = ChatMessage & { pick?: PickFolder };

const FOLDERS: Record<PickFolder, string> = { downloads: "Downloads", desktop: "Desktop", videos: "Videos", documents: "Documents", pictures: "Pictures", music: "Music", any: "" };

const INTRO: ChatIntro = {
  title: "Ask before your clip is in",
  text: "Ask what Hyped can do, have it open a folder to pick your clip from, or say how you want it edited: that waits in this box until the clip is in, for you to send. It answers; it never does anything on its own.",
  suggestions: ["Pull my video from Downloads", "What can you do?", "Yellow captions, and cut the long pauses", "Which files can I import?"],
};

// The browser's file picker, opening in a folder (Chrome and Edge); elsewhere the file input, wherever it opens.
type OpenPicker = (options: { startIn?: string; types?: { description: string; accept: Record<string, string[]> }[] }) => Promise<{ getFile(): Promise<File> }[]>;
const VIDEO_TYPES = [{ description: "Video", accept: { "video/mp4": [".mp4", ".m4v"], "video/quicktime": [".mov"], "video/webm": [".webm"] } }];

/**
 * A new project before it has anything in it, in the editor's own layout (as Cardboard's empty editor): the library
 * (+ Add), the stage ("Your timeline is empty", Import media), Ask AI, an empty timeline. A clip can be dropped anywhere
 * on it, or picked with Import media, Add or ⌘I / Ctrl+I; `onFile` does the rest, with what was said to Ask AI before
 * it. Ask AI answers from the start (/api/projects/chat): asked to pull a video from Downloads, it offers a button that
 * opens the picker there; an edit asked for now waits for the clip. `busy`: what's happening to the clip (opening,
 * uploading). `note`: what importing does (it may spend a credit).
 */
export function EmptyWorkspace({ onFile, busy, error, note }: { onFile: (file: File, chat: HandedChat) => void; busy?: string | null; error?: string | null; note?: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [said, setSaid] = useState<Said[]>([]);
  const [asking, setAsking] = useState(false);
  // An edit asked for before the clip: typed into Ask AI once the clip is in, for the customer to send.
  const [kept, setKept] = useState("");
  const pick = () => !busy && input.current?.click();
  const spoken = () => said.filter((m) => !m.failed).map(({ from, text }) => ({ from, text }));
  const take = (file: File) => !busy && onFile(file, { messages: spoken(), ask: kept || undefined });
  const pickFrom = async (folder: PickFolder) => {
    const open = (window as unknown as { showOpenFilePicker?: OpenPicker }).showOpenFilePicker;
    if (folder === "any" || !open) return pick();
    try {
      const [handle] = await open({ startIn: folder, types: VIDEO_TYPES });
      if (handle) take(await handle.getFile());
    } catch (err) {
      // Closed without a pick: nothing to do. Refused (a folder it may not open): the file input instead.
      if ((err as Error)?.name !== "AbortError") pick();
    }
  };
  const ask = async (message: string) => {
    const history = spoken();
    setSaid((s) => [...s, { from: "you", text: message }]);
    setAsking(true);
    try {
      const res = await fetch("/api/projects/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, history, kept }) });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; pick?: PickFolder | null; keep?: string | null; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "The assistant didn't answer. Try again in a moment.");
      if (typeof data.keep === "string") setKept(data.keep);
      setSaid((s) => [...s, { from: "ai", text: data.reply!, pick: data.pick ?? undefined }]);
    } catch (err) {
      setSaid((s) => [...s, { from: "ai", text: err instanceof Error ? err.message : "The assistant didn't answer.", failed: true }]);
    } finally {
      setAsking(false);
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        pick();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const drop = {
    onDragOver: (e: React.DragEvent) => e.dataTransfer.types.includes("Files") && (e.preventDefault(), setDragging(true)),
    onDragLeave: (e: React.DragEvent) => e.currentTarget === e.target && setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) take(file);
    },
  };

  return (
    // Wide screens: the window's height, as the editor itself (the timeline stays in view).
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:h-dvh lg:min-h-[520px] lg:py-3" {...drop}>
      <input ref={input} type="file" accept={CLIP_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => (e.target.files?.[0] && take(e.target.files[0]), (e.target.value = ""))} />
      <div className="mb-4 flex shrink-0 items-center gap-2 lg:mb-3">
        <ButtonLink href="/dashboard" variant="tertiary" size="sm" aria-label="Back to the dashboard">
          <ArrowLeft />
        </ButtonLink>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-medium text-gray-1000">Untitled project</h1>
          <p className="truncate text-xs text-gray-900">Nothing in it yet</p>
        </div>
        <Button variant="primary" disabled title="Import a clip first">
          Export
        </Button>
      </div>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[44px_minmax(0,300px)_minmax(0,1fr)_minmax(0,340px)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-5 lg:gap-y-3">
        <div className="hidden lg:flex lg:flex-col lg:gap-1">
          <span className="flex size-11 items-center justify-center rounded-lg bg-gray-alpha-200 text-gray-1000" title="Library">
            <FolderOpen className="size-[18px]" />
          </span>
        </div>

        {/* The library: what's in the project (nothing yet). */}
        <div className="order-2 min-w-0 lg:order-none">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-1000">Library</p>
            <Button variant="secondary" size="sm" onClick={pick} disabled={Boolean(busy)}>
              <Plus />
              Add
            </Button>
          </div>
          <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-alpha-500 px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg bg-gray-alpha-100 text-gray-900">
              <Upload className="size-4" />
            </span>
            <p className="mt-3 text-sm font-medium text-gray-1000">No media yet</p>
            <p className="mt-1 text-xs text-gray-900">Your clip appears here. Photos, audio and more clips in one video are coming.</p>
          </div>
        </div>

        {/* The stage: import a clip to start. */}
        <div className={cn("order-1 flex min-h-[320px] min-w-0 flex-col items-center justify-center rounded-xl border bg-black px-6 py-12 text-center text-white transition-colors lg:order-none lg:min-h-0 lg:overflow-auto", dragging ? "border-brand bg-brand/10" : "border-gray-alpha-400")}>
          {busy ? (
            <>
              <LoaderCircle className="size-6 animate-spin text-white/70" />
              <p className="mt-3 text-base font-medium" role="status">
                {busy}
              </p>
            </>
          ) : (
            <>
              <Upload className="size-6 text-white/70" />
              <p className="mt-3 text-base font-medium">{dragging ? "Drop it to start" : "Your timeline is empty"}</p>
              <p className="mt-1 text-[13px] text-white/60">Import a clip to start your first cut. MP4, MOV or WebM.</p>
              <div className="mt-5 flex items-center gap-2">
                <button type="button" onClick={pick} className="flex h-9 items-center gap-2 rounded-md bg-white px-3.5 text-sm font-medium text-black hover:bg-white/90">
                  <Upload className="size-4" />
                  Import media
                </button>
                <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-sans text-[11px] text-white/60">Ctrl I</kbd>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="mt-4 max-w-sm text-[13px] text-red-300">
              {error}
            </p>
          )}
          {note && !busy && <p className="mt-4 max-w-sm text-xs text-white/50">{note}</p>}
        </div>

        {/* Ask AI, from the start: the editor's full height, beside the timeline too. */}
        <div className="order-3 flex min-w-0 flex-col lg:order-none lg:row-span-2 lg:min-h-0">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-1000">
            <Sparkles className="size-3.5 text-brand" /> Ask AI
          </p>
          <div className="min-h-0 lg:flex-1">
            <ChatPanel
              messages={said}
              busy={asking}
              onSend={(m) => void ask(m)}
              onUndo={() => {}}
              canUndo={() => false}
              context={kept ? `Waiting for your clip: ${kept}` : undefined}
              intro={INTRO}
              placeholder="Pull my video from Downloads"
              footer={(m) =>
                m.pick && (
                  <button type="button" onClick={() => void pickFrom(m.pick!)} disabled={Boolean(busy)} className="mt-2 flex h-8 items-center gap-1.5 rounded-md bg-gray-1000 px-3 text-xs font-medium text-background-100 hover:bg-gray-900 disabled:opacity-50">
                    <FolderOpen className="size-3.5" />
                    {m.pick === "any" ? "Choose your clip" : `Open ${FOLDERS[m.pick]}`}
                  </button>
                )
              }
              fill
            />
          </div>
        </div>

        {/* The timeline, empty, under the library and the stage. */}
        <div className="order-4 min-w-0 rounded-lg border border-gray-alpha-400 bg-background-100 lg:order-none lg:col-start-1 lg:col-end-4 lg:row-start-2">
          <div className="border-b border-gray-alpha-400 px-3 py-1.5 text-xs text-gray-900">Timeline</div>
          <div className="flex h-6 border-b border-gray-alpha-400 pl-16">
            {[0, 5, 10, 15, 20, 25, 30].map((t) => (
              <span key={t} className="flex-1 border-l border-gray-alpha-400 pl-1 text-[10px] leading-6 text-gray-900">
                0:{String(t).padStart(2, "0")}
              </span>
            ))}
          </div>
          <div className="flex h-16 items-center justify-center text-xs text-gray-900">Drop a clip anywhere to start</div>
        </div>
      </div>
    </div>
  );
}
