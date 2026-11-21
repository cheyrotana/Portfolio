// The opening animation — Persona's title card (IntroSplash.tsx) or Metro's train doors
// (MetroDecor.tsx) — and the hero wait on each other: the hero holds its entrance until the
// opening has cleared, so the visitor actually sees it.

export const INTRO_DONE_EVENT = "portfolio:intro-done";

const INTRO_THEMES = ["persona", "metro"];

/** The theme whose opening plays on this load (Persona or Metro), or null: none, or motion reduced. */
export function introTheme(): string | null {
  const theme = document.documentElement.getAttribute("data-theme") ?? "";
  if (!INTRO_THEMES.includes(theme)) return null;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? null : theme;
}

/** Whether an opening animation plays on this load. */
export function introWillPlay() {
  return introTheme() !== null;
}

export function introDone() {
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}
