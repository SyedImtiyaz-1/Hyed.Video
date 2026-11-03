// A clip handed from one page to the next in this tab (the prompt box to the editor on a clip from this computer):
// kept in memory, which a navigation inside the app keeps, so even a big file opens at once without being copied. A
// reload loses it, and the editor asks for the clip again.
let handed: File | null = null;

/** What was said to Ask AI in the empty editor before the clip, going with it: the messages, and a request kept for the clip. */
export type HandedChat = { messages: { from: "you" | "ai"; text: string }[]; ask?: string };
let said: HandedChat | null = null;

export const handClip = (file: File, chat?: HandedChat) => void ((handed = file), (said = chat ?? null));

export function takeClip(): File | null {
  const file = handed;
  handed = null;
  return file;
}

/** The conversation handed with the clip, once. */
export function takeChat(): HandedChat | null {
  const chat = said;
  said = null;
  return chat;
}
