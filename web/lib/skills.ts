// The skills pipeline's server side (docs/SKILLS_PIPELINE.md, step 1): versions of each skill saved as JSON packs in
// the private VIDEOS bucket (skills/<skill>/v<n>.json, never served by serveMedia) with a row each in SkillVersion.
// Admins only. In local `next dev` the bucket is next dev's own R2, which is all step 1 needs; step 2 hands a version
// to the render Worker.
import { lintSkill, skillPackKey, skillSlot, type SkillLint, type SkillPack } from "@launchreel/core/skills";
import { getDb } from "./db";
import { isDemo } from "./demo";
import { videoBucket } from "./reel-uploads";
import { isAdmin, requireUser } from "./user";

/** The signed-in admin, or null for anyone else (and in demo mode, which has no admin side). */
export async function adminUser() {
  if (isDemo) return null;
  const user = await requireUser().catch(() => null);
  return user && isAdmin(user.id) ? user : null;
}

export async function readPack(key: string): Promise<SkillPack | null> {
  const object = await (await videoBucket()).get(key);
  return object ? (JSON.parse(await object.text()) as SkillPack) : null;
}

async function writePack(key: string, pack: SkillPack) {
  await (await videoBucket()).put(key, JSON.stringify(pack), { httpMetadata: { contentType: "application/json" } });
}

/** The Skill row for a slot, made on first use. */
async function ensureSkill(skillId: string) {
  const slot = skillSlot(skillId);
  if (!slot) throw new Error(`No skill "${skillId}"`);
  const db = await getDb();
  return db.skill.upsert({ where: { id: slot.id }, update: {}, create: { id: slot.id, name: slot.name } });
}

const lintFields = (lint: SkillLint, pack: SkillPack) => ({
  bytes: lint.bytes,
  fileCount: Object.keys(pack.files).length,
  lint: lint as unknown as object,
  tools: lint.tools,
});

/**
 * A new version of a skill: the next number, its pack in R2, its lint. `live` records it as what production runs
 * today (the brag-slim baseline), which points the skill's live pointer at it when it has none.
 */
export async function createVersion(input: { skillId: string; pack: SkillPack; author: { id: string; name: string | null }; note?: string | null; parentId?: string | null; live?: boolean }) {
  await ensureSkill(input.skillId);
  const db = await getDb();
  const lint = lintSkill(input.pack);
  // Two saves at once could take the same number: the unique index refuses the second, which then retries.
  for (let attempt = 0; attempt < 3; attempt++) {
    const last = await db.skillVersion.findFirst({ where: { skillId: input.skillId }, orderBy: { version: "desc" }, select: { version: true } });
    const version = (last?.version ?? 0) + 1;
    const r2Key = skillPackKey(input.skillId, version);
    try {
      const row = await db.skillVersion.create({
        data: {
          skillId: input.skillId,
          version,
          folder: input.pack.folder,
          r2Key,
          parentId: input.parentId ?? null,
          authorId: input.author.id,
          authorName: input.author.name,
          note: input.note?.trim().slice(0, 500) || null,
          status: input.live ? "live" : "draft",
          ...lintFields(lint, input.pack),
        },
      });
      await writePack(r2Key, input.pack);
      if (input.live) {
        await db.skillLive.upsert({
          where: { skillId: input.skillId },
          update: {},
          create: { skillId: input.skillId, liveVersionId: row.id, changedBy: input.author.id, reason: "Recorded as the baseline production runs" },
        });
      }
      return row;
    } catch (err) {
      if ((err as { code?: string }).code !== "P2002" || attempt === 2) throw err;
    }
  }
  throw new Error("Couldn't number the version");
}

/** Saves a draft's files and note in place (only drafts change; every other version is kept as it was). */
export async function saveDraft(versionId: string, pack: SkillPack, note: string | null) {
  const db = await getDb();
  const row = await db.skillVersion.findUnique({ where: { id: versionId } });
  if (!row) return { error: "Version not found", status: 404 } as const;
  if (row.status !== "draft") return { error: "Only a draft can change. Start a new draft from this version.", status: 409 } as const;
  const lint = lintSkill(pack);
  await writePack(row.r2Key, pack);
  const saved = await db.skillVersion.update({
    where: { id: versionId },
    data: { folder: pack.folder, note: note?.trim().slice(0, 500) || null, ...lintFields(lint, pack) },
  });
  return { version: saved, lint } as const;
}

/** Throws a draft away: its row and its pack. */
export async function discardDraft(versionId: string) {
  const db = await getDb();
  const row = await db.skillVersion.findUnique({ where: { id: versionId } });
  if (!row) return { error: "Version not found", status: 404 } as const;
  if (row.status !== "draft") return { error: "Only a draft can be discarded.", status: 409 } as const;
  // deleteMany, not delete: a second click that arrives after the first has removed it finds nothing, not an error.
  const { count } = await db.skillVersion.deleteMany({ where: { id: versionId, status: "draft" } });
  if (!count) return { error: "Version not found", status: 404 } as const;
  await (await videoBucket()).delete(row.r2Key);
  return { ok: true } as const;
}

/** The author's name for a version: their email's name, as admins have no display name of their own here. */
export const authorName = (user: { email?: string | null }) => user.email?.split("@")[0] ?? null;
