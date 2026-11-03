import { openAsBlob } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, join, sep } from "node:path";
import { NextResponse } from "next/server";
import { PICK_FOLDERS, type PickFolder } from "@launchreel/core/project-chat";
import { requireUser } from "@/lib/user";

const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm" };
const DIRS: Partial<Record<PickFolder, string>> = { downloads: "Downloads", desktop: "Desktop", videos: process.platform === "darwin" ? "Movies" : "Videos", documents: "Documents" };
const isVideo = (path: string) => extname(path).toLowerCase() in TYPES;
// Names compared loosely: case, and the odd spaces some recordings have in their names (a narrow one before "PM").
const loose = (name: string) => name.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const stem = (name: string) => name.replace(/\.[^.]+$/, "");

/**
 * Local development only: a video from this computer, for Ask AI's "pull my video from Downloads" in the empty editor
 * with no file window (the dev server runs here, so it can read the file; no web page can). The file at a pasted path,
 * else the one named in the folder asked for (the newest when none is named). Videos only, inside the home folder,
 * read-only, for the signed-in developer (middleware). Never in production: there the server is far from the
 * customer's computer, and the desktop app does this (docs/DESKTOP_APP.md).
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });
  await requireUser();
  const body = (await req.json().catch(() => null)) as { path?: unknown; folder?: unknown; name?: unknown } | null;
  const home = await realpath(homedir());
  const win = process.platform === "win32";
  const inHome = (path: string) => (win ? path.toLowerCase() : path).startsWith((win ? home.toLowerCase() : home) + sep);

  let file: string | null = null;
  if (typeof body?.path === "string" && body.path.trim()) {
    const real = await realpath(body.path.trim()).catch(() => null);
    if (real && inHome(real) && isVideo(real)) file = real;
  }
  if (!file) {
    const folder = PICK_FOLDERS.find((f) => f === body?.folder) ?? "any";
    const name = typeof body?.name === "string" ? loose(body.name) : "";
    const videos: { path: string; name: string; at: number }[] = [];
    for (const f of folder === "any" ? (["downloads", "desktop", "videos"] as const) : [folder]) {
      const dir = DIRS[f] && join(home, DIRS[f]);
      if (!dir) continue;
      for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
        if (!entry.isFile() || !isVideo(entry.name)) continue;
        const at = (await stat(join(dir, entry.name)).catch(() => null))?.mtimeMs;
        if (at !== undefined) videos.push({ path: join(dir, entry.name), name: entry.name, at });
      }
    }
    videos.sort((a, b) => b.at - a.at);
    const match = !name ? videos[0] : (videos.find((v) => loose(v.name) === name) ?? videos.find((v) => loose(stem(v.name)) === stem(name)) ?? videos.find((v) => loose(v.name).includes(stem(name))));
    file = match?.path ?? null;
  }
  if (!file) return NextResponse.json({ error: "No video like that in that folder." }, { status: 422 });

  const type = TYPES[extname(file).toLowerCase()];
  const blob = await openAsBlob(file, { type });
  return new Response(blob, { headers: { "content-type": type, "content-length": String(blob.size), "x-file-name": encodeURIComponent(basename(file)) } });
}
