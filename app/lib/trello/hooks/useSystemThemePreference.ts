"use client";

import { useEffect, useState } from "react";

export function useSystemThemePreference(): boolean {
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return systemPrefersDark;
}
