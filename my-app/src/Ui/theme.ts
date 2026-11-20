import { useCallback, useEffect, useState } from "react";

export type ThemeId = "persona" | "metro" | "retro" | "pop";

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
    id: "retro",
    name: "Retro",
    description: "70s jazz on vinyl",
    swatches: ["#f4e6c8", "#3a2314", "#a8431b"],
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
  // index.html sets this before first paint (the saved choice, else Retro).
  const attr = document.documentElement.getAttribute("data-theme");
  return isThemeId(attr) ? attr : "retro";
}

// The browser-tab icon and colour for each theme (index.html sets them before first paint too)
const ICONS: Record<ThemeId, { href: string; type: string }> = {
  persona: { href: "/favicon-32.png", type: "image/png" },
  metro: { href: "/favicon-metro.svg", type: "image/svg+xml" },
  retro: { href: "/favicon-retro.svg", type: "image/svg+xml" },
  pop: { href: "/favicon-pop.svg", type: "image/svg+xml" },
};

function applyBrowserChrome(theme: ThemeId) {
  const icon = document.getElementById("theme-icon") as HTMLLinkElement | null;
  if (icon) {
    icon.href = ICONS[theme].href;
    icon.type = ICONS[theme].type;
  }
  const color = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (color) color.content = THEMES.find((t) => t.id === theme)?.swatches[2] ?? color.content;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    applyBrowserChrome(theme);
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
