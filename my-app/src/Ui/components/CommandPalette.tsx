import { AnimatePresence, motion } from "framer-motion";
import {
  Car, CloudSun, Moon, Sun, FolderOpen, Hash, Link2, Music, Palette, Plane, Search, Smartphone, SquareTerminal, TrainFront, Trophy, Volume2, VolumeX, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { unlock } from "../achievements";
import { socials } from "../data/profile";
import { projects } from "../data/projects";
import { goTo, openControls, openProject, setJourneyVehicle, launchRandomApp } from "../events";
import { setBgm } from "../bgm";
import { setSky, setWeather, WEATHER_KINDS } from "../weather";
import { useBgmOn, useSoundOn } from "../hooks/interactive";
import { play, setSound } from "../sound";
import { THEMES, type ThemeId } from "../theme";
import { NAV_SECTIONS } from "../data/sections";

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: LucideIcon;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onOpenTerminal: () => void;
  onOpenTrophies: () => void;
}

export function CommandPalette({ open, onClose, theme, onThemeChange, onOpenTerminal, onOpenTrophies }: CommandPaletteProps) {
  const soundOn = useSoundOn();
  const bgmOn = useBgmOn();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      { id: "go-home", group: "Go to", label: "Home", icon: Hash, run: () => goTo("home") },
      ...NAV_SECTIONS.map((s) => ({
        id: `go-${s.id}`,
        group: "Go to",
        label: s.label,
        icon: Hash,
        run: () => goTo(s.id),
      })),
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        group: "Projects",
        label: p.title,
        hint: p.role,
        keywords: `${p.client} ${p.tech.join(" ")} case study`,
        icon: FolderOpen,
        run: () => openProject(p.id),
      })),
      ...THEMES.map((t) => ({
        id: `theme-${t.id}`,
        group: "Theme",
        label: `Switch to ${t.name}`,
        hint: t.id === theme ? "current" : t.description,
        keywords: "theme colour color dark light",
        icon: Palette,
        run: () => onThemeChange(t.id),
      })),
      { id: "vehicle-plane", group: "Journey", label: "Fly the paper plane", keywords: "vehicle", icon: Plane, run: () => { setJourneyVehicle("plane"); goTo("journey"); } },
      { id: "vehicle-car", group: "Journey", label: "Drive the car", keywords: "vehicle", icon: Car, run: () => { setJourneyVehicle("car"); goTo("journey"); } },
      { id: "vehicle-train", group: "Journey", label: "Ride the train", keywords: "vehicle metro", icon: TrainFront, run: () => { setJourneyVehicle("train"); goTo("journey"); } },
      { id: "controls", group: "Fun", label: "Sky & weather controls", keywords: "weather sky day night rain storm menu controller", icon: CloudSun, run: openControls },
      { id: "spin", group: "Fun", label: "Launch a random project app", keywords: "random project phone app lucky spin", icon: Smartphone, run: launchRandomApp },
      { id: "terminal", group: "Fun", label: "Open the terminal", hint: "`", keywords: "console shell command line", icon: SquareTerminal, run: onOpenTerminal },
      { id: "trophies", group: "Fun", label: "Show achievements", keywords: "trophy badges", icon: Trophy, run: onOpenTrophies },
      {
        id: "sound",
        group: "Fun",
        label: soundOn ? "Turn sounds off" : "Turn sounds on",
        keywords: "audio mute volume",
        icon: soundOn ? VolumeX : Volume2,
        run: () => setSound(!soundOn),
      },
      {
        id: "bgm",
        group: "Fun",
        label: bgmOn ? "Stop the background music" : "Play the background music",
        keywords: "bgm music song audio jazz",
        icon: Music,
        run: () => setBgm(!bgmOn),
      },
      { id: "sky-day", group: "Weather", label: "Sky: Day", keywords: "sun day light time", icon: Sun, run: () => setSky("day") },
      { id: "sky-night", group: "Weather", label: "Sky: Night", keywords: "moon night dark time", icon: Moon, run: () => setSky("night") },
      { id: "sky-live", group: "Weather", label: "Sky: Follow Phnom Penh time", keywords: "sun moon day night time", icon: CloudSun, run: () => setSky(null) },
      { id: "weather-live", group: "Weather", label: "Live Phnom Penh weather", keywords: "weather forecast", icon: CloudSun, run: () => setWeather(null) },
      ...WEATHER_KINDS.map((k) => ({
        id: `weather-${k.id}`,
        group: "Weather",
        label: `Weather: ${k.label}`,
        keywords: "weather rain storm sun cloud",
        icon: CloudSun,
        run: () => setWeather(k.id),
      })),
      ...socials.map((s) => ({
        id: `link-${s.name}`,
        group: "Links",
        label: `Open ${s.name}`,
        icon: Link2,
        run: () => window.open(s.url, "_blank", "noopener,noreferrer"),
      })),
    ],
    [theme, onThemeChange, onOpenTerminal, onOpenTrophies, soundOn, bgmOn],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    const words = q.split(/\s+/);
    return commands.filter((c) => {
      const text = `${c.group} ${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [commands, query]);

  // Fresh search every time it opens.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setQuery("");
      setIndex(0);
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Keep the highlighted row visible.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    play("click");
    onClose();
    unlock("speedrunner");
    // Let the palette close before the command scrolls or opens something.
    window.setTimeout(c.run, 60);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[index]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="card relative w-full max-w-xl overflow-hidden"
            initial={{ y: -16, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div className="flex items-center gap-3 px-4 border-b border-line">
              <Search size={18} className="text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search sections, projects, themes…"
                className="flex-1 bg-transparent py-4 text-fg placeholder:text-muted outline-none"
                aria-label="Search commands"
                aria-controls="palette-results"
              />
              <kbd className="chip !py-0 font-mono">Esc</kbd>
            </div>

            <ul id="palette-results" ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches. Try "projects" or "theme".</li>}
              {results.map((c, i) => {
                const header = c.group !== lastGroup ? c.group : null;
                lastGroup = c.group;
                const Icon = c.icon;
                return (
                  <li key={c.id} role="none">
                    {header && <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-widest text-muted">{header}</p>}
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === index}
                      data-index={i}
                      onMouseMove={() => setIndex(i)}
                      onClick={() => run(c)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-left ${
                        i === index ? "bg-accent text-accent-fg" : "text-fg"
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      <span className="flex-1 truncate text-sm font-medium">{c.label}</span>
                      {c.hint && (
                        <span className={`text-xs truncate max-w-[40%] ${i === index ? "opacity-80" : "text-muted"}`}>{c.hint}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-line text-[11px] text-muted">
              <span>↑↓ to move</span>
              <span>↵ to run</span>
              <span className="ml-auto">
                Press <kbd className="font-mono">`</kbd> for the terminal
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
