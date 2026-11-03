import { NextResponse } from "next/server";
import { cleanProjectChat } from "@launchreel/core/project-chat";
import { chatAllowed } from "@/lib/chat-limit";
import { askProjectAssistant } from "@/lib/reel-assistant";
import { requireUser } from "@/lib/user";

/**
 * Ask AI in a new project, before it has a clip (the empty editor): the message and the conversation so far to the
 * assistant (the render Worker's ReelAssistant), and its answer back: a reply, a folder to offer to pick the clip from,
 * and the request kept for when the clip is in. It changes nothing itself; the editor shows the offer as a button.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  const input = cleanProjectChat(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "That message couldn't be read." }, { status: 400 });
  if (!chatAllowed(user.id)) return NextResponse.json({ error: "That's a lot of questions in a few minutes. Give it a moment, then ask again." }, { status: 429 });
  try {
    const answer = await askProjectAssistant(input);
    if (!answer) return NextResponse.json({ error: "Ask AI isn't available here yet." }, { status: 503 });
    return NextResponse.json({ reply: answer.reply, pick: answer.pick, keep: answer.keep });
  } catch (err) {
    console.error("[project-chat]", err);
    return NextResponse.json({ error: "The assistant didn't answer. Try again in a moment." }, { status: 502 });
  }
}
