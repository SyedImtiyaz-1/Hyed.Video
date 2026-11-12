import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { adminUser, authorName, createVersion, readPack } from "@/lib/skills";

/** A new draft of a skill, copied from one of its versions (`from`, a version number), so a change is a small diff. */
export async function POST(req: Request, { params }: { params: Promise<{ skill: string }> }) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { skill } = await params;
  const body = (await req.json().catch(() => null)) as { from?: unknown } | null;
  const from = Number(body?.from);
  if (!Number.isInteger(from)) return NextResponse.json({ error: "Say which version to start from." }, { status: 400 });
  const db = await getDb();
  const source = await db.skillVersion.findUnique({ where: { skillId_version: { skillId: skill, version: from } } });
  if (!source) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  const pack = await readPack(source.r2Key);
  if (!pack) return NextResponse.json({ error: "That version's files are missing from storage." }, { status: 500 });
  const row = await createVersion({ skillId: skill, pack, parentId: source.id, note: null, author: { id: user.id, name: authorName(user) } });
  return NextResponse.json({ version: row.version });
}
