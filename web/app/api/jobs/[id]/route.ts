import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDemo } from "@/lib/demo";
import { PROJECT_NAME_MAX } from "@/lib/project-name";
import { requireUser } from "@/lib/user";

/**
 * Renames a project (the editor's bar): `title`, its new name; an empty one goes back to the name of its source (the
 * clip's file, the website). Only the project's owner can.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemo) return NextResponse.json({ error: "Renaming is off in the demo." }, { status: 403 });
  const user = await requireUser();
  const body = (await req.json().catch(() => null)) as { title?: unknown } | null;
  if (typeof body?.title !== "string") return NextResponse.json({ error: "Send the new name." }, { status: 400 });
  const title = body.title.replace(/\s+/g, " ").trim().slice(0, PROJECT_NAME_MAX) || null;
  const { count } = await (await getDb()).job.updateMany({ where: { id, userId: user.id }, data: { title } });
  if (!count) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ title });
}
