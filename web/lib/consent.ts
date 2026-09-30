import { useSyncExternalStore } from "react";

// Cookie consent for the public site, remembered in this browser's localStorage.
// Marketing tags (the Meta Pixel) must only load when `useMarketingConsent()` is true.

export type ConsentChoice = "granted" | "denied";
/** "loading" during server render and hydration, "unset" until the visitor chooses. */
export type ConsentState = ConsentChoice | "unset" | "loading";

const STORAGE_KEY = "buzz-crew-consent";
const listeners = new Set<() => void>();

// Fallback for browsers that block localStorage (e.g. some private modes): the choice
// then lasts for the current page session only.
let memoryChoice: ConsentChoice | null = null;
let settingsOpen = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readChoice(): ConsentState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") return stored;
  } catch {
    // Storage unavailable; fall through to the in-memory choice.
  }
  return memoryChoice ?? "unset";
}

export function setConsent(choice: ConsentChoice) {
  memoryChoice = choice;
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Keep the in-memory choice only.
  }
  settingsOpen = false;
  emit();
}

/** Re-opens the banner so the visitor can change their choice (footer "Cookie settings"). */
export function openConsentSettings() {
  settingsOpen = true;
  emit();
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, readChoice, () => "loading");
}

export function useConsentSettingsOpen(): boolean {
  return useSyncExternalStore(subscribe, () => settingsOpen, () => false);
}

export function useMarketingConsent(): boolean {
  return useConsent() === "granted";
}
