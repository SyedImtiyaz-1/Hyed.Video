"use client";
import { useSyncExternalStore } from "react";

/**
 * Where the dashboard home is scrolled to, for the sidebar to light it (as Cardboard's does): the prompt box ("home"),
 * or the lower card on its Templates or Your projects tab. Set by the home's card (home-tabs.tsx), "home" elsewhere.
 * The other way, the sidebar asks the home to go to a part of it (`goToHomeSection`), and the card scrolls there.
 */
export type HomeSection = "home" | "templates" | "projects";

let current: HomeSection = "home";
const listeners = new Set<() => void>();
const goers = new Set<(section: HomeSection) => void>();

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

/** The sidebar, on the home: go to this part of it. True when the home is there to take it (its card is mounted). */
export function goToHomeSection(section: HomeSection) {
  if (!goers.size) return false;
  setHomeSection(section);
  for (const go of goers) go(section);
  return true;
}

/** The home's card: called when the sidebar asks for a part of it. */
export function onGoToHomeSection(go: (section: HomeSection) => void) {
  goers.add(go);
  return () => void goers.delete(go);
}
