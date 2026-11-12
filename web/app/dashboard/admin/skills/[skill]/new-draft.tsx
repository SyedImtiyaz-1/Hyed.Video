"use client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Starts a new draft as a copy of version `from`, then opens it in the editor. */
export function NewDraftButton({ skillId, from, primary }: { skillId: string; from: number; primary?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/skills/${skillId}/versions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ from }) }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { version?: number; error?: string } | null;
    if (!res?.ok || !body?.version) {
      setBusy(false);
      setError(body?.error ?? "Couldn't start a draft. Try again.");
      return;
    }
    router.push(`/dashboard/admin/skills/${skillId}/v/${body.version}`);
  };
  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-900">{error}</span>}
      <Button size="sm" variant={primary ? "primary" : "secondary"} disabled={busy} onClick={start}>
        <Plus className="size-4" />
        {busy ? "Starting…" : `New draft from v${from}`}
      </Button>
    </span>
  );
}
