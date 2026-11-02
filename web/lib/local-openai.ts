import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Local development only (the routes under /api/local): the OpenAI key, the process's or the root .env's (`next dev`
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
