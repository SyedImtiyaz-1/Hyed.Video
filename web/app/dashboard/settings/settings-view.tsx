"use client";
import { useClerk, useUser } from "@clerk/nextjs";
import { CreditCard, KeyRound, Monitor, Moon, SlidersHorizontal, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { VOICES, type VoiceId } from "@launchreel/core/voices";
import { LogOutButton } from "@/components/shell/log-out-button";
import { buttonClasses } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { readPrefs, writePrefs, type Prefs } from "@/lib/prefs";

// The parts of Cardboard's account settings (Taibanaz, 3 Nov): Profile, Security, the plan and its billing, Preferences.
const TABS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "billing", label: "Plan & billing", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
] as const;

export type SettingsTab = (typeof TABS)[number]["id"];
// The light button of a card's footer (Save changes).
const SAVE = buttonClasses({ size: "sm", className: "border-transparent bg-gray-1000 text-background-100 hover:bg-gray-900" });

type Props = { tab?: string; demo: boolean; email: string; since: string; credits: number; reelCredits: number; plan: string };

/**
 * Settings: its menu on the left (the part open lit), that part's cards on the right; on phones the menu is a row. A
 * part opens at once, and the address keeps it (`?tab=`) for a reload or a link.
 */
export function SettingsView(props: Props) {
  const [tab, setTab] = useState<SettingsTab>(TABS.find((t) => t.id === props.tab)?.id ?? "profile");
  const open = (id: SettingsTab) => {
    setTab(id);
    window.history.replaceState(null, "", id === "profile" ? window.location.pathname : `?tab=${id}`);
  };
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-6 md:flex-row md:gap-10 md:px-8 md:py-10">
      <nav aria-label="Settings" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:w-56 md:shrink-0 md:overflow-visible md:px-0">
        <h1 className="mb-3 hidden px-3 text-lg font-semibold text-gray-1000 md:block">Settings</h1>
        <div className="flex gap-1 md:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
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
      </nav>

      <div className="min-w-0 flex-1 space-y-5">
        {tab === "profile" && (
          <>
            {props.demo ? <Profile email={props.email} /> : <EditableProfile email={props.email} />}
            <Account since={props.since} />
          </>
        )}
        {tab === "security" && <Security demo={props.demo} />}
        {tab === "billing" && <Billing credits={props.credits} reelCredits={props.reelCredits} plan={props.plan} />}
        {tab === "preferences" && <Preferences />}
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

/** The name, email and picture; read-only without an account to change (demo mode). */
function Profile({ email, name = "", onName, photo, footer }: { email: string; name?: string; onName?: (name: string) => void; photo?: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Panel title="Profile" description={`How you appear across ${BRAND.name}.`} footer={footer}>
      {photo}
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

/** The profile, changed on the Clerk account: the display name (Home greets by its first word) and the picture. */
function EditableProfile({ email }: { email: string }) {
  const { user } = useUser();
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "photo" | { error: string }>("idle");
  const current = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  useEffect(() => setName(current), [current]);
  const failed = (err: unknown, fallback: string) => {
    const why = (err as { errors?: { longMessage?: string; message?: string }[] }).errors?.[0];
    setState({ error: why?.longMessage ?? why?.message ?? fallback });
  };
  const save = async () => {
    if (!user) return;
    const [first = "", ...rest] = name.trim().split(/\s+/);
    setState("saving");
    try {
      await user.update({ firstName: first, lastName: rest.join(" ") });
      setState("saved");
      router.refresh();
    } catch (err) {
      failed(err, "Your name couldn't be saved. Try again.");
    }
  };
  const setPhoto = async (file: File | null) => {
    if (!user) return;
    setState("photo");
    try {
      await user.setProfileImage({ file });
      setState("idle");
    } catch (err) {
      failed(err, "Your picture couldn't be changed. Try a JPG or PNG.");
    }
  };
  const photo = (
    <div className="mb-5 flex items-center gap-4">
      {user?.imageUrl ? <img src={user.imageUrl} alt="" className="size-14 rounded-full object-cover" /> : <span className="size-14 rounded-full bg-gray-alpha-200" />}
      <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => (e.target.files?.[0] && void setPhoto(e.target.files[0]), (e.target.value = ""))} />
      <div className="flex gap-2">
        <button type="button" onClick={() => picker.current?.click()} disabled={!user || state === "photo"} className={buttonClasses({ size: "sm" })}>
          {state === "photo" ? "Uploading…" : "Change photo"}
        </button>
        {user?.hasImage && (
          <button type="button" onClick={() => void setPhoto(null)} disabled={state === "photo"} className={buttonClasses({ variant: "tertiary", size: "sm" })}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
  return (
    <Profile
      email={email}
      name={name}
      onName={(n) => (setName(n), setState("idle"))}
      photo={photo}
      footer={
        <>
          <span role="status" className={cn(typeof state === "object" && "text-red-900")}>
            {typeof state === "object" ? state.error : state === "saved" ? "Saved." : "Home greets you by your first name."}
          </span>
          <button type="button" onClick={() => void save()} disabled={!user || name.trim() === current || state === "saving"} className={SAVE}>
            {state === "saving" ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    />
  );
}

function Account({ since }: { since: string }) {
  return (
    <Panel
      danger
      title="Delete account"
      description={`Permanently remove your account, your videos and your credit history. You've been with ${BRAND.name} since ${formatDateTime(since)}.`}
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

function Security({ demo }: { demo: boolean }) {
  return demo ? (
    <Panel title="Password and devices" description="Demo mode has no account: passwords and devices aren't here." />
  ) : (
    <>
      <SignIn />
      <Panel
        title="Log out"
        description={`Log out of ${BRAND.name} on this device.`}
        footer={
          <>
            <span>You can sign back in any time.</span>
            <LogOutButton />
          </>
        }
      />
    </>
  );
}

function SignIn() {
  const clerk = useClerk();
  return (
    <Panel
      title="Password and devices"
      description="Change your password, the Google or GitHub account you sign in with, and see the devices you're signed in on (and sign them out)."
      footer={
        <>
          <span>Opens your account&apos;s security settings.</span>
          <button type="button" onClick={() => clerk.openUserProfile()} className={SAVE}>
            Manage
          </button>
        </>
      }
    />
  );
}

function Billing({ credits, reelCredits, plan }: { credits: number; reelCredits: number; plan: string }) {
  return (
    <Panel
      title="Plan & billing"
      description="Pay once for credits when you need them: no subscription, and credits never expire."
      footer={
        <>
          <Link href="/dashboard/usage" className="text-gray-1000 underline-offset-2 hover:underline">
            Credit history
          </Link>
          <Link href="/dashboard/billing" className={SAVE}>
            Buy credits
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Plan", plan.charAt(0) + plan.slice(1).toLowerCase()],
          ["Credits", credits],
          ["Reel credits", reelCredits],
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

const THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/** The theme, the voiceover new videos start with, and the editor's settings; kept in this browser. */
function Preferences() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  useEffect(() => setPrefs(readPrefs()), []);
  const change = (next: Partial<Prefs>) => {
    writePrefs(next);
    setPrefs((p) => (p ? { ...p, ...next } : p));
  };
  return (
    <>
      <Panel title="Theme" description={`How ${BRAND.name} looks on this device. It starts dark until you pick one.`}>
        <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
          {THEMES.map(({ value, label, icon: Icon }) => {
            const on = prefs !== null && theme === value;
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

      <Panel title="Voiceover" description="The narrator a new product video starts with. You can still change it on each video.">
        <Label htmlFor="voice">Default voice</Label>
        <select
          id="voice"
          value={prefs?.voice ?? ""}
          disabled={!prefs}
          onChange={(e) => change({ voice: (e.target.value || null) as VoiceId | null })}
          className="h-10 w-full max-w-sm rounded-md border border-gray-alpha-400 bg-background-100 px-3 text-sm text-gray-1000"
        >
          <option value="">No voiceover</option>
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}: {v.style}, {v.accent} {v.gender.toLowerCase()}
            </option>
          ))}
        </select>
      </Panel>

      <Panel title="Editor" description="How the editor works for you.">
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-gray-1000">Snap to the playhead</span>
              <span className="block text-[13px] text-gray-900">A piece dragged on the timeline lands on the playhead when it&apos;s close.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs?.snap ?? true}
              disabled={!prefs}
              onClick={() => prefs && change({ snap: !prefs.snap })}
              className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", prefs?.snap ?? true ? "bg-gray-1000" : "bg-gray-alpha-400")}
            >
              <span className={cn("absolute top-0.5 size-5 rounded-full bg-background-100 transition-transform", prefs?.snap ?? true ? "translate-x-[22px]" : "translate-x-0.5")} />
            </button>
          </label>
          <div className="flex items-center justify-between gap-4 border-t border-gray-alpha-400 pt-4">
            <span>
              <span className="block text-sm font-medium text-gray-1000">Export quality</span>
              <span className="block text-[13px] text-gray-900">4K, 60 fps and MOV come with Premium.</span>
            </span>
            <span className="text-sm text-gray-1000">1080p · 30 fps · MP4</span>
          </div>
        </div>
      </Panel>
    </>
  );
}
