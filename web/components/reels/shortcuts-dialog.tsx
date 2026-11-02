"use client";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** The editor's keys, as the editor handles them (reel-editor.tsx and the timeline). `mod`: ⌘ on a Mac, Ctrl elsewhere. */
const KEYS = (mod: string): [string[], string][] => [
  [["Space"], "Play or pause"],
  [["←", "→"], "One frame back or forward"],
  [["Shift", "← →"], "One second back or forward"],
  [["↑", "↓"], "Previous or next caption line"],
  [[mod, "Z"], "Undo"],
  [[mod, "Shift", "Z"], "Redo"],
  [[mod, "E"], "Export"],
  [[mod, "/"], "Ask AI"],
  [["["], "Hide or show the tools panel"],
  [["]"], "Hide or show Ask AI"],
  [["Delete"], "Remove what's picked on the timeline, or cut the selected stretch"],
  [["Esc"], "Let go of the selection"],
  [[mod, "Scroll"], "Zoom the timeline around the pointer"],
  [["?"], "These shortcuts"],
];

/** The keyboard shortcuts, as a dialog (the ? key, or the keyboard button in the editor's bar). */
export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Known only in the browser, so it's set after the first render (the server's guess would mismatch on a Mac).
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => setMod(/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"), []);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="shortcuts-title"
      className="m-auto w-[min(460px,calc(100vw-2rem))] rounded-2xl border border-gray-alpha-400 bg-background-100 p-0 text-gray-1000 shadow-2xl backdrop:bg-black/70"
    >
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="shortcuts-title" className="text-base font-medium">
            Keyboard shortcuts
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-md text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000">
            <X className="size-4" />
          </button>
        </div>
        <dl className="divide-y divide-gray-alpha-200">
          {KEYS(mod).map(([keys, what]) => (
            <div key={what} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-[13px] text-gray-1000">{what}</dt>
              <dd className="flex shrink-0 gap-1">
                {keys.map((k) => (
                  <kbd key={k} className="min-w-6 rounded border border-gray-alpha-400 bg-gray-alpha-100 px-1.5 py-0.5 text-center font-sans text-[11px] text-gray-1000">
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-gray-900">They don&apos;t fire while you&apos;re typing in a field.</p>
      </div>
    </dialog>
  );
}
