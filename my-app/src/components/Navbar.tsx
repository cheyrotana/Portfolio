import { AnimatePresence, motion } from "framer-motion";
import { NAV_SECTIONS } from "../data/sections";
import { Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import type { ThemeId } from "../lib/theme";
import { TrophyButton } from "./Achievements";
import { Ransom } from "../themes/persona/Ransom";
import { MetroNavClock, MetroTrain } from "../themes/metro/MetroDecor";
import { RetroNeedle } from "../themes/retro/RetroDecor";
import { useBgmOn } from "../hooks/interactive";

// Jagged burst behind the settings gear (Persona theme)
const GEAR_BURST = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 36;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");


interface NavbarProps {
  activeSection: string;
  hidden: boolean;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onOpenPalette: () => void;
  onOpenTerminal: () => void;
  onOpenSettings: () => void;
  trophiesOpen: boolean;
  onTrophiesChange: (open: boolean) => void;
}

export function Navbar({
  activeSection, hidden, theme, onOpenSettings, trophiesOpen, onTrophiesChange,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const musicOn = useBgmOn();
  const hide = hidden && !menuOpen;
  // Retro: hiding only tucks the bar away; its dial window stays at the top (CSS: .nav-bar[data-tucked])
  const tuck = theme === "retro";
  const stationName = NAV_SECTIONS.find((s) => s.id === activeSection)?.label ?? "Rotana Central";

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 px-4 sm:px-6 pt-3 sm:pt-4"
      initial={{ y: -80, opacity: 0 }}
      animate={hide && !tuck ? { y: -90, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <nav
        data-live={musicOn ? "" : undefined}
        data-tucked={hide && tuck ? "" : undefined}
        className="nav-bar card mx-auto max-w-6xl flex items-center justify-between gap-3 px-3 sm:px-4 py-2 !rounded-[calc(var(--radius)+6px)] backdrop-blur-md bg-surface/80">
        <a href="#home" className="heading text-lg sm:text-xl px-2 text-fg" aria-label="Back to top">
          <span className="only-metro">
            <span className="metro-logo">
              <span className="metro-logo-dot" aria-hidden="true">R</span>
              <span className="metro-logo-text">
                <span className="metro-logo-line">Rotana Line</span>
                <span className="metro-logo-now">
                  <span className="sr-only">Now at </span>
                  {stationName}
                </span>
              </span>
            </span>
          </span>
          <span className="only-retro">
            <span className="retro-logo">Chey Rotana</span>
          </span>
          <span className="only-persona">
            <Ransom text="Rotana" seed={0} />
          </span>
        </a>

        <div className="nav-links relative hidden lg:flex items-center gap-1">
          <span className="only-metro">
            <MetroTrain />
          </span>
          <span className="only-retro">
            <RetroNeedle />
          </span>
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`nav-link relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeSection === s.id ? "text-accent" : "text-muted hover:text-fg"
              }`}
            >
              {activeSection === s.id && (
                <motion.span
                  layoutId="nav-active"
                  className="nav-pill absolute inset-0 rounded-full bg-accent/12"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {s.label}
              </span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="only-metro">
            <MetroNavClock />
          </span>
          {/* The achievements panel still opens here (from the settings menu); its own button is hidden */}
          <TrophyButton open={trophiesOpen} onOpenChange={onTrophiesChange} bare />
          <button
            type="button"
            className="nav-settings"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
            data-cursor="Settings"
          >
            <svg className="nav-settings-burst" viewBox="-4 -4 108 108" aria-hidden="true">
              <polygon points={GEAR_BURST} />
            </svg>
            <Settings size={18} strokeWidth={2.4} className="nav-settings-gear" />
          </button>
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
            className="nav-menu card lg:hidden mx-auto max-w-6xl mt-2 p-2 flex flex-col"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setMenuOpen(false)}
                className={`nav-menu-link px-4 py-3 rounded-[var(--radius-sm)] font-medium ${
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
