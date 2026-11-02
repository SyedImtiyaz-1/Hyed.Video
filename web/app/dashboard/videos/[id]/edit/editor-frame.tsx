import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { NEW_PROJECT } from "@/components/shell/nav";
import { ButtonLink } from "@/components/ui/button";

/**
 * The editor's frame for what the reel editor can't edit yet (components/reels/reel-editor.tsx has the same layout):
 * a video while its first cut is being made, and product videos. The bar, the library on the left, the stage in the
 * middle, Ask AI on the right, the timeline below; on phones one column.
 */
export function EditorFrame({
  name,
  detail,
  actions,
  library,
  stage,
  side,
  timeline,
}: {
  name: string;
  detail: string;
  actions?: React.ReactNode;
  library: React.ReactNode;
  stage: React.ReactNode;
  side: React.ReactNode;
  timeline: React.ReactNode;
}) {
  return (
    // Wide screens: the window's height, as the reel editor (the timeline stays in view).
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:h-dvh lg:min-h-[520px] lg:py-3">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2 lg:mb-3">
        <ButtonLink href="/dashboard" variant="tertiary" size="sm" aria-label="Back to the dashboard" title="Back to the dashboard">
          <ArrowLeft />
        </ButtonLink>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-medium text-gray-1000">{name}</h1>
          <p className="truncate text-xs text-gray-900">{detail}</p>
        </div>
        <ButtonLink href={NEW_PROJECT} variant="secondary" size="sm" title="Start a new project in an empty editor" aria-label="New project">
          <Plus />
          <span className="hidden sm:inline">New project</span>
        </ButtonLink>
        {actions}
      </div>
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,340px)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-x-5 lg:gap-y-3">
        <div className="order-2 min-w-0 lg:order-none lg:overflow-y-auto">
          <p className="mb-3 text-sm font-medium text-gray-1000">Library</p>
          {library}
        </div>
        <div className="order-1 flex min-w-0 items-center justify-center rounded-xl border border-gray-alpha-400 bg-background-200 p-4 lg:order-none lg:min-h-0 lg:overflow-auto">{stage}</div>
        {/* Ask AI: the editor's full height, beside the timeline too (the timeline is under the library and the stage). */}
        <div className="order-3 flex min-w-0 flex-col lg:order-none lg:row-span-2 lg:min-h-0">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-1000">
            <Sparkles className="size-3.5 text-brand" /> Ask AI
          </p>
          <div className="flex min-h-[200px] flex-1 flex-col">{side}</div>
        </div>
        <div className="order-4 min-w-0 lg:order-none lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:max-h-[40dvh] lg:overflow-y-auto">{timeline}</div>
      </div>
    </div>
  );
}

/** One line in the library: what the video is made from, or a file of it. */
export function LibraryItem({ icon, title, detail, action }: { icon: React.ReactNode; title: string; detail?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-alpha-400 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-alpha-100 text-gray-900 [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-1000">{title}</p>
        {detail && <p className="truncate text-[13px] text-gray-900">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

/** A request of the customer's, as the chat shows it. */
export function YouSaid({ children }: { children: React.ReactNode }) {
  return <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-gray-1000 px-3 py-2 text-[13px] leading-relaxed text-background-100">{children}</p>;
}

/** An answer, as the chat shows it. */
export function AiSaid({ children }: { children: React.ReactNode }) {
  return <div className="w-fit max-w-[85%] rounded-lg bg-gray-alpha-100 px-3 py-2 text-[13px] leading-relaxed text-gray-1000">{children}</div>;
}
