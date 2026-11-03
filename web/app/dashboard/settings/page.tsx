import { getDb } from "@/lib/db";
import { isDemo } from "@/lib/demo";
import { requireUser } from "@/lib/user";
import { SettingsView, type SettingsTab } from "./settings-view";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Settings, laid out like Cardboard's (Taibanaz, 3 Nov): its own menu on the left, in groups (You: General, Appearance,
 * Notifications, Security; Workspace: Connectors, Brand kit, Billing, Developers, Data), and that part's cards on the
 * right. `?tab=` opens a part; switching parts happens in the page (settings-view.tsx).
 */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [user, { tab }] = await Promise.all([requireUser(), searchParams]);
  const token = isDemo ? null : await (await getDb()).repoToken.findUnique({ where: { userId: user.id }, select: { hint: true, createdAt: true, lastUsedAt: true } });
  return (
    <SettingsView
      tab={tab as SettingsTab | undefined}
      demo={isDemo}
      email={user.email ?? ""}
      since={user.createdAt.toISOString()}
      credits={user.credits}
      reelCredits={user.reelCredits}
      plan={user.plan}
      githubToken={token && { hint: token.hint, createdAt: token.createdAt.toISOString(), lastUsedAt: token.lastUsedAt?.toISOString() ?? null }}
    />
  );
}
