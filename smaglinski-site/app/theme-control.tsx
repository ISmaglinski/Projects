"use client";

import { useSyncExternalStore } from "react";

type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "smaglinski-theme";
const THEME_EVENT = "smaglinski-theme-change";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const resolved =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;

  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#151713" : "#f3efe7");
}

function getPreferenceSnapshot(): ThemePreference {
  const value = document.documentElement.dataset.themePreference ?? null;
  return isThemePreference(value) ? value : "system";
}

function getServerPreferenceSnapshot(): ThemePreference {
  return "system";
}

function subscribeToPreference(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const syncSystemTheme = () => {
    if (getPreferenceSnapshot() === "system") {
      applyTheme("system");
    }
  };
  const syncStoredTheme = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) {
      return;
    }

    const nextPreference = isThemePreference(event.newValue)
      ? event.newValue
      : "system";
    applyTheme(nextPreference);
    onStoreChange();
  };

  media.addEventListener("change", syncSystemTheme);
  window.addEventListener("storage", syncStoredTheme);
  window.addEventListener(THEME_EVENT, onStoreChange);

  return () => {
    media.removeEventListener("change", syncSystemTheme);
    window.removeEventListener("storage", syncStoredTheme);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

export function ThemeControl() {
  const preference = useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    getServerPreferenceSnapshot,
  );

  const updatePreference = (nextPreference: ThemePreference) => {
    applyTheme(nextPreference);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextPreference);
    } catch {
      // The preference still applies for this session when storage is blocked.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <label className="theme-control">
      <span>Theme</span>
      <select
        aria-label="Color theme"
        value={preference}
        onChange={(event) =>
          updatePreference(event.target.value as ThemePreference)
        }
      >
        <option value="system">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
