import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloudSun, Command, Music, Palette, SquareTerminal, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { ACHIEVEMENTS } from "../achievements";
import { toggleBgm } from "../bgm";
import { useBgmOn, useSoundOn, useUnlocked } from "../hooks/interactive";
import { play, setSound } from "../sound";
import { THEMES, type ThemeId } from "../theme";
import { KeyHints } from "./KeyHints";

// Everything that used to sit in the navbar, in one pause-menu style overlay (same look as the sky &
// weather menu): tools, sound and theme.

interface Item {
  id: string;
  label: string;
  icon: ReactNode;
  hint?: string; // a shortcut or ON/OFF tag
  active?: boolean;
  run: () => void;
}

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onOpenPalette: () => void;
  onOpenTerminal: () => void;
  onOpenControls: () => void;
  onOpenTrophies: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function SettingsMenu(props: SettingsMenuProps) {
  const { open, onClose, theme, onThemeChange, onOpenPalette, onOpenTerminal, onOpenControls, onOpenTrophies } = props;
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const bgmOn = useBgmOn();
  const soundOn = useSoundOn();
  const unlocked = useUnlocked();

  // Tools close the menu and open themselves; toggles keep it open
  const then = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const tools: Item[] = [
    { id: "palette", label: "Commands", icon: <Command />, hint: isMac ? "⌘K" : "Ctrl K", run: then(onOpenPalette) },
    { id: "terminal", label: "Terminal", icon: <SquareTerminal />, hint: isMac ? "⌥T" : "Alt T", run: then(onOpenTerminal) },
    ...(theme === "persona"
      ? [{ id: "sky", label: "Sky & weather", icon: <CloudSun />, hint: isMac ? "⌥W" : "Alt W", run: then(onOpenControls) }]
      : []),
    {
      id: "trophies",
      label: "Achievements",
      icon: <Trophy />,
      hint: `${unlocked.length}/${ACHIEVEMENTS.length}`,
      run: then(onOpenTrophies),
    },
  ];

  const sound: Item[] = [
    { id: "music", label: "Music", icon: <Music />, hint: bgmOn ? "On" : "Off", active: bgmOn, run: () => toggleBgm() },
    {
      id: "sfx",
      label: "Effects",
      icon: soundOn ? <Volume2 /> : <VolumeX />,
      hint: soundOn ? "On" : "Off",
      active: soundOn,
      run: () => {
        setSound(!soundOn);
        if (!soundOn) play("tick", { force: true });
      },
    },
  ];

  const themes: Item[] = THEMES.map((t) => ({
    id: t.id,
    label: t.name,
    icon: <Palette />,
    active: t.id === theme,
    run: then(() => onThemeChange(t.id)),
  }));

  const columns: { title: string; items: Item[]; kind: "action" | "toggle" | "radio" }[] = [
    { title: "Tools", items: tools, kind: "action" },
    { title: "Sound", items: sound, kind: "toggle" },
    { title: "Theme", items: themes, kind: "radio" },
  ];

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>(".ctl-item")?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  // ↑↓ within a column, ←→ between columns, Esc closes
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const current = document.activeElement as HTMLElement | null;
    const col = Number(current?.dataset.col);
    if (Number.isNaN(col)) return;
    const q = (c: number) => [...(panelRef.current?.querySelectorAll<HTMLButtonElement>(`.ctl-item[data-col="${c}"]`) ?? [])];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const list = q(col);
      const at = list.indexOf(current as HTMLButtonElement);
      list[(at + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (col + (e.key === "ArrowRight" ? 1 : -1) + columns.length) % columns.length;
      const list = q(next);
      (list.find((b) => b.classList.contains("is-active")) ?? list[0])?.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ctl"
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            className="ctl-panel ctl-panel-wide"
            onKeyDown={onKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -120, rotate: -4 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 120, rotate: 3 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="ctl-slab" aria-hidden="true" />
            <span className="ctl-dots" aria-hidden="true" />

            <header className="ctl-head">
              <span className="ctl-kicker">Menu</span>
              <h2 className="ctl-title">Settings</h2>
              <button type="button" className="ctl-close icon-btn" onClick={onClose} aria-label="Close" data-cursor="Close">
                <X size={18} />
              </button>
            </header>

            <div className="ctl-cols ctl-cols-3">
              {columns.map((c, ci) => (
                <section key={c.title} className="ctl-col" aria-label={c.title}>
                  <h3 className="ctl-col-title">{c.title}</h3>
                  <ul className="ctl-list" role={c.kind === "radio" ? "radiogroup" : undefined} aria-label={c.title}>
                    {c.items.map((it, i) => (
                      <motion.li
                        key={it.id}
                        initial={reduceMotion ? false : { opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: reduceMotion ? 0 : 0.12 + ci * 0.08 + i * 0.05,
                          duration: 0.28,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <button
                          type="button"
                          data-col={ci}
                          role={c.kind === "radio" ? "radio" : undefined}
                          aria-checked={c.kind === "radio" ? !!it.active : undefined}
                          aria-pressed={c.kind === "toggle" ? !!it.active : undefined}
                          className={`ctl-item ${it.active && c.kind !== "toggle" ? "is-active" : ""} ${
                            c.kind === "toggle" && it.active ? "is-on" : ""
                          }`}
                          onClick={it.run}
                          data-cursor="Select"
                        >
                          <span className="ctl-item-icon" aria-hidden="true">
                            {it.icon}
                          </span>
                          <span className="ctl-item-label">{it.label}</span>
                          {it.hint && <span className="ctl-item-hint">{it.hint}</span>}
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <footer className="ctl-foot">
              <KeyHints />
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
