import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseReel, REEL_EDIT_DAYS, reelEditable } from "@launchreel/core/reel";
import { ButtonLink } from "@/components/ui/button";
import { reelName } from "@/components/reels/labels";
import { ReelEditor } from "@/components/reels/reel-editor";
import { PrepareVideo } from "@/components/video/prepare-video";
import { getVideo } from "@/lib/data";
import { hostOf } from "@/lib/format";
import { readEdit } from "@/lib/reel-edits";
import { requireUser } from "@/lib/user";

export const metadata: Metadata = { title: "Edit" };

/**
 * The editor, for a finished reel within its free-edit window that has its saved decisions, or a finished product
 * video. A product video made before captions came after the agent is made ready first (PrepareVideo).
 */
export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  // ?t=12.4: opened from the reel's player at that second.
  const t = Number((await searchParams).t);
  const user = await requireUser();
  const data = await getVideo(user.id, id);
  if (!data || (data.job.kind !== "reel" && data.job.kind !== "video")) notFound();
  const { job } = data;
  const product = job.kind === "video";
  const reel = parseReel(job.reel);
  const preparing = product && reel?.export?.revision === 0 && reel.export.status !== "done" ? reel.export : null;
  const editable = product && !reel?.video ? { ok: job.status === "SUCCEEDED", reason: "Only finished videos can be edited." } : reelEditable(job, reel);
  const edit = editable.ok && !preparing && reel ? await readEdit(id).catch(() => null) : null;

  // A product video that isn't ready to edit yet: made ready here, once.
  if (product && editable.ok && (!reel?.video || preparing || !edit)) {
    return <PrepareVideo jobId={id} name={hostOf(job.sourceUrl)} initial={preparing} />;
  }
  if (!editable.ok || !edit || !reel) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <h1 className="text-lg font-medium text-gray-1000">This {product ? "video" : "reel"} can&apos;t be edited</h1>
        <p className="mt-2 text-sm text-gray-900">{editable.reason ?? "It was made before editing was available. Make the reel again to edit it here."}</p>
        <ButtonLink href={`/dashboard/videos/${id}`} variant="secondary" className="mt-6">
          <ArrowLeft />
          Back to the {product ? "video" : "reel"}
        </ButtonLink>
      </div>
    );
  }
  return (
    <ReelEditor
      jobId={id}
      name={product ? hostOf(job.sourceUrl) : reelName(reel.fileName)}
      options={{ style: reel.style, look: reel.look, fonts: reel.fonts, emojis: reel.emojis, zooms: reel.zooms, sfx: reel.sfx, hook: reel.hook, ...(reel.captions === false ? { captions: false } : {}) }}
      edit={edit}
      previewUrl={`/api/reels/${id}/preview`}
      // Making an older video ready (revision 0) isn't an export.
      initialExport={reel.export && reel.export.revision > 0 ? reel.export : null}
      editableUntil={product ? null : new Date(job.createdAt.getTime() + REEL_EDIT_DAYS * 86_400_000).toISOString()}
      startAt={Number.isFinite(t) && t >= 0 ? t : undefined}
      video={reel.video ?? null}
      voiceUrl={reel.video?.voice ? `/api/reels/${id}/preview?track=voice` : undefined}
    />
  );
}
