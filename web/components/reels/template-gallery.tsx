"use client";
import { Check } from "lucide-react";
import { useState } from "react";
import { CAPTION_TEMPLATE_GROUPS, CAPTION_TEMPLATES, captionTemplate, type CaptionTemplate, type CaptionTemplateGroup } from "@launchreel/core/caption-templates";
import { cn } from "@/lib/cn";
import { StyleFrame, useTick } from "./style-picker";

/**
 * Ready-made caption looks, a group at a time, each previewing itself on the sample frame. Picking one sets the style,
 * its changes and (for "Behind you") the big-word fonts, which all stay editable below. `value` is the template the
 * current settings are, if any. Product videos have no speaker to put words behind, so they get no "Behind you".
 */
export function TemplateGallery({ value, onPick, product = false }: { value?: string; onPick: (template: CaptionTemplate) => void; product?: boolean }) {
  const tick = useTick();
  const groups = CAPTION_TEMPLATE_GROUPS.filter((g) => !(product && g.id === "behind"));
  const [group, setGroup] = useState<CaptionTemplateGroup>(() => {
    const current = value ? captionTemplate(value)?.group : undefined;
    return current && groups.some((g) => g.id === current) ? current : groups[0].id;
  });
  const shown = CAPTION_TEMPLATES.filter((t) => t.group === group);
  const hint = groups.find((g) => g.id === group)?.hint;
  return (
    <div>
      <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Template groups">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={group === g.id}
            onClick={() => setGroup(g.id)}
            className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors", group === g.id ? "border-gray-1000 bg-gray-1000 font-medium text-background-100" : "border-gray-alpha-400 text-gray-900 hover:border-gray-alpha-500 hover:text-gray-1000")}
          >
            {g.label}
          </button>
        ))}
      </div>
      {/* A row to swipe through on phones, a grid from tablets up, as the caption styles. */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6" role="radiogroup" aria-label="Caption template">
        {shown.map((t) => {
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${t.name}: ${t.hint}`}
              title={t.hint}
              onClick={() => onPick(t)}
              className={cn(
                "relative flex w-[108px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border text-left transition-colors sm:w-auto",
                selected ? "border-gray-1000 ring-1 ring-gray-1000" : "border-gray-alpha-400 hover:border-gray-alpha-500",
              )}
            >
              <StyleFrame style={t.style} changes={t.look} fonts={t.fonts} tick={tick} />
              <span className="block border-t border-gray-alpha-400 bg-background-100 px-2 py-1.5 text-[13px] font-medium text-gray-1000">{t.name}</span>
              {selected && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-white text-black">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[13px] text-gray-900">{value && captionTemplate(value) ? <><span className="font-medium text-gray-1000">{captionTemplate(value)!.name}:</span> {captionTemplate(value)!.hint}. Change anything below.</> : `${hint}. Pick one, then change anything below.`}</p>
    </div>
  );
}
