import { AnimatePresence, motion } from "framer-motion";
import { Check, Command, Menu, Palette, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSoundOn } from "../hooks/interactive";
import { setSound } from "../sound";
import { THEMES, type ThemeId } from "../theme";
import { TrophyButton } from "./Achievements";

export const NAV_SECTIONS = [
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
] as const;

interface NavbarProps {
  activeSection: string;
  hidden: boolean;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onOpenPalette: () => void;
  trophiesOpen: boolean;
  onTrophiesChange: (open: boolean) => void;
}

function ThemeSwitcher({ theme, onThemeChange }: Pick<NavbarProps, "theme" | "onThemeChange">) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn btn-ghost !px-3 !py-2 text-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.name}. Change theme`}
      >
        <Palette size={16} />
        <span className="hidden sm:inline">{current.name}</span>
        <span className="flex -space-x-1">
          {current.swatches.map((c, i) => (
            <span key={i} className="w-3 h-3 rounded-full ring-1 ring-black/20" style={{ background: c }} />
          ))}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className="card absolute right-0 mt-3 w-64 p-2 z-50"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <p className="px-3 pt-2 pb-2 text-xs uppercase tracking-widest text-muted">Choose a theme</p>
            {THEMES.map((t) => (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={t.id === theme}
                onClick={() => { onThemeChange(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-left transition-colors ${
                  t.id === theme ? "bg-accent/15" : "hover:bg-surface-2"
                }`}
              >
                {/* Mini preview of the theme */}
                <span
                  className="relative w-11 h-8 rounded-md overflow-hidden ring-1 ring-black/20 flex-shrink-0"
                  style={{ background: t.swatches[0] }}
                >
                  <span className="absolute left-1.5 top-1.5 w-5 h-1 rounded-full" style={{ background: t.swatches[1] }} />
                  <span className="absolute left-1.5 top-3.5 w-3 h-1 rounded-full opacity-60" style={{ background: t.swatches[1] }} />
                  <span className="absolute right-1.5 bottom-1.5 w-3 h-3 rounded-full" style={{ background: t.swatches[2] }} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-fg">{t.name}</span>
                  <span className="block text-xs text-muted">{t.description}</span>
                </span>
                {t.id === theme && <Check size={16} className="text-accent" />}
              </button>
            ))}
            <p className="px-3 pt-2 pb-1 text-[11px] text-muted">
              Tip: press <kbd className="chip !px-1.5 !py-0 font-mono">T</kbd> anywhere to switch
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar({
  activeSection, hidden, theme, onThemeChange, onOpenPalette, trophiesOpen, onTrophiesChange,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const soundOn = useSoundOn();
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 px-4 sm:px-6 pt-3 sm:pt-4"
      initial={{ y: -80, opacity: 0 }}
      animate={hidden && !menuOpen ? { y: -90, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="card mx-auto max-w-6xl flex items-center justify-between gap-3 px-3 sm:px-4 py-2 !rounded-[calc(var(--radius)+6px)] backdrop-blur-md bg-surface/80">
        <a href="#home" className="heading text-lg sm:text-xl px-2 text-fg" aria-label="Back to top">
          <span className="only-editorial">Chey Rotana</span>
          <span className="only-pop">
            rotana<span className="text-accent">!</span>
          </span>
          <span className="only-persona">
            <span className="inline-block bg-accent text-white px-1.5 -rotate-6 mr-0.5">R</span>otana
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeSection === s.id ? "text-accent" : "text-muted hover:text-fg"
              }`}
            >
              {activeSection === s.id && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-accent/12"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{s.label}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 text-sm"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            data-cursor="Search"
          >
            <Command size={15} />
            <span className="hidden lg:inline font-mono text-xs">{isMac ? "⌘K" : "Ctrl K"}</span>
          </button>
          <TrophyButton open={trophiesOpen} onOpenChange={onTrophiesChange} />
          <button
            type="button"
            className="icon-btn hidden sm:inline-flex"
            onClick={() => setSound(!soundOn)}
            aria-label={soundOn ? "Turn sounds off" : "Turn sounds on"}
            aria-pressed={soundOn}
            data-cursor={soundOn ? "Mute" : "Sound"}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
          <button
            className="icon-btn lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="card lg:hidden mx-auto max-w-6xl mt-2 p-2 flex flex-col"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-[var(--radius-sm)] font-medium ${
                  activeSection === s.id ? "text-accent bg-accent/10" : "text-fg hover:bg-surface-2"
                }`}
              >
                {s.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
