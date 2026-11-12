import Link from "next/link";
import { notFound } from "next/navigation";
import { SKILL_SLOTS, type SkillLint } from "@launchreel/core/skills";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/ui/page";
import { getDb } from "@/lib/db";
import { adminUser } from "@/lib/skills";
import { ImportSkills } from "./import-skills";
import { kb, STATUS_TONE } from "./status";

export const metadata = { title: "Skills" };
export const dynamic = "force-dynamic";

/** The skills pipeline's home (docs/SKILLS_PIPELINE.md): every skill with its live version and the newest one. */
export default async function SkillsPage() {
  if (!(await adminUser())) notFound();
  const db = await getDb();
  const [versions, live] = await Promise.all([
    db.skillVersion.findMany({ orderBy: { version: "desc" }, select: { id: true, skillId: true, version: true, folder: true, status: true, lint: true, bytes: true, updatedAt: true } }),
    db.skillLive.findMany(),
  ]);
  const empty = versions.length === 0;

  return (
    <>
      <PageHeader
        title="Skills"
        description="The instructions the video agent follows, one skill per kind of video. Write a version, test it, compare it with the live one, then publish."
        actions={
          <>
            <ButtonLink href="/dashboard/admin" size="sm">Unit economics</ButtonLink>
            <ImportSkills empty={empty} />
          </>
        }
      />
      <PageBody className="space-y-6">
        {empty && (
          <Card className="px-5 py-4 text-sm text-gray-900">
            No versions yet. Choose <b className="text-gray-1000">Import</b> and pick the repo&apos;s <code className="font-mono text-[13px]">runner/skills</code> folder:
            <code className="font-mono text-[13px]"> brag-slim</code> becomes version 1 of every scenario, recorded as live (it&apos;s what production runs today), and
            Hyped&apos;s own skills become version 2.
          </Card>
        )}
        <Card className="overflow-hidden">
          <CardHeader title="Every skill" description="Scenarios pick the story; the core and the review are read by all of them." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-alpha-400 text-left text-xs text-gray-900">
                  <th className="px-5 py-2.5 font-medium">Skill</th>
                  <th className="px-5 py-2.5 font-medium">Live</th>
                  <th className="px-5 py-2.5 font-medium">Newest</th>
                  <th className="px-5 py-2.5 font-medium">Check</th>
                  <th className="px-5 py-2.5 text-right font-medium">Versions</th>
                </tr>
              </thead>
              <tbody>
                {SKILL_SLOTS.map((slot) => {
                  const mine = versions.filter((v) => v.skillId === slot.id);
                  const pointer = live.find((l) => l.skillId === slot.id);
                  const liveVersion = mine.find((v) => v.id === pointer?.liveVersionId);
                  const newest = mine[0];
                  const lint = newest?.lint as SkillLint | undefined;
                  return (
                    <tr key={slot.id} className="border-b border-gray-alpha-400 last:border-0 hover:bg-gray-alpha-100">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/admin/skills/${slot.id}`} className="font-medium text-gray-1000 hover:underline">
                          {slot.name}
                        </Link>
                        {slot.kind === "shared" && <span className="ml-2 text-xs text-gray-900">shared</span>}
                        <div className="text-xs text-gray-900">{slot.about}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {liveVersion ? (
                          <span>
                            v{liveVersion.version} <span className="font-mono text-xs text-gray-900">{liveVersion.folder}</span>
                          </span>
                        ) : (
                          <span className="text-gray-900">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {newest ? (
                          <span className="inline-flex items-center gap-2">
                            v{newest.version}
                            <Badge tone={STATUS_TONE[newest.status] ?? "gray"}>{newest.status}</Badge>
                            <span className="font-mono text-xs text-gray-900">{newest.folder}</span>
                          </span>
                        ) : (
                          <span className="text-gray-900">No versions</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        {lint ? (
                          <span className={lint.ok ? "text-gray-900" : "text-red-900"}>
                            {lint.ok ? "Passes" : `${lint.errors.length} to fix`}
                            {lint.warnings.length > 0 && ` · ${lint.warnings.length} to look at`} · {kb(newest.bytes)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{mine.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-gray-900">
          Step 1 of the pipeline: versions, the editor and the checks. Testing, scores, compare and publish come next (docs/SKILLS_PIPELINE.md). Nothing here
          changes what production runs yet.
        </p>
      </PageBody>
    </>
  );
}
