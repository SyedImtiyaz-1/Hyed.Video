"use client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGalleryFilter } from "@/components/recipes/gallery-filter";
import { setHomeSection } from "@/components/shell/home-section";
import { cn } from "@/lib/cn";

type Tab = "recipes" | "projects";
// The card counts as reached once its top is in the upper two fifths of the window.
const REACHED = 0.4;

/**
 * The dashboard home's lower card: recipes to remix and the customer's own projects (videos and reels), behind a pill
 * switch. Both panels are rendered on the server and only shown or hidden here, so switching is instant.
 */
export function HomeTabs({ recipes, projects }: { recipes: React.ReactNode; projects: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("recipes");
  // A category chip under the prompt box opens the templates.
  const filter = useGalleryFilter();
  useEffect(() => {
    if (filter?.jump) setTab("recipes");
  }, [filter?.jump]);
  // Scrolled down to this card, the sidebar lights Templates or Projects (whichever tab is open); back up, Home.
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const top = card.current?.getBoundingClientRect().top ?? Infinity;
      setHomeSection(top < window.innerHeight * REACHED ? (tab === "projects" ? "projects" : "templates") : "home");
    };
    const onScroll = () => (frame ||= requestAnimationFrame(check));
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tab]);
  // Leaving the home: nothing of it is lit any more.
  useEffect(() => () => setHomeSection("home"), []);
  const tabs: { id: Tab; label: string; all: string }[] = [
    { id: "recipes", label: "Templates", all: "/dashboard/recipes" },
    { id: "projects", label: "Your projects", all: "/dashboard/videos" },
  ];
  const current = tabs.find((t) => t.id === tab)!;
  return (
    <div ref={card} className="rounded-2xl border border-gray-alpha-400 bg-background-200/60 p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div role="tablist" aria-label="Home" className="inline-flex items-center gap-0.5 rounded-full border border-gray-alpha-400 bg-background-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn("h-8 rounded-full px-4 text-sm transition-colors", tab === t.id ? "bg-gray-1000 font-medium text-background-100" : "text-gray-900 hover:text-gray-1000")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link href={current.all} className="inline-flex items-center gap-1 py-2 text-sm text-gray-900 hover:text-gray-1000">
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div role="tabpanel" id="panel-recipes" aria-labelledby="tab-recipes" hidden={tab !== "recipes"}>
        {recipes}
      </div>
      <div role="tabpanel" id="panel-projects" aria-labelledby="tab-projects" hidden={tab !== "projects"}>
        {projects}
      </div>
    </div>
  );
}
