"use client";
import { useClerk, useUser } from "@clerk/nextjs";
import { Bell, Code, CreditCard, Database, KeyRound, Monitor, Moon, Palette, Plug, Settings, SwatchBook, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { LogOutButton } from "@/components/shell/log-out-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

const GROUPS = [
  {
    label: "You",
    items: [
      { id: "general", label: "General", icon: Settings },
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "security", label: "Security", icon: KeyRound },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "connectors", label: "Connectors", icon: Plug },
      { id: "brand", label: "Brand kit", icon: SwatchBook },
      { id: "billing", label: "Billing", icon: CreditCard },
      { id: "developers", label: "Developers", icon: Code },
      { id: "data", label: "Data", icon: Database },
    ],
  },
] as const;

export type SettingsTab = (typeof GROUPS)[number]["items"][number]["id"];
const TABS = GROUPS.flatMap((g) => g.items.map((i) => i.id)) as SettingsTab[];
// The light button of a card's footer (Save changes).
const SAVE = buttonClasses({ size: "sm", className: "border-transparent bg-gray-1000 text-background-100 hover:bg-gray-900" });

type Props = {
  tab?: SettingsTab;
  demo: boolean;
  email: string;
  since: string;
  credits: number;
  reelCredits: number;
  plan: string;
  githubToken: { hint: string; createdAt: string; lastUsedAt: string | null } | null;
};

/**
 * Settings: its menu on the left (in groups, the part open lit), that part's cards on the right; on phones the menu is
 * a row that scrolls. A part opens at once, and the address keeps it (`?tab=`) for a reload or a link.
 */
export function SettingsView(props: Props) {
  const [tab, setTab] = useState<SettingsTab>(props.tab && TABS.includes(props.tab) ? props.tab : "general");
  const open = (id: SettingsTab) => {
    setTab(id);
    window.history.replaceState(null, "", id === "general" ? window.location.pathname : `?tab=${id}`);
  };
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-8 md:py-10">
      <h1 className="sr-only">Settings</h1>
      <nav aria-label="Settings" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:w-60 md:shrink-0 md:overflow-visible md:px-0">
        <div className="flex gap-1 md:flex-col md:gap-6">
          {GROUPS.map((group) => (
            <div key={group.label} className="flex gap-1 md:flex-col">
              <p className="hidden px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-900 md:block">{group.label}</p>
              {group.items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => open(id)}
                  aria-current={tab === id ? "page" : undefined}
                  className={cn("flex h-9 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-sm transition-colors md:h-10", tab === id ? "bg-gray-alpha-200 font-medium text-gray-1000" : "text-gray-900 hover:bg-gray-alpha-100 hover:text-gray-1000")}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 space-y-5">
        {tab === "general" && <General {...props} />}
        {tab === "appearance" && <Appearance />}
        {tab === "notifications" && <Soon title="Notifications" description="An email when a video is ready, or when a render fails." />}
        {tab === "security" && <Security demo={props.demo} />}
        {tab === "connectors" && <Connectors demo={props.demo} token={props.githubToken} />}
        {tab === "brand" && <Soon title="Brand kit" description="Your logo, colours, fonts and voice, set once: every video uses them." />}
        {tab === "billing" && <Billing credits={props.credits} reelCredits={props.reelCredits} plan={props.plan} />}
        {tab === "developers" && <Soon title="API keys" description="Make videos from your own code, your CI or a GitHub Action, on the same credits." />}
        {tab === "data" && <Data />}
      </div>
    </div>
  );
}

/** A settings card: its title and line, what's in it, and a footer strip (a note, and its button). */
function Panel({ title, description, children, footer, danger }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; danger?: boolean }) {
  return (
    <section className={cn("rounded-2xl border bg-background-100", danger ? "border-red-400" : "border-gray-alpha-400")}>
      <div className="p-5 md:p-6">
        <h2 className="text-base font-semibold text-gray-1000">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-900">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
      {footer && <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t px-5 py-3 text-sm md:px-6", danger ? "border-red-400 bg-red-100 text-red-900" : "border-gray-alpha-400 bg-background-200 text-gray-900")}>{footer}</div>}
    </section>
  );
}

function Soon({ title, description }: { title: string; description: string }) {
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          {title} <Badge>Coming soon</Badge>
        </span>
      }
      description={description}
    />
  );
}

function General({ demo, email, since }: Props) {
  return (
    <>
      {demo ? <Profile email={email} /> : <EditableProfile email={email} />}
      <Panel title="Account" description={`When you joined ${BRAND.name}.`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="since">Member since</Label>
            <Input id="since" value={formatDateTime(since)} readOnly disabled />
          </div>
        </div>
      </Panel>
    </>
  );
}

/** The name and email, read-only (demo mode has no account to change). */
function Profile({ email, name = "", onName, footer }: { email: string; name?: string; onName?: (name: string) => void; footer?: React.ReactNode }) {
  return (
    <Panel title="Profile" description={`How you appear across ${BRAND.name}.`} footer={footer}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => onName?.(e.target.value)} readOnly={!onName} disabled={!onName} maxLength={80} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} readOnly disabled />
        </div>
      </div>
    </Panel>
  );
}

