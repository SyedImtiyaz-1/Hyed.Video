"use client";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BASELINE_FOLDER, SKILL_LIMITS, SKILL_SLOTS } from "@launchreel/core/skills";
import { Button } from "@/components/ui/button";

// The files a skill is made of: text the agent reads or runs. Anything else in a picked folder is left out.
const TEXT = /\.(md|mdx|txt|mjs|js|cjs|ts|json|py|sh|ya?ml|csv)$/i;

type Entry = { skillId: string; folder: string; files: Record<string, string>; live: boolean };
type Plan = { entries: Entry[]; skipped: string[] };

const SCENARIOS = SKILL_SLOTS.filter((s) => s.kind === "scenario");
const slotFor = (folder: string) => SKILL_SLOTS.find((s) => s.folder === folder);

/**
 * Turns a picked folder into versions to make. The repo's runner/skills (a folder of skill folders): brag-slim first,
 * as version 1 of every scenario, recorded as live, then each Hyped skill into its own slot. A single skill folder
 * (one with a SKILL.md at its top): into the slot its name matches, or every scenario for brag-slim.
 */
async function planImport(list: FileList): Promise<Plan> {
  const picked = [...list].map((file) => ({ file, parts: file.webkitRelativePath.split("/") }));
  const single = picked.some(({ parts }) => parts.length === 2 && parts[1] === "SKILL.md");
  const folders = new Map<string, Record<string, string>>();
  const skipped: string[] = [];
  for (const { file, parts } of picked) {
    const [folder, ...path] = single ? parts : parts.slice(1);
    const inner = path.join("/");
    if (!inner) continue; // a file loose in the parent folder (LICENSE.brag), not inside a skill
    if (!TEXT.test(inner) || file.size > SKILL_LIMITS.fileBytes) {
      skipped.push(`${folder}/${inner}`);
      continue;
    }
    const files = folders.get(folder) ?? {};
    files[inner] = await file.text();
    folders.set(folder, files);
  }
  const entries: Entry[] = [];
  const baseline = folders.get(BASELINE_FOLDER);
  if (baseline) for (const s of SCENARIOS) entries.push({ skillId: s.id, folder: BASELINE_FOLDER, files: baseline, live: true });
  for (const [folder, files] of folders) {
    if (folder === BASELINE_FOLDER) continue;
    const slot = slotFor(folder);
    if (slot) entries.push({ skillId: slot.id, folder, files, live: false });
    else skipped.push(`${folder}/ (no skill slot is named after it)`);
  }
  return { entries, skipped };
}

/** The Import button and its panel: pick a folder, see what it will make, then import. */
export function ImportSkills({ empty }: { empty: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (list: FileList | null) => {
    setError(null);
    if (!list?.length) return;
    const next = await planImport(list);
    if (!next.entries.length) setError("No skills found there. Pick runner/skills, or one skill's folder (the one with SKILL.md).");
    setPlan(next);
  };

  const run = async () => {
    if (!plan) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/skills/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entries: plan.entries, note: "Imported from the repo" }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError(((await res?.json().catch(() => null)) as { error?: string } | null)?.error ?? "The import didn't go through. Try again.");
      return;
    }
    setPlan(null);
    router.refresh();
  };

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        {...({ webkitdirectory: "" } as Record<string, string>)}
        onChange={(e) => {
          void pick(e.target.files);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant={empty ? "primary" : "secondary"} onClick={() => input.current?.click()}>
        <Upload className="size-4" />
        Import
      </Button>
      {(plan || error) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal aria-labelledby="import-title">
          <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-alpha-400 bg-background-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-alpha-400 px-5 py-3">
              <h2 id="import-title" className="font-semibold text-gray-1000">Import skills</h2>
              <button aria-label="Close" className="rounded p-1 text-gray-900 hover:bg-gray-alpha-200" onClick={() => (setPlan(null), setError(null))}>
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm">
              {plan && plan.entries.length > 0 && (
                <>
                  <p className="text-gray-900">Each becomes a new version. Nothing changes what production runs.</p>
                  <ul className="divide-y divide-gray-alpha-400 rounded-lg border border-gray-alpha-400">
                    {plan.entries.map((e) => (
                      <li key={`${e.skillId}-${e.folder}`} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span>
                          <span className="font-medium text-gray-1000">{SKILL_SLOTS.find((s) => s.id === e.skillId)?.name}</span>{" "}
                          <span className="font-mono text-xs text-gray-900">{e.folder}</span>
                        </span>
                        <span className="text-xs text-gray-900">
                          {Object.keys(e.files).length} file{Object.keys(e.files).length === 1 ? "" : "s"}
                          {e.live ? " · recorded as live" : " · draft"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {plan && plan.skipped.length > 0 && (
                <p className="text-xs text-gray-900">Left out: {plan.skipped.slice(0, 8).join(", ")}{plan.skipped.length > 8 ? `, and ${plan.skipped.length - 8} more` : ""}.</p>
              )}
              {error && <p className="text-red-900">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-alpha-400 px-5 py-3">
              <Button size="sm" onClick={() => input.current?.click()}>Pick another folder</Button>
              {plan && plan.entries.length > 0 && (
                <Button size="sm" variant="primary" disabled={busy} onClick={run}>
                  {busy ? "Importing…" : `Import ${plan.entries.length} version${plan.entries.length === 1 ? "" : "s"}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
