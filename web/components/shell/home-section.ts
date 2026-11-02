"use client";
import { useSyncExternalStore } from "react";

/**
 * Where the dashboard home is scrolled to, for the sidebar to light it (as Cardboard's does): the prompt box ("home"),
 * or the lower card on its Templates or Your projects tab. Set by the home's card (home-tabs.tsx), "home" elsewhere.
 */
export type HomeSection = "home" | "templates" | "projects";

let current: HomeSection = "home";
const listeners = new Set<() => void>();

export function setHomeSection(section: HomeSection) {
  if (section === current) return;
  current = section;
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const useHomeSection = () => useSyncExternalStore(subscribe, () => current, () => "home" as HomeSection);
