import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Local development only (the routes under /api/local, and Ask AI before a clip when the render Worker isn't running): the OpenAI key, the process's or the root .env's (`next dev`
 * runs in web/, and Next reads only web/'s env files). In production the web app has no model key: the render Worker
 * holds it.
 */
export function openaiKey(): string | undefined {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try {
    const line = readFileSync(resolve(process.cwd(), "..", ".env"), "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("OPENAI_API_KEY="));
    return line?.slice("OPENAI_API_KEY=".length).trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

/** OpenAI's API, or the address OPENAI_BASE_URL points it at. */
export const openaiBase = () => (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");

/** A chat completion asked here with the local key (the call the render Worker makes): the answer's text. */
export async function localCompletion(request: object): Promise<string> {
  const key = openaiKey();
  if (!key) throw new Error("Add OPENAI_API_KEY to the root .env to use Ask AI here.");
  const res = await fetch(`${openaiBase()}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!res?.ok) throw new Error(`The assistant didn't answer (${res?.status ?? "offline"}).`);
  const body = (await res.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content ?? "";
}
