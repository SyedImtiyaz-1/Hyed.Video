import { NextResponse } from "next/server";
import { cleanSkillPack } from "@launchreel/core/skills";
import { getDb } from "@/lib/db";
import { adminUser, discardDraft, saveDraft } from "@/lib/skills";

type Params = { params: Promise<{ skill: string; version: string }> };

async function findVersion({ params }: Params) {
  const { skill, version } = await params;
  const n = Number(version);
  if (!Number.isInteger(n)) return null;
  return (await getDb()).skillVersion.findUnique({ where: { skillId_version: { skillId: skill, version: n } } });
}

/** Saves a draft: its files (the whole pack) and its note. The lint runs again and comes back. */
export async function PUT(req: Request, ctx: Params) {
  if (!(await adminUser())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = await findVersion(ctx);
  if (!row) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { folder?: unknown; files?: unknown; note?: unknown } | null;
  const clean = cleanSkillPack({ folder: body?.folder, files: body?.files });
  if ("error" in clean) return NextResponse.json({ error: clean.error }, { status: 400 });
  const result = await saveDraft(row.id, clean.pack, typeof body?.note === "string" ? body.note : null);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ lint: result.lint, updatedAt: result.version.updatedAt });
}

/** Discards a draft. */
export async function DELETE(_req: Request, ctx: Params) {
  if (!(await adminUser())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = await findVersion(ctx);
  if (!row) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  const result = await discardDraft(row.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
