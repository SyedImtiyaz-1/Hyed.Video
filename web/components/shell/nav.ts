import { Captions, CreditCard, FolderOpen, Gauge, House, LayoutGrid, Plus, Settings, Shield, type LucideIcon } from "lucide-react";
import { recipeById } from "@launchreel/core/recipes";

/** New project: the editor, empty, waiting for a clip (the sidebar's button and the projects grid's tile open it). */
export const NEW_PROJECT = "/dashboard/edit/new";

/** A page in the menus. `also`: other pages that belong to it, so its link stays lit there. */
export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; also?: string[] };

// The sidebar's top: Home (the prompt box), the customer's projects (videos and reels together, and the editor on a
// clip from this computer) and the recipes.
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House, exact: true },
  { href: "/dashboard/videos", label: "Projects", icon: FolderOpen, also: ["/dashboard/edit"] },
  { href: "/dashboard/recipes", label: "Templates", icon: LayoutGrid },
];
// The sidebar's foot, under the credits (which open Billing).
export const ACCOUNT_NAV: NavItem[] = [
  { href: "/dashboard/usage", label: "Usage", icon: Gauge },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
const BILLING: NavItem = { href: "/dashboard/billing", label: "Billing", icon: CreditCard };
const NEW_VIDEO: NavItem = { href: "/dashboard/new", label: "New video", icon: Plus };
// The reel form: Home's prompt box and "Upload a clip" open it with the clip.
const NEW_REEL: NavItem = { href: "/dashboard/reels", label: "Reels", icon: Captions };

// Every page, for search and the phones' bottom bar. The forms aren't in the sidebar: Home starts videos and reels.
export const MAIN_NAV: NavItem[] = [...PRIMARY_NAV, NEW_VIDEO, NEW_REEL, BILLING, ...ACCOUNT_NAV];

export const ADMIN_NAV = { href: "/dashboard/admin", label: "Admin", icon: Shield };

export function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Whether a menu item is the page being shown: its own page and below, or one of the pages it takes in (`also`). */
export function navActive(pathname: string, item: NavItem) {
  return isActive(pathname, item.href, item.exact) || (item.also ?? []).some((href) => isActive(pathname, href));
}

const TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/videos": "Projects",
  "/dashboard/new": "New video",
  "/dashboard/start": "New video",
  "/dashboard/recipes": "Templates",
  "/dashboard/reels": "Reels",
  "/dashboard/usage": "Usage",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
  "/dashboard/admin": "Admin",
};

export function breadcrumbs(pathname: string): { label: string; href?: string }[] {
  const video = pathname.match(/^\/dashboard\/videos\/([^/]+)/);
  if (video) return [{ label: "Projects", href: "/dashboard/videos" }, { label: video[1].slice(-8) }];
  const recipe = pathname.match(/^\/dashboard\/recipes\/([^/]+)/);
  if (recipe) return [{ label: "Templates", href: "/dashboard/recipes" }, { label: recipeById(recipe[1])?.name ?? "Template" }];
  return [{ label: TITLES[pathname] ?? "Dashboard" }];
}
