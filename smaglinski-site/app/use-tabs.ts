"use client";

import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export function useHashTabs<T extends string>(
  ids: readonly T[],
  fallback: T,
  prefix: string,
) {
  const [activeTab, setActiveTab] = useState<T>(fallback);

  const readLocation = useCallback(() => {
    const candidate = window.location.hash.replace(/^#/, "") as T;
    setActiveTab(ids.includes(candidate) ? candidate : fallback);
  }, [fallback, ids]);

  useEffect(() => {
    const initialRead = window.requestAnimationFrame(readLocation);
    window.addEventListener("hashchange", readLocation);
    window.addEventListener("popstate", readLocation);

    return () => {
      window.cancelAnimationFrame(initialRead);
      window.removeEventListener("hashchange", readLocation);
      window.removeEventListener("popstate", readLocation);
    };
  }, [readLocation]);

  const selectTab = useCallback(
    (id: T, moveFocus = false) => {
      setActiveTab(id);
      const nextUrl = new URL(window.location.href);
      nextUrl.hash = id;
      window.history.pushState({ tab: id }, "", nextUrl);

      if (moveFocus) {
        window.requestAnimationFrame(() => {
          document.getElementById(`${prefix}-tab-${id}`)?.focus();
        });
      }
    },
    [prefix],
  );

  const onTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, current: T) => {
      const currentIndex = ids.indexOf(current);
      let nextIndex: number | null = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % ids.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + ids.length) % ids.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = ids.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        selectTab(ids[nextIndex], true);
      }
    },
    [ids, selectTab],
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }

      const shortcutIndex = Number(event.key) - 1;
      if (
        Number.isInteger(shortcutIndex) &&
        shortcutIndex >= 0 &&
        shortcutIndex < ids.length
      ) {
        event.preventDefault();
        selectTab(ids[shortcutIndex], true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [ids, selectTab]);

  return { activeTab, selectTab, onTabKeyDown };
}
