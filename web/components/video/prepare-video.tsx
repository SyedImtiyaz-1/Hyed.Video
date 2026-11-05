"use client";
import { ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReelExport } from "@launchreel/core/reel";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * An older product video made ready to edit (once, in about a minute: its video and narration become the editor's
 * files), then the editor opens. Starts it if it hasn't started, follows it, and offers a retry if it fails.
 */
export function PrepareVideo({ jobId, name, initial }: { jobId: string; name: string; initial: ReelExport | null }) {
  const router = useRouter();
  const [state, setState] = useState<ReelExport | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const start = async () => {
    setError(null);
    const res = await fetch(`/api/reels/${jobId}/prepare`, { method: "POST" }).catch(() => null);
    const body = res ? ((await res.json().catch(() => ({}))) as { prepare?: ReelExport; error?: string }) : { error: "You're offline. Try again in a moment." };
    if (!res?.ok || !body.prepare) return setError(body.error ?? "Preparing couldn't start. Try again in a moment.");
    setState(body.prepare);
    if (body.prepare.status === "done") router.refresh();
  };

  // Start once, unless it's already going (or failed: then the customer retries).
  useEffect(() => {
    if (started.current || state) return;
    started.current = true;
    void start();
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow it until it's done, then open the editor.
  const preparing = state?.status === "rendering";
  useEffect(() => {
    if (!preparing) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/reels/${jobId}/prepare`).catch(() => null);
      const body = res?.ok ? ((await res.json()) as { prepare: ReelExport | null }) : null;
      if (!body?.prepare || body.prepare.status === "rendering") return;
      setState(body.prepare);
      if (body.prepare.status === "done") router.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [preparing, jobId, router]);

  const failed = error ?? (state?.status === "failed" ? `It didn't work${state.error ? `: ${state.error}` : ""}.` : null);
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <h1 className="text-lg font-medium text-gray-1000">Getting {name} ready to edit</h1>
      {failed ? (
        <>
          <p className="mt-2 text-sm text-red-900" role="alert">
            {failed}
          </p>
          <Button variant="primary" className="mt-6" onClick={() => void start()}>
            <RotateCcw />
            Try again
          </Button>
        </>
      ) : (
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-900" role="status">
          <LoaderCircle className="size-4 animate-spin" />
          This video was made before the editor existed, so it takes a minute the first time. The video itself won&apos;t change.
        </p>
      )}
      <ButtonLink href={`/dashboard/videos/${jobId}`} variant="tertiary" className="mt-6">
        <ArrowLeft />
        Back to the video
      </ButtonLink>
    </div>
  );
}
