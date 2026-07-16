"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getThemeColors } from "../data";
import { useSystemThemePreference } from "../hooks/useSystemThemePreference";
import type { ThemeColors, ThemeMode } from "../types";

interface ThemeContextValue {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const systemPrefersDark = useSystemThemePreference();

  const theme = getThemeColors(themeMode === "system" ? systemPrefersDark : themeMode === "dark");

  const value = useMemo<ThemeContextValue>(() => ({ theme, themeMode, setThemeMode }), [theme, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
