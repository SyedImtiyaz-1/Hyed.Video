"use client";
import { ArrowUp, Check, LoaderCircle, Undo2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/cn";

/** A message: what the customer asked, or the assistant's answer with what it changed (`step`: the editor's id for it). */
export type ChatMessage = { from: "you" | "ai"; text: string; changes?: string[]; step?: number; failed?: boolean };

// The box grows with what's typed, up to this many lines, then scrolls.
const MAX_LINES = 6;

/**
 * Editing by typing: what the customer asks, and what the assistant changed, a short list under each answer with Undo
 * this (it takes back that answer alone; `canUndo` says whether there's anything left to take back). Nothing is saved
 * until export. Blank until the first message, the box too, as Cardboard's chat (Taibanaz, 3 Nov). `draft`: a request
 * typed in beforehand, waiting to be sent. `context`: what the assistant will look at (the playhead, what's selected),
 * shown over the box. `fill`: as tall as its column, the messages taking the room.
 */
export function ChatPanel({
  messages,
  busy,
  onSend,
  onUndo,
  canUndo,
  draft,
  context,
  inputRef,
  fill,
}: {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => void;
  onUndo: (message: ChatMessage) => void;
  canUndo: (message: ChatMessage) => boolean;
  draft?: string;
  context?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  fill?: boolean;
}) {
  const [text, setText] = useState(draft ?? "");
  const list = useRef<HTMLDivElement>(null);
  const own = useRef<HTMLTextAreaElement>(null);
  const box = inputRef ?? own;
  // Newest at the bottom, in view (scrollTo returns a promise in newer browsers: an effect must return nothing).
  useEffect(() => {
    void list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);
  // The box's height follows its text.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_LINES + 8)}px`;
  }, [text, box]);
  const send = (value: string) => {
    const clean = value.trim();
    if (!clean || busy) return;
    onSend(clean);
    setText("");
  };
  return (
    <div className={cn("flex flex-col gap-3", fill && "h-full")}>
      <div ref={list} className={cn("min-h-[140px] space-y-2 overflow-y-auto rounded-lg border border-gray-alpha-400 p-3", fill ? "max-h-[420px] flex-1 lg:max-h-none" : "max-h-[420px]")} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed [overflow-wrap:anywhere]", m.from === "you" ? "bg-gray-1000 text-background-100" : m.failed ? "border border-red-500/40 text-red-900" : "bg-gray-alpha-100 text-gray-1000")}>
              {m.text}
              {m.from === "ai" && Boolean(m.changes?.length) && (
                <>
                  <ul className="mt-1.5 space-y-0.5 border-t border-gray-alpha-300 pt-1.5 text-xs text-gray-900">
                    {m.changes!.map((c) => (
                      <li key={c} className="flex items-center gap-1.5">
                        <Check className="size-3 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  {canUndo(m) ? (
                    <button type="button" onClick={() => onUndo(m)} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-gray-1000 underline-offset-2 hover:underline">
                      <Undo2 className="size-3" />
                      Undo this
                    </button>
                  ) : (
                    <span className="mt-1.5 block text-xs text-gray-900">Undone</span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-[13px] text-gray-900">
            <LoaderCircle className="size-3.5 animate-spin" />
            Working on it…
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="rounded-lg border border-gray-alpha-400 bg-background-100 p-1.5 focus-within:border-gray-1000"
      >
        {context && <p className="truncate px-1.5 pb-0.5 text-[11px] text-gray-900">{context}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={2}
            maxLength={1000}
            aria-label="Ask AI"
            className="min-h-[44px] flex-1 resize-none bg-transparent px-1.5 py-1 text-sm text-gray-1000 outline-none"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-1000 text-background-100 disabled:opacity-40">
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
