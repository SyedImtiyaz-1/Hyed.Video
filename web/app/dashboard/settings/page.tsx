import { isDemo } from "@/lib/demo";
import { requireUser } from "@/lib/user";
import { SettingsView } from "./settings-view";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Settings, in the parts Cardboard's have (Taibanaz, 3 Nov): Profile, Security, Plan & billing, Preferences. Its own menu
 * on the left, that part's cards on the right; `?tab=` opens a part, and switching parts happens in the page
 * (settings-view.tsx).
 */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [user, { tab }] = await Promise.all([requireUser(), searchParams]);
  return <SettingsView tab={tab} demo={isDemo} email={user.email ?? ""} since={user.createdAt.toISOString()} credits={user.credits} reelCredits={user.reelCredits} plan={user.plan} />;
}
