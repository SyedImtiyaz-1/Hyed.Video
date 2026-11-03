"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REEL_DEFAULTS } from "@launchreel/core/reel";
import { EmptyWorkspace } from "@/components/reels/empty-workspace";
import { useReelUpload } from "@/components/reels/use-reel-upload";
import { handClip, type HandedChat } from "@/lib/clip-handoff";

/**
 * A new project's empty editor. A clip imported into it goes where the dashboard's prompt box sends one: uploaded and
 * started as a reel, the editor opening on its first cut; in demo mode, or in local development when the upload can't
 * go through (no render Worker), straight into the editor from this computer. An edit asked of Ask AI before the clip
 * goes with it: the reel's notes (waiting in its Ask AI), or, opened from this computer, the conversation itself.
 */
export function NewProject({ demo }: { demo: boolean }) {
  const router = useRouter();
  const reel = useReelUpload();
  const [opening, setOpening] = useState(false);
  const local = (file: File, chat: HandedChat, why?: string) => {
    setOpening(true);
    handClip(file, chat);
    router.push(`/dashboard/edit/local${why ? `?upload=${why}` : ""}`);
  };
  const onFile = async (file: File, chat: HandedChat) => {
    const chosen = await reel.choose(file);
    if (!chosen) return;
    if (demo) return local(chosen.file, chat);
    const how = await reel.start({ ...REEL_DEFAULTS }, chat.ask, chosen);
    if (how === "upload-failed" && process.env.NODE_ENV === "development") local(chosen.file, chat, "failed");
  };
  const percent = reel.picked ? Math.floor((reel.sent / Math.max(1, reel.picked.file.size)) * 100) : 0;
  const busy = opening
    ? "Opening your clip…"
    : reel.measuring
      ? "Reading your clip…"
      : reel.phase === "uploading"
        ? `Uploading your clip… ${percent}%`
        : reel.phase === "starting"
          ? "Starting your first cut…"
          : null;

  return (
    <EmptyWorkspace
      onFile={(file, chat) => void onFile(file, chat)}
      busy={busy}
      error={opening ? null : (reel.error?.message ?? null)}
      note={demo ? "Demo mode: your clip opens straight from your computer." : "Importing a clip starts its first cut (captions, cuts, music): it uses credits for its length, and confirms you own the clip or may use it."}
    />
  );
}
