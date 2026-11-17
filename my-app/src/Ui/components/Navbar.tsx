import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import type { ThemeId } from "../theme";
import { TrophyButton } from "./Achievements";
import { Ransom } from "./Ransom";

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
  onOpenTerminal: () => void;
  onOpenSettings: () => void;
  trophiesOpen: boolean;
  onTrophiesChange: (open: boolean) => void;
}

export function Navbar({
  activeSection, hidden, onOpenSettings, trophiesOpen, onTrophiesChange,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 px-4 sm:px-6 pt-3 sm:pt-4"
      initial={{ y: -80, opacity: 0 }}
      animate={hidden && !menuOpen ? { y: -90, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="nav-bar card mx-auto max-w-6xl flex items-center justify-between gap-3 px-3 sm:px-4 py-2 !rounded-[calc(var(--radius)+6px)] backdrop-blur-md bg-surface/80">
        <a href="#home" className="heading text-lg sm:text-xl px-2 text-fg" aria-label="Back to top">
          <span className="only-editorial">Chey Rotana</span>
          <span className="only-pop">
            rotana<span className="text-accent">!</span>
          </span>
          <span className="only-persona">
            <Ransom text="Rotana" seed={0} />
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
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
              <span className="relative">{s.label}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* The achievements panel still opens here (from the settings menu); its own button is hidden */}
          <TrophyButton open={trophiesOpen} onOpenChange={onTrophiesChange} bare />
          <button
            type="button"
            className="nav-settings btn btn-ghost !px-3 !py-2 text-sm"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
            data-cursor="Settings"
          >
            <Settings size={17} />
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
