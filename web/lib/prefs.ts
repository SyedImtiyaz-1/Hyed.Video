import type { VoiceId } from "@launchreel/core/voices";

/**
 * The customer's preferences (Settings → Preferences), kept in this browser: the voiceover a new video starts with
 * (null: none), and whether pieces dragged on the timeline snap to the playhead. Read after the page is in (an effect),
 * never while it renders on the server.
 */
export type Prefs = { voice: VoiceId | null; snap: boolean };

const KEY = "hyped:prefs";
const DEFAULTS: Prefs = { voice: null, snap: true };

export function readPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

export function writePrefs(change: Partial<Prefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...change }));
  } catch {
    // Storage blocked: the preference lasts this visit only.
  }
}
