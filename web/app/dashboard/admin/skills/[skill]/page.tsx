import Link from "next/link";
import { notFound } from "next/navigation";
import { skillSlot, type SkillLint } from "@launchreel/core/skills";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/ui/page";
import { getDb } from "@/lib/db";
import { adminUser } from "@/lib/skills";
import { kb, STATUS_TONE } from "../status";
import { NewDraftButton } from "./new-draft";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  return { title: `${skillSlot(skill)?.name ?? "Skill"} · Skills` };
}

const when = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** One skill's versions, newest first: who wrote each, what it changed, its check, and a way to start a new draft. */
export default async function SkillPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  const slot = skillSlot(skill);
  if (!slot || !(await adminUser())) notFound();
  const db = await getDb();
  const [versions, live] = await Promise.all([
    db.skillVersion.findMany({ where: { skillId: slot.id }, orderBy: { version: "desc" } }),
    db.skillLive.findUnique({ where: { skillId: slot.id } }),
  ]);
  const byId = new Map(versions.map((v) => [v.id, v.version]));
  const newest = versions[0];

  return (
    <>
      <PageHeader
        title={slot.name}
        description={`${slot.about}. Folder: ${slot.folder}${slot.kind === "shared" ? " (read by every scenario)" : ""}.`}
        actions={
          <>
            <ButtonLink href="/dashboard/admin/skills" size="sm">All skills</ButtonLink>
            {newest && <NewDraftButton skillId={slot.id} from={newest.version} primary />}
          </>
        }
      />
      <PageBody>
        {versions.length === 0 ? (
          <Card className="px-5 py-4 text-sm text-gray-900">No versions yet. Import one from the Skills page.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-alpha-400 text-left text-xs text-gray-900">
                  <th className="px-5 py-2.5 font-medium">Version</th>
                  <th className="px-5 py-2.5 font-medium">Note</th>
                  <th className="px-5 py-2.5 font-medium">Check</th>
                  <th className="px-5 py-2.5 font-medium">By</th>
                  <th className="px-5 py-2.5 font-medium">Changed</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => {
                  const lint = v.lint as unknown as SkillLint;
                  return (
                    <tr key={v.id} className="border-b border-gray-alpha-400 last:border-0 hover:bg-gray-alpha-100">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Link href={`/dashboard/admin/skills/${slot.id}/v/${v.version}`} className="font-medium text-gray-1000 hover:underline">
                          v{v.version}
                        </Link>{" "}
                        <Badge tone={STATUS_TONE[v.status] ?? "gray"}>{live?.liveVersionId === v.id ? "live" : v.status}</Badge>
                        <div className="font-mono text-xs text-gray-900">{v.folder}</div>
                      </td>
                      <td className="max-w-[320px] px-5 py-3 text-gray-900">
                        {v.note ?? "—"}
                        {v.parentId && byId.has(v.parentId) && <div className="text-xs">From v{byId.get(v.parentId)}</div>}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        <span className={lint.ok ? "text-gray-900" : "text-red-900"}>{lint.ok ? "Passes" : `${lint.errors.length} to fix`}</span>
                        {lint.warnings.length > 0 && <span className="text-amber-900"> · {lint.warnings.length} to look at</span>}
                        <div className="text-gray-900">
                          {v.fileCount} files · {kb(v.bytes)}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-900">{v.authorName ?? "—"}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-900">{when(v.updatedAt)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <ButtonLink href={`/dashboard/admin/skills/${slot.id}/v/${v.version}`} size="sm" variant="tertiary">
                          {v.status === "draft" ? "Edit" : "Open"}
                        </ButtonLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </PageBody>
    </>
  );
}
