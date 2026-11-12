import { NextResponse } from "next/server";
import { cleanSkillPack, skillSlot } from "@launchreel/core/skills";
import { adminUser, authorName, createVersion } from "@/lib/skills";

type Entry = { skillId?: unknown; folder?: unknown; files?: unknown; live?: unknown };

/**
 * Imports skill folders as new versions, in the order sent (the admin page's Import: one folder, or runner/skills
 * whole, where brag-slim goes first as every scenario's version 1, recorded as live, then Hyped's own skills).
 */
export async function POST(req: Request) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { entries?: Entry[]; note?: unknown } | null;
  const entries = Array.isArray(body?.entries) ? body.entries.slice(0, 20) : [];
  if (!entries.length) return NextResponse.json({ error: "Nothing to import." }, { status: 400 });

  // Check everything before saving anything, so a bad folder doesn't leave half an import behind.
  const checked = [];
  for (const entry of entries) {
    const skillId = typeof entry.skillId === "string" ? entry.skillId : "";
    if (!skillSlot(skillId)) return NextResponse.json({ error: `There's no skill "${skillId}".` }, { status: 400 });
    const clean = cleanSkillPack({ folder: entry.folder, files: entry.files });
    if ("error" in clean) return NextResponse.json({ error: `${String(entry.folder)}: ${clean.error}` }, { status: 400 });
    checked.push({ skillId, pack: clean.pack, live: entry.live === true });
  }

  const note = typeof body?.note === "string" ? body.note : null;
  const created = [];
  for (const { skillId, pack, live } of checked) {
    const row = await createVersion({ skillId, pack, live, note, author: { id: user.id, name: authorName(user) } });
    created.push({ skillId, version: row.version, folder: row.folder, status: row.status });
  }
  return NextResponse.json({ created });
}
