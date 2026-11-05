"use client";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { freshSession } from "@/lib/fresh-session";
import { PROJECT_NAME_MAX } from "@/lib/project-name";

/**
 * The project's name in the editor's bar, renamed in place as Cardboard's is: a click (or Enter) makes it a box, Enter or
 * leaving it saves (PATCH /api/jobs/[id]), Escape puts it back, and an empty name goes back to the source's. `jobId`
 * null: a project with nothing saved yet (a clip open from this computer), renamed for this visit only.
 */
export function ProjectTitle({ jobId, name, className }: { jobId: string | null; name: string; className?: string }) {
  const router = useRouter();
  const box = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(name);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setShown(name), [name]);
  // The box opens with its name picked, to type over.
  const open = editing !== null;
  useEffect(() => {
    if (open) box.current?.select();
  }, [open]);
  const save = async () => {
    if (editing === null) return;
    const next = editing.replace(/\s+/g, " ").trim();
    setEditing(null);
    if (next === shown) return;
    if (!jobId) return setShown(next || name);
    const before = shown;
    if (next) setShown(next);
    setError(null);
    await freshSession();
    const res = await fetch(`/api/jobs/${jobId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: next }) }).catch(() => null);
    if (!res?.ok) {
      setShown(before);
      setError(((await res?.json().catch(() => null)) as { error?: string } | null)?.error ?? "Couldn't rename it. Try again.");
      return;
    }
    router.refresh();
  };
  if (editing !== null) {
    return (
      <input
        ref={box}
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(null);
        }}
        maxLength={PROJECT_NAME_MAX}
        aria-label="Project name"
        className={cn("h-7 w-full max-w-[420px] rounded-md border border-gray-alpha-500 bg-background-100 px-2 text-base font-medium text-gray-1000 outline-none focus:border-gray-1000", className)}
      />
    );
  }
  return (
    <h1 className={cn("flex min-w-0 items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => setEditing(shown)}
        title="Rename the project"
        className="group flex min-w-0 items-center gap-1.5 rounded-md px-1 -mx-1 text-left text-base font-medium text-gray-1000 hover:bg-gray-alpha-100"
      >
        <span className="truncate">{shown}</span>
        <Pencil className="size-3.5 shrink-0 text-gray-900 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
      </button>
      {error && (
        <span role="alert" className="shrink-0 text-xs font-normal text-red-900">
          {error}
        </span>
      )}
    </h1>
  );
}
