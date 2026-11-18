import { useReducedMotion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getUnlocked, subscribeAchievements } from "../achievements";
import { isSoundOn, subscribeSound } from "../sound";
import { isBgmOn, subscribeBgm } from "../bgm";
import { getSky, getSkyPick, getWeather, getWeatherPick, subscribeWeather } from "../weather";

// True on devices with a precise pointer (mouse / trackpad) — hover effects make no sense on touch.
export function useFinePointer() {
  const [fine, setFine] = useState(() => window.matchMedia?.("(pointer: fine)").matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.("(pointer: fine)");
    if (!mq) return;
    const onChange = () => setFine(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return fine;
}

// ── Tilt, spotlight and magnetic buttons ────────────────────────────────────
// One delegated pointer listener drives every .tilt card (3D tilt + glow under the
// cursor) and every .btn / .icon-btn (leans towards the cursor).

export function useInteractiveSurfaces() {
  const fine = useFinePointer();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!fine || reduceMotion) return;
    let tiltEl: HTMLElement | null = null;
    let magEl: HTMLElement | null = null;

    const resetTilt = (el: HTMLElement) => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    const onMove = (e: PointerEvent) => {
      const t = e.target as Element | null;

      const tilt = t?.closest<HTMLElement>(".tilt") ?? null;
      if (tiltEl && tiltEl !== tilt) resetTilt(tiltEl);
      tiltEl = tilt;
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        tilt.style.setProperty("--rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
        tilt.style.setProperty("--ry", `${((px - 0.5) * 8).toFixed(2)}deg`);
        tilt.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        tilt.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      }

      const mag = t?.closest<HTMLElement>(".btn, .icon-btn") ?? null;
      if (magEl && magEl !== mag) magEl.style.translate = "";
      magEl = mag;
      if (mag && !(mag as HTMLButtonElement).disabled) {
        const r = mag.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        mag.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      }
    };

    const onLeave = () => {
      if (tiltEl) resetTilt(tiltEl);
      if (magEl) magEl.style.translate = "";
      tiltEl = magEl = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, [fine, reduceMotion]);
}

/** Whether UI sounds are on (changes when toggled anywhere). */
export function useSoundOn() {
  return useSyncExternalStore(subscribeSound, isSoundOn);
}

/** Whether the background music is on (changes when toggled anywhere). */
export function useBgmOn() {
  return useSyncExternalStore(subscribeBgm, isBgmOn);
}

/** Current Phnom Penh weather (or the visitor's pick); null until it has loaded. */
export function useWeather() {
  return useSyncExternalStore(subscribeWeather, getWeather);
}

/** "day" or "night" in Phnom Penh (or the visitor's pick). */
export function useSky() {
  return useSyncExternalStore(subscribeWeather, getSky);
}

/** The visitor's own weather and sky picks (null while following Phnom Penh live). */
export function useWeatherPick() {
  return useSyncExternalStore(subscribeWeather, getWeatherPick);
}

export function useSkyPick() {
  return useSyncExternalStore(subscribeWeather, getSkyPick);
}

// The theme lives on <html data-theme>; this follows it so a component can render per theme.
function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const getThemeAttr = () => document.documentElement.getAttribute("data-theme") ?? "persona";

/** The current theme id, live. */
export function useThemeAttr() {
  return useSyncExternalStore(subscribeTheme, getThemeAttr);
}

/** Ids of the achievements unlocked so far. */
export function useUnlocked() {
  return useSyncExternalStore(subscribeAchievements, getUnlocked);
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/** Calls `onCode` when the visitor types the Konami code. */
export function useKonami(onCode: () => void) {
  useEffect(() => {
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === KONAMI[pos] ? pos + 1 : key === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) {
        pos = 0;
        onCode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCode]);
}
