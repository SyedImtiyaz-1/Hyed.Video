import { NextResponse } from "next/server";
import { parseReel, sourceKey, videoOptions, type ReelJob } from "@launchreel/core";
import { getDb, startPrepare } from "@/lib/db";
import { isDemo } from "@/lib/demo";
import { requireUser } from "@/lib/user";

// Preparing "rendering" after this long died somewhere; it may start again.
const STALE_PREPARE_MS = 30 * 60_000;

async function ownVideo(id: string) {
  const user = await requireUser();
  const db = await getDb();
  const job = await db.job.findFirst({ where: { id, userId: user.id, kind: "video" } });
  return { db, job, reel: job ? parseReel(job.reel) : null };
}

/** How making the video ready to edit is going (Job.reel.export, revision 0), or null when it hasn't started. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { job, reel } = await ownVideo((await params).id);
  if (!job) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  return NextResponse.json({ prepare: reel?.export ?? null });
}

/**
 * Makes an older product video (made before the captions were added after the agent) ready to edit: its video becomes
 * the editor's upload, with its narration and words from the workspace the job kept. Free, and the video itself
 * doesn't change. Videos made since are ready when they finish.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemo) return NextResponse.json({ error: "This is the demo. Connect a database and Clerk to edit real videos." }, { status: 403 });
  const { id } = await params;
  const { db, job, reel } = await ownVideo(id);
  if (!job) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  if (job.status !== "SUCCEEDED" || !job.videoUrl) return NextResponse.json({ error: "Only finished videos can be edited." }, { status: 400 });
  const current = reel?.export;
  if (reel?.video && current?.revision !== 0) return NextResponse.json({ prepare: { revision: 0, status: "done", startedAt: current?.startedAt ?? new Date().toISOString() } });
  if (current?.status === "rendering" && Date.now() - Date.parse(current.startedAt) < STALE_PREPARE_MS) return NextResponse.json({ prepare: current });
  if (current?.status === "done") return NextResponse.json({ prepare: current });

  // What's known before the container looks: its captions are in its picture when it was narrated with them on.
  const preparing = { revision: 0, status: "rendering" as const, startedAt: new Date().toISOString() };
  const next: ReelJob = {
    ...videoOptions(false),
    key: sourceKey(id),
    fileName: "video.mp4",
    bytes: 0,
    durationSec: job.durationSec,
    width: null,
    height: null,
    video: { burned: Boolean(job.voice) && job.captions !== false, watermarked: job.watermark, narrated: Boolean(job.voice), voice: false },
    export: preparing,
  };
  await db.job.update({ where: { id }, data: { reel: next } });
  try {
    await startPrepare(id);
  } catch {
    await db.job.update({ where: { id }, data: { reel: { ...next, export: { ...preparing, status: "failed", error: "Preparing couldn't start" } } } });
    return NextResponse.json({ error: "Preparing couldn't start. Try again in a moment." }, { status: 503 });
  }
  return NextResponse.json({ prepare: preparing });
}
