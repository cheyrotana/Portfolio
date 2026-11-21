// Retro theme, Work: what both Work layouts (the hi-fi turntable and the screens-first stage) share.
import type { IconType } from "react-icons";
import { TbArrowsSplit, TbDatabase, TbRoute, TbStack2 } from "react-icons/tb";
import { skillGroups } from "./data/profile";
import { CATEGORIES, type Project } from "./data/projects";

// The colour of each record's label (falls back to HRM's)
export const LABELS: Record<string, string> = {
  hrm: "#d4a03a", // the fallback
  "hrm-mlmupc": "#d4a03a",
  "hrm-nis": "#3a7ca5",
  "face-scan": "#9a4a2a",
  phumiyerng: "#2e7d32",
  unifinder: "#9a4a2a",
  modula: "#c97a3e",
  "frost-guard": "#9bb7c4",
};

export const kindOf = (p: Project) =>
  p.categories
    .filter((c) => c !== "client")
    .map((c) => CATEGORIES.find((x) => x.id === c)?.label)
    .join(" & ");

// Each tech's logo: the tools from Skills, plus icons for the libraries and patterns that have no brand logo
export const TECH_ICONS: Record<string, IconType> = {
  ...Object.fromEntries(skillGroups.flatMap((g) => g.skills.map((s) => [s.name, s.icon]))),
  MVVM: TbStack2,
  go_router: TbRoute,
  Riverpod: TbArrowsSplit,
  Drift: TbDatabase,
};

// A project's app icon (HRM's comes from its first build)
export const iconOf = (p: Project) => p.logo ?? p.apps?.[0]?.logo;

// Side A (client work) first, then Side B (team and study projects): the order the tracks play in
export function sides(projects: Project[]) {
  const sideA = projects.filter((p) => p.categories.includes("client"));
  const sideB = projects.filter((p) => !p.categories.includes("client"));
  const order = [...sideA, ...sideB];
  const trackNo = (p: Project) => {
    const i = order.indexOf(p);
    return i < sideA.length ? `A${i + 1}` : `B${i - sideA.length + 1}`;
  };
  return { sideA, sideB, order, trackNo };
}
