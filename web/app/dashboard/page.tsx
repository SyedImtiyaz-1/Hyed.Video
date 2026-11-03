import { CircleCheck, Clapperboard, Clock, Coins } from "lucide-react";
import { PromptBox } from "@/components/create/prompt-box";
import { serifUpright } from "@/components/create/serif";
import { CategoryChips, GalleryFilterProvider } from "@/components/recipes/gallery-filter";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { RemixStrip } from "@/components/recipes/remix-strip";
import { AutoRefresh } from "@/components/video/auto-refresh";
import { ProjectGrid } from "@/components/video/project-grid";
import { PageBody, SectionTitle } from "@/components/ui/page";
import { getStats, listVideos } from "@/lib/data";
import { cn } from "@/lib/cn";
import { isDemo } from "@/lib/demo";
import { formatDuration, plural } from "@/lib/format";
import { firstName, requireUser } from "@/lib/user";
import { HomeTabs } from "./home-tabs";
import { Stat } from "./stat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home" };

/**
 * The dashboard's home is a workspace, like Cardboard's app (the marketing look stays on the landing page): a greeting
 * by first name over the prompt box (Taibanaz, 3 Nov), the template types as chips under it, then one card with the
 * templates (videos to remix, then every template by category) and the customer's own projects, and this month's
 * numbers at the bottom. A chip opens its templates in the card; templates open in a modal over the page
 * (recipe-modal.tsx).
 */
export default async function Home() {
  const [user, name] = await Promise.all([requireUser(), firstName()]);
  const [recent, stats] = await Promise.all([listVideos(user.id, { take: 14 }), getStats(user.id)]);
  const rendering = recent.some((j) => j.status === "QUEUED" || j.status === "RUNNING");

  return (
    <GalleryFilterProvider>
      <AutoRefresh active={rendering} />
      <section className="relative overflow-hidden">
        {/* A soft glow from the top, drifting slowly. */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] h-[520px] w-[min(1100px,160vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(200_241_53/0.10),transparent)] motion-safe:animate-aurora" />
        <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-10 md:pb-10 md:pt-20">
          <div className="text-center">
            <h1 className={cn(serifUpright.className, "text-[36px] leading-[1.1] tracking-[-0.02em] text-gray-1000 md:text-[52px]")}>What video are we making today{name ? `, ${name}` : ""}?</h1>
            <p className="mt-3 text-sm text-gray-900 md:text-base">Paste your website or GitHub repo, describe your video, or bring in a clip to get started.</p>
          </div>
          <PromptBox variant="app" shortcuts={false} demo={isDemo} className="mt-8" />
          <CategoryChips className="mt-4" />
        </div>
      </section>

      <PageBody className="space-y-10 pt-2">
        <HomeTabs
          recipes={
            <div className="space-y-10">
              <RemixStrip />
              <div className="h-px bg-gray-alpha-400" />
              <RecipeBrowser />
            </div>
          }
          projects={<ProjectGrid jobs={recent} newHref="/dashboard/edit/new" />}
        />
        <section>
          <SectionTitle>This month</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <Stat label="Credits" value={user.credits} hint={`Enough for ${plural(user.credits, "short video")}`} icon={<Coins />} />
            <Stat label="Videos this month" value={stats.videosThisMonth} hint={`${plural(stats.revisionsThisMonth, "revision")} · ${stats.inProgress} in progress`} icon={<Clapperboard />} />
            <Stat label="Success rate" value={stats.successRate == null ? "—" : `${Math.round(stats.successRate * 100)}%`} hint="Last 30 days" icon={<CircleCheck />} />
            <Stat label="Avg. render time" value={formatDuration(stats.avgRenderSeconds)} hint="Last 30 days" icon={<Clock />} />
          </div>
        </section>
      </PageBody>
    </GalleryFilterProvider>
  );
}
