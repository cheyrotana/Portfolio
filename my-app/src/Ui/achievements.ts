// Little achievements visitors unlock as they explore. Saved in their browser only.
import { play } from "./sound";

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  hint: string; // shown while locked
  description: string; // shown once unlocked
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "explorer", emoji: "🧭", title: "Explorer", hint: "Visit every section", description: "Scrolled through every section of the site." },
  { id: "pilot", emoji: "✈️", title: "Frequent flyer", hint: "Finish the Journey", description: "Travelled the whole Journey, start to finish." },
  // id kept from the old slot machine so earlier unlocks still count
  { id: "jackpot", emoji: "📲", title: "App hopper", hint: "Launch every app on the project phone", description: "Launched every project on the phone." },
  { id: "detective", emoji: "🔍", title: "Detective", hint: "Open 3 case studies", description: "Read three project case studies." },
  { id: "fashionista", emoji: "🎨", title: "Fashionista", hint: "Try every theme", description: "Tried on every theme." },
  { id: "speedrunner", emoji: "⚡", title: "Power user", hint: "Use the command palette", description: "Ran a command from the palette (Ctrl/⌘ K)." },
  { id: "hacker", emoji: "💻", title: "Hacker", hint: "Run a command in the terminal", description: "Ran a command in the terminal." },
  { id: "tester", emoji: "📱", title: "QA tester", hint: "Swipe through an app's screenshots", description: "Swiped to the last screenshot of an app on the project phone." },
  // id kept from the old playground achievement so earlier unlocks still count
  { id: "juggler", emoji: "🧰", title: "Well-rounded", hint: "Open every group of skills", description: "Looked through every group in the skill menu." },
  { id: "penpal", emoji: "💌", title: "Pen pal", hint: "Send me a message", description: "Sent a message through the chat." },
  { id: "konami", emoji: "🕹️", title: "Old school", hint: "↑ ↑ ↓ ↓ ← → ← → B A", description: "Entered the Konami code." },
];

const KEY = "portfolio-achievements";
const SETS_KEY = "portfolio-achievement-progress";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: progress still counts for this visit
  }
};

let unlocked: string[] = read<string[]>(KEY, []).filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
const progress: Record<string, string[]> = read<Record<string, string[]>>(SETS_KEY, {});

const listeners = new Set<() => void>();
const unlockListeners = new Set<(a: Achievement, all: boolean) => void>();

/** Snapshot for useSyncExternalStore — a new array only when something changes. */
export const getUnlocked = () => unlocked;

export function subscribeAchievements(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called once for every newly unlocked achievement (used for the toasts). */
export function onUnlock(listener: (a: Achievement, completedAll: boolean) => void) {
  unlockListeners.add(listener);
  return () => {
    unlockListeners.delete(listener);
  };
}

export function unlock(id: string) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === id);
  if (!achievement || unlocked.includes(id)) return;
  unlocked = [...unlocked, id];
  write(KEY, unlocked);
  play("unlock");
  const all = unlocked.length === ACHIEVEMENTS.length;
  listeners.forEach((l) => l());
  unlockListeners.forEach((l) => l(achievement, all));
}

/** Counts distinct values (e.g. themes tried) and unlocks `id` once `needed` are collected. */
export function track(key: string, value: string, needed: number, id: string) {
  const values = progress[key] ?? [];
  if (!values.includes(value)) {
    progress[key] = [...values, value];
    write(SETS_KEY, progress);
  }
  if ((progress[key]?.length ?? 0) >= needed) unlock(id);
}

export function resetAchievements() {
  unlocked = [];
  for (const k of Object.keys(progress)) delete progress[k];
  write(KEY, unlocked);
  write(SETS_KEY, progress);
  listeners.forEach((l) => l());
}
