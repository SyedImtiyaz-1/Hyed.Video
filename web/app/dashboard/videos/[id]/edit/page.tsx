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
import { FirstCut } from "./first-cut";
import { ProductVideo } from "./product-video";

export const metadata: Metadata = { title: "Editor" };
export const dynamic = "force-dynamic";

/**
 * The editor. The prompt box opens it as soon as a video starts, so it shows the first cut being made until it's ready
 * (first-cut.tsx). Then a reel gets the reel editor, within its free-edit window and with its saved decisions, and so
 * does a finished product video (one made before captions came after the agent is made ready first, once:
 * PrepareVideo); a product video that can't be edited gets its preview, files and Ask AI for revisions (product-video.tsx).
 */
export default async function EditReelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  // ?t=12.4: opened from the reel's player at that second.
  const t = Number((await searchParams).t);
  const user = await requireUser();
  const data = await getVideo(user.id, id);
  if (!data || (data.job.kind !== "reel" && data.job.kind !== "video")) notFound();
  if (data.job.status !== "SUCCEEDED") return <FirstCut job={data.job} />;
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
  // A product video that can't be edited here: its page-like view, with Ask AI for revisions.
  if (product && (!editable.ok || !edit || !reel)) return <ProductVideo job={job} credits={user.credits} />;
  if (!editable.ok || !edit || !reel) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <h1 className="text-lg font-medium text-gray-1000">This reel can&apos;t be edited</h1>
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
      // What the customer asked for when they made it from a reel template, until they've exported an edit.
      askFirst={!product && !reel.export && job.notes ? job.notes : undefined}
      watermark={job.watermark}
    />
  );
}
