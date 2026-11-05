import { NextResponse } from "next/server";
import { parseReel } from "@launchreel/core/reel";
import { getDb } from "@/lib/db";
import { isDemo } from "@/lib/demo";
import { DEMO_PREVIEW, previewResponse } from "@/lib/reel-edits";
import { requireUser } from "@/lib/user";

/**
 * A reel's or product video's clean preview (no captions) for the editor, to its owner, in ranges so the player can
 * seek; with ?track=voice, a product video's narration alone, which the editor plays under a new music bed.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemo) return NextResponse.redirect(new URL(DEMO_PREVIEW, req.url));
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  const job = await db.job.findFirst({ where: { id, userId: user.id, kind: { in: ["reel", "video"] } }, select: { id: true, reel: true } });
  if (!job) return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  const voice = new URL(req.url).searchParams.get("track") === "voice";
  if (voice && !parseReel(job.reel)?.video?.voice) return NextResponse.json({ error: "This video's narration wasn't kept on its own." }, { status: 404 });
  return (await previewResponse(id, req, voice ? "voice" : "preview")) ?? NextResponse.json({ error: "This reel has no preview to edit on." }, { status: 404 });
}
