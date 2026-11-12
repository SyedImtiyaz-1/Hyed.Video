"use client";
import { AlertTriangle, ArrowLeft, Check, CircleX, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cleanSkillPath, lintSkill, SKILL_LIMITS, type SkillPack } from "@launchreel/core/skills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { kb, STATUS_TONE } from "../../../status";
import { NewDraftButton } from "../../new-draft";

type Version = { number: number; status: string; editable: boolean; note: string; author: string | null; parent: number | null };

// SKILL.md first, then the folder's files in path order: the order the agent meets them.
const order = (paths: string[]) => [...paths].sort((a, b) => (a === "SKILL.md" ? -1 : b === "SKILL.md" ? 1 : a.localeCompare(b)));

/**
 * A skill version's files: the list on the left, the selected file's text in the middle, and the check (lintSkill, the
 * same one the server runs on save) on the right, live as you type. Drafts save in place (Ctrl+S); other versions are
 * read-only, with a way to start a draft from them.
 */
export function SkillEditor({ skill, version, pack, missing }: { skill: { id: string; name: string }; version: Version; pack: SkillPack; missing: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState(pack.files);
  const [note, setNote] = useState(version.note);
  const [open, setOpen] = useState(() => order(Object.keys(pack.files))[0] ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [newPath, setNewPath] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"discard" | "delete-file" | null>(null);
  const editable = version.editable && !missing;

  const paths = useMemo(() => order(Object.keys(files)), [files]);
  const lint = useMemo(() => lintSkill({ folder: pack.folder, files }), [files, pack.folder]);

  const change = (next: Record<string, string>) => {
    setFiles(next);
    setDirty(true);
    setMessage(null);
  };

  const save = useCallback(async () => {
    if (!editable || saving) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/skills/${skill.id}/versions/${version.number}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folder: pack.folder, files, note }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      setMessage({ tone: "error", text: body?.error ?? "Couldn't save. Your changes are still here; try again." });
      return;
    }
    setDirty(false);
    setMessage({ tone: "ok", text: "Saved" });
    router.refresh();
  }, [editable, saving, skill.id, version.number, pack.folder, files, note, router]);

  // Ctrl/⌘+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  const addFile = () => {
    const path = cleanSkillPath(newPath ?? "");
    if (!path) return setMessage({ tone: "error", text: "Use a path like references/hooks.md: letters, digits, dashes and slashes." });
    if (path in files) return setMessage({ tone: "error", text: `${path} is already here.` });
    if (Object.keys(files).length >= SKILL_LIMITS.files) return setMessage({ tone: "error", text: `A skill has at most ${SKILL_LIMITS.files} files.` });
    change({ ...files, [path]: "" });
    setOpen(path);
    setNewPath(null);
  };

  const deleteFile = () => {
    const next = { ...files };
    delete next[open];
    change(next);
    setOpen(order(Object.keys(next))[0] ?? "");
    setConfirm(null);
  };

  const [discarding, setDiscarding] = useState(false);
  const discard = async () => {
    if (discarding) return;
    setDiscarding(true);
    const res = await fetch(`/api/admin/skills/${skill.id}/versions/${version.number}`, { method: "DELETE" }).catch(() => null);
    // A 404 means it's already gone (an earlier click): the result she wanted.
    if (!res?.ok && res?.status !== 404) {
      setDiscarding(false);
      return setMessage({ tone: "error", text: "Couldn't discard the draft. Try again." });
    }
    setDirty(false);
    router.push(`/dashboard/admin/skills/${skill.id}`);
  };

  return (
    <div className="flex h-[calc(100dvh-var(--header-h,0px))] min-h-[560px] flex-col">
      {/* The bar: where you are, the note, and what you can do with this version. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-alpha-400 bg-background-100 px-4 py-3 md:px-6">
        <Link href={`/dashboard/admin/skills/${skill.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-900 hover:text-gray-1000">
          <ArrowLeft className="size-4" />
          {skill.name}
        </Link>
        <span className="font-semibold text-gray-1000">v{version.number}</span>
        <Badge tone={STATUS_TONE[version.status] ?? "gray"}>{version.status}</Badge>
        <span className="font-mono text-xs text-gray-900">{pack.folder}</span>
        {version.parent && <span className="text-xs text-gray-900">from v{version.parent}</span>}
        <input
          id="skill-note"
          value={note}
          readOnly={!editable}
          onChange={(e) => (setNote(e.target.value), setDirty(true))}
          placeholder={editable ? "What does this version change?" : ""}
          aria-label="Note"
          maxLength={500}
          className="min-w-[180px] flex-1 rounded-md border border-gray-alpha-400 bg-background-100 px-2.5 py-1.5 text-sm text-gray-1000 outline-none focus:border-gray-alpha-600 read-only:border-transparent"
        />
        <div className="ml-auto flex items-center gap-2">
          {message && <span className={cn("text-xs", message.tone === "error" ? "text-red-900" : "text-gray-900")}>{message.text}</span>}
          {editable ? (
            <>
              {confirm === "discard" ? (
                <>
                  <span className="text-xs text-gray-900">Discard this draft?</span>
                  <Button size="sm" variant="error" disabled={discarding} onClick={discard}>{discarding ? "Discarding…" : "Discard"}</Button>
                  <Button size="sm" variant="tertiary" onClick={() => setConfirm(null)}>Keep</Button>
                </>
              ) : (
                <Button size="sm" variant="tertiary" onClick={() => setConfirm("discard")}>Discard draft</Button>
              )}
              <Button size="sm" variant="primary" disabled={!dirty || saving} onClick={save}>
                {saving ? "Saving…" : dirty ? "Save" : "Saved"}
              </Button>
            </>
          ) : (
            <NewDraftButton skillId={skill.id} from={version.number} primary />
          )}
        </div>
      </div>

      {missing && <div className="border-b border-gray-alpha-400 bg-red-100 px-6 py-2 text-sm text-red-900">This version&apos;s files aren&apos;t in storage.</div>}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* Files */}
        <nav aria-label="Files" className="min-h-0 overflow-y-auto border-b border-gray-alpha-400 bg-background-100 p-2 md:border-r md:border-b-0">
          <ul className="space-y-0.5">
            {paths.map((path) => (
              <li key={path}>
                <button
                  onClick={() => (setOpen(path), setConfirm(null))}
                  className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs", path === open ? "bg-gray-alpha-200 text-gray-1000" : "text-gray-900 hover:bg-gray-alpha-100")}
                >
                  <FileText className="size-3.5 shrink-0" />
                  <span className="truncate">{path}</span>
                </button>
              </li>
            ))}
          </ul>
          {editable &&
            (newPath === null ? (
              <button onClick={() => setNewPath("references/")} className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-900 hover:bg-gray-alpha-100">
                <Plus className="size-3.5" />
                New file
              </button>
            ) : (
              <form className="mt-2 space-y-1.5 px-1" onSubmit={(e) => (e.preventDefault(), addFile())}>
                <input
                  id="new-file-path"
                  autoFocus
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  aria-label="New file's path"
                  className="w-full rounded-md border border-gray-alpha-400 bg-background-100 px-2 py-1 font-mono text-xs text-gray-1000 outline-none focus:border-gray-alpha-600"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" type="submit">Add</Button>
                  <Button size="sm" variant="tertiary" type="button" onClick={() => setNewPath(null)}>Cancel</Button>
                </div>
              </form>
            ))}
        </nav>

        {/* The open file */}
        <section className="flex min-h-[320px] min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-gray-alpha-400 px-4 py-2 text-xs text-gray-900">
            <span className="font-mono text-gray-1000">{open || "No file"}</span>
            {open && <span>{kb(new TextEncoder().encode(files[open] ?? "").length)}</span>}
            {editable && open && (
              <span className="ml-auto">
                {confirm === "delete-file" ? (
                  <span className="inline-flex items-center gap-2">
                    Delete {open}?
                    <Button size="sm" variant="error" onClick={deleteFile}>Delete</Button>
                    <Button size="sm" variant="tertiary" onClick={() => setConfirm(null)}>Keep</Button>
                  </span>
                ) : (
                  <button onClick={() => setConfirm("delete-file")} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-alpha-200 hover:text-gray-1000">
                    <Trash2 className="size-3.5" />
                    Delete file
                  </button>
                )}
              </span>
            )}
          </div>
          <textarea
            id="skill-file-text"
            value={files[open] ?? ""}
            readOnly={!editable || !open}
            onChange={(e) => change({ ...files, [open]: e.target.value })}
            spellCheck={false}
            aria-label={open ? `Text of ${open}` : "No file open"}
            className="min-h-0 flex-1 resize-none bg-background-100 p-4 font-mono text-[13px] leading-relaxed text-gray-1000 outline-none"
          />
        </section>

        {/* The check */}
        <aside aria-label="Check" className="min-h-0 overflow-y-auto border-t border-gray-alpha-400 bg-background-100 p-4 text-sm xl:border-t-0 xl:border-l">
          <h2 className="flex items-center gap-2 font-semibold text-gray-1000">
            {lint.ok ? <Check className="size-4 text-green-900" /> : <CircleX className="size-4 text-red-900" />}
            {lint.ok ? "Passes the check" : `${lint.errors.length} to fix before it can be tested`}
          </h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
            <dt className="text-gray-900">Whole skill</dt>
            <dd className={cn("tabular-nums", lint.bytes > SKILL_LIMITS.perSkill ? "text-red-900" : "text-gray-1000")}>
              {kb(lint.bytes)} / {SKILL_LIMITS.perSkill / 1000} KB
            </dd>
            <dt className="text-gray-900">Read before the plan</dt>
            <dd className={cn("tabular-nums", lint.readBeforePlan > SKILL_LIMITS.readBeforePlan ? "text-amber-900" : "text-gray-1000")}>
              {kb(lint.readBeforePlan)} / {SKILL_LIMITS.readBeforePlan / 1000} KB
            </dd>
            <dt className="text-gray-900">Files</dt>
            <dd className="tabular-nums text-gray-1000">{paths.length}</dd>
            <dt className="text-gray-900">Runner tools it calls</dt>
            <dd className="text-right font-mono text-gray-1000">{lint.tools.join(", ") || "none"}</dd>
          </dl>
          {lint.errors.length > 0 && (
            <ul className="mt-4 space-y-2">
              {lint.errors.map((e) => (
                <li key={e} className="flex gap-2 text-xs text-red-900">
                  <CircleX className="mt-0.5 size-3.5 shrink-0" />
                  <span className="[overflow-wrap:anywhere]">{e}</span>
                </li>
              ))}
            </ul>
          )}
          {lint.warnings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {lint.warnings.map((w) => (
                <li key={w} className="flex gap-2 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span className="[overflow-wrap:anywhere]">{w}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-xs text-gray-900">
            {version.author ? `By ${version.author}. ` : ""}
            {editable ? "A draft saves in place; Ctrl+S saves." : "This version is kept as it is. Start a new draft to change it."}
          </p>
        </aside>
      </div>
    </div>
  );
}
