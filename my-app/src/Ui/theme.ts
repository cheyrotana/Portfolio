import { useCallback, useEffect, useState } from "react";

export type ThemeId = "persona" | "metro" | "pop";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  swatches: [string, string, string]; // background, surface/text, accent
}

export const THEMES: ThemeOption[] = [
  {
    id: "persona",
    name: "Persona",
    description: "Phantom-thief style",
    swatches: ["#0b0b0b", "#ffffff", "#e60012"],
  },
  {
    id: "metro",
    name: "Metro",
    description: "Transit-map clean",
    swatches: ["#f3f1ec", "#141414", "#f06a1f"],
  },
  {
    id: "pop",
    name: "Pop",
    description: "Bold & playful",
    swatches: ["#fff4dc", "#141414", "#ff5a36"],
  },
];

const STORAGE_KEY = "portfolio-theme";

const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

function currentTheme(): ThemeId {
  // index.html sets this before first paint (saved choice, else the system preference).
  const attr = document.documentElement.getAttribute("data-theme");
  return isThemeId(attr) ? attr : "persona";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode etc.): the theme still applies for this visit.
    }
  }, []);

  return { theme, setTheme };
}
