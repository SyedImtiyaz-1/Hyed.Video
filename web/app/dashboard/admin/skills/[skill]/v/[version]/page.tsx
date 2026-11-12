import { notFound } from "next/navigation";
import { skillSlot } from "@launchreel/core/skills";
import { getDb } from "@/lib/db";
import { adminUser, readPack } from "@/lib/skills";
import { SkillEditor } from "./skill-editor";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ skill: string; version: string }> }) {
  const { skill, version } = await params;
  return { title: `${skillSlot(skill)?.name ?? "Skill"} v${version} · Skills` };
}

/** One version of a skill in the editor: a draft to change, or any other version to read and start a draft from. */
export default async function SkillVersionPage({ params }: { params: Promise<{ skill: string; version: string }> }) {
  const { skill, version } = await params;
  const slot = skillSlot(skill);
  const n = Number(version);
  if (!slot || !Number.isInteger(n) || !(await adminUser())) notFound();
  const db = await getDb();
  const row = await db.skillVersion.findUnique({ where: { skillId_version: { skillId: slot.id, version: n } } });
  if (!row) notFound();
  const [pack, parent, live] = await Promise.all([
    readPack(row.r2Key),
    row.parentId ? db.skillVersion.findUnique({ where: { id: row.parentId }, select: { version: true } }) : null,
    db.skillLive.findUnique({ where: { skillId: slot.id } }),
  ]);

  return (
    <SkillEditor
      skill={{ id: slot.id, name: slot.name }}
      version={{
        number: row.version,
        status: live?.liveVersionId === row.id ? "live" : row.status,
        editable: row.status === "draft",
        note: row.note ?? "",
        author: row.authorName,
        parent: parent?.version ?? null,
      }}
      pack={pack ?? { folder: row.folder, files: {} }}
      missing={!pack}
    />
  );
}
