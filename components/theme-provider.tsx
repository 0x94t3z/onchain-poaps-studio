"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appKit } from "@/lib/wagmi";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function renderTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector<HTMLLinkElement>("#theme-favicon")
    ?.setAttribute("href", theme === "dark" ? "/icon-dark.svg" : "/icon.svg");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#11120f" : "#f4f2e9");
  appKit?.setThemeMode(theme);
}

function applyTheme(theme: Theme) {
  renderTheme(theme);
  try {
    window.localStorage.setItem("onchain-poaps-theme", theme);
  } catch {
    // The visual preference still works when storage is unavailable.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = currentTheme();
    setThemeState(initialTheme);
    appKit?.setThemeMode(initialTheme);

    const syncTheme = (event: StorageEvent) => {
      if (
        event.key !== "onchain-poaps-theme" ||
        (event.newValue !== "light" && event.newValue !== "dark")
      )
        return;
      renderTheme(event.newValue);
      setThemeState(event.newValue);
    };

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme(nextTheme) {
        applyTheme(nextTheme);
        setThemeState(nextTheme);
      },
      toggleTheme() {
        const nextTheme = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        setThemeState(nextTheme);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
