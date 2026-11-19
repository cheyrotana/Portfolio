import { NAV_SECTIONS } from "./data/sections";

// Metro theme: where the reader is along the line. The navbar train and the 3D city's train both
// read this, so they are always at the same place: between stop `i` and stop `i + 1`, `f` of the way.

export const RIDE_STOPS = [{ id: "home", label: "Rotana Central" }, ...NAV_SECTIONS];

export function rideProgress(): { i: number; f: number } {
  const probeOffset = window.innerHeight * 0.35;
  const maxProbe = document.documentElement.scrollHeight - window.innerHeight + probeOffset;
  const probe = window.scrollY + probeOffset;
  const tops = RIDE_STOPS.map(({ id }) => {
    const el = document.getElementById(id);
    const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
    return Math.min(top, maxProbe);
  });
  let i = 0;
  while (i < tops.length - 1 && probe >= tops[i + 1]) i++;
  const next = Math.min(i + 1, tops.length - 1);
  const span = tops[next] - tops[i];
  const f = next === i || span <= 0 ? 0 : Math.min(1, Math.max(0, (probe - tops[i]) / span));
  return { i, f };
}

/** The train waits at a section's station while it is read, and drives in the last stretch before the next. */
export function departure(f: number) {
  const x = Math.min(1, Math.max(0, (f - 0.45) / 0.55));
  return x * x * (3 - 2 * x);
}