/** The display name, changed on the Clerk account: its first word is the first name Home greets you by. */
function EditableProfile({ email }: { email: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | { error: string }>("idle");
  const current = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  useEffect(() => setName(current), [current]);
  const save = async () => {
    if (!user) return;
    const [first = "", ...rest] = name.trim().split(/\s+/);
    setState("saving");
    try {
      await user.update({ firstName: first, lastName: rest.join(" ") });
      setState("saved");
      router.refresh();
    } catch (err) {
      const why = (err as { errors?: { longMessage?: string; message?: string }[] }).errors?.[0];
      setState({ error: why?.longMessage ?? why?.message ?? "Your name couldn't be saved. Try again." });
    }
  };
  const changed = name.trim() !== current;
  return (
    <Profile
      email={email}
      name={name}
      onName={(n) => (setName(n), setState("idle"))}
      footer={
        <>
          <span role="status" className={cn(typeof state === "object" && "text-red-900")}>
            {typeof state === "object" ? state.error : state === "saved" ? "Saved." : "Home greets you by your first name."}
          </span>
          <button type="button" onClick={() => void save()} disabled={!user || !changed || state === "saving"} className={SAVE}>
            {state === "saving" ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    />
  );
}

const THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

function Appearance() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Panel title="Theme" description={`How ${BRAND.name} looks on this device. It starts dark until you pick one.`}>
      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
        {THEMES.map(({ value, label, icon: Icon }) => {
          const on = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTheme(value)}
              className={cn("flex h-12 items-center gap-2.5 rounded-xl border px-4 text-sm transition-colors", on ? "border-gray-1000 bg-gray-alpha-100 font-medium text-gray-1000" : "border-gray-alpha-400 text-gray-900 hover:border-gray-alpha-600 hover:text-gray-1000")}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function Security({ demo }: { demo: boolean }) {
  return demo ? (
    <Panel title="Sign-in" description="Demo mode has no account: sign-in, passwords and devices aren't here." />
  ) : (
    <>
      <SignIn />
      <Panel title="Log out" description={`Log out of ${BRAND.name} on this device.`} footer={<><span>You can sign back in any time.</span><LogOutButton /></>} />
    </>
  );
}

function SignIn() {
  const clerk = useClerk();
  return (
    <Panel
      title="Sign-in and devices"
      description="Your password, the Google or GitHub accounts you sign in with, and the devices you're signed in on."
      footer={
        <>
          <span>Opens your account&apos;s sign-in settings.</span>
          <button type="button" onClick={() => clerk.openUserProfile()} className={SAVE}>
            Manage sign-in
          </button>
        </>
      }
    />
  );
}

function Connectors({ demo, token }: { demo: boolean; token: Props["githubToken"] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const remove = async () => {
    setRemoving(true);
    await fetch("/api/repo-token", { method: "DELETE" }).catch(() => null);
    setRemoving(false);
    router.refresh();
  };
  return (
    <Panel
      title="GitHub"
      description="A token for your private repos, so a video can be made from one. It's encrypted in your browser before it's saved, and only the render server can read it."
      footer={
        token ? (
          <>
            <span>
              Saved {formatDateTime(token.createdAt)}
              {token.lastUsedAt ? ` · last used ${formatDateTime(token.lastUsedAt)}` : " · not used yet"}
            </span>
            <Button size="sm" onClick={() => void remove()} disabled={removing}>
              {removing ? "Removing…" : "Remove"}
            </Button>
          </>
        ) : (
          <>
            <span>{demo ? "Private repos are off in demo mode." : "Add one when you make a video from a private repo."}</span>
            {!demo && (
              <Link href="/dashboard/new" className={SAVE}>
                New video
              </Link>
            )}
          </>
        )
      }
    >
      {token && (
        <div className="flex items-center gap-2 text-sm text-gray-1000">
          <span className="size-2 rounded-full bg-green-700" aria-hidden />
          Connected · <code className="font-mono text-[13px] text-gray-900">{token.hint}</code>
        </div>
      )}
    </Panel>
  );
}

function Billing({ credits, reelCredits, plan }: { credits: number; reelCredits: number; plan: string }) {
  return (
    <Panel
      title="Credits"
      description="What you have left to make videos and reels with."
      footer={
        <>
          <Link href="/dashboard/usage" className="text-gray-1000 underline-offset-2 hover:underline">
            See usage
          </Link>
          <Link href="/dashboard/billing" className={SAVE}>
            Buy credits
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Credits", credits],
          ["Reel credits", reelCredits],
          ["Plan", plan.charAt(0) + plan.slice(1).toLowerCase()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-gray-alpha-400 px-4 py-3">
            <p className="text-xs text-gray-900">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-1000">{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Data() {
  return (
    <Panel
      danger
      title="Delete account"
      description="Permanently remove your account, your videos and your credit history."
      footer={
        <>
          <span>This can&apos;t be undone. We&apos;ll confirm by email.</span>
          <a href={`mailto:${BRAND.supportEmail}?subject=Delete%20my%20account`} className={buttonClasses({ variant: "error", size: "sm" })}>
            Request deletion
          </a>
        </>
      }
    />
  );
}
