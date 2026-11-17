import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import AboutSection from "./components/AboutSection";
import ContactSection from "./components/ContactSection";
import HeroSection from "./components/HeroSection";
import JourneySection from "./components/JourneySection";
import { ClickBursts, CustomCursor, ScrollProgress } from "./components/Interactive";
import { AchievementToasts } from "./components/Achievements";
import { CommandPalette } from "./components/CommandPalette";
import { Terminal } from "./components/Terminal";
import { track, unlock } from "./achievements";
import { useInteractiveSurfaces, useKonami } from "./hooks/interactive";
import { OPEN_TERMINAL_EVENT } from "./events";
import { play } from "./sound";
import { NAV_SECTIONS, Navbar } from "./components/Navbar";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection from "./components/SkillsSection";
import { THEMES, useTheme, type ThemeId } from "./theme";

const WIPE_SECONDS = 0.8;

// A slash in the new theme's colours sweeps across the screen; the theme swaps while it covers everything.
function ThemeWipe({ accent, edge, onDone }: { accent: string; edge: string; onDone: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -top-[20%] -bottom-[20%] left-[-25%] w-[150%]"
        style={{ background: accent, skewX: -18 }}
        initial={{ x: "-115%" }}
        animate={{ x: "115%" }}
        transition={{ duration: WIPE_SECONDS, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={onDone}
      >
        <span className="absolute inset-y-0 right-0 w-[4%]" style={{ background: edge }} />
        <span className="absolute inset-y-0 right-[6%] w-[1.2%]" style={{ background: edge }} />
        <span className="absolute inset-y-0 left-0 w-[3%]" style={{ background: edge }} />
      </motion.div>
    </motion.div>
  );
}

function App() {
  const { theme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [wipe, setWipe] = useState<{ key: number; accent: string; edge: string } | null>(null);
  const swapTimer = useRef<number | undefined>(undefined);

  const changeTheme = useCallback(
    (next: ThemeId) => {
      if (next === theme) return;
      const option = THEMES.find((t) => t.id === next);
      if (reduceMotion || !option) {
        setTheme(next);
        return;
      }
      window.clearTimeout(swapTimer.current);
      play("whoosh");
      setWipe({ key: Date.now(), accent: option.swatches[2], edge: option.swatches[1] });
      // Swap halfway, while the slash covers the whole screen.
      swapTimer.current = window.setTimeout(() => setTheme(next), (WIPE_SECONDS * 1000) / 2);
    },
    [theme, reduceMotion, setTheme],
  );

  useEffect(() => () => window.clearTimeout(swapTimer.current), []);

  useInteractiveSurfaces();

  // Overlays: command palette (Ctrl/⌘ K), terminal (` key) and the achievements panel.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [trophiesOpen, setTrophiesOpen] = useState(false);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const closeTerminal = useCallback(() => setTerminalOpen(false), []);
  const openTerminal = useCallback(() => setTerminalOpen(true), []);
  const openTrophies = useCallback(() => setTrophiesOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setTerminalOpen(false);
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "`" && !(e.target as Element | null)?.closest("input, textarea, select, [contenteditable=true]")) {
        e.preventDefault();
        setPaletteOpen(false);
        setTerminalOpen((o) => !o);
      }
    };
    const onOpenTerminal = () => setTerminalOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_TERMINAL_EVENT, onOpenTerminal);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_TERMINAL_EVENT, onOpenTerminal);
    };
  }, []);

  // The Konami code: unlock the secret achievement and give the page a barrel roll.
  const onKonami = useCallback(() => {
    unlock("konami");
    if (!reduceMotion) {
      document.body.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
        duration: 1100,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      });
    }
  }, [reduceMotion]);
  useKonami(onKonami);

  // Trying every theme unlocks an achievement.
  useEffect(() => {
    track("themes", theme, THEMES.length, "fashionista");
  }, [theme]);

  // Press "T" anywhere (outside form fields) to cycle through the themes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t" || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as Element | null)?.closest("input, textarea, select, [contenteditable=true]")) return;
      const i = THEMES.findIndex((t) => t.id === theme);
      changeTheme(THEMES[(i + 1) % THEMES.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [theme, changeTheme]);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Hide the navbar while scrolling down, show it again when scrolling up.
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 200);
  });

  // Highlight the nav link of the section currently in the middle of the screen.
  useEffect(() => {
    const ids = ["home", ...NAV_SECTIONS.map((s) => s.id)];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Visiting every section unlocks an achievement.
  useEffect(() => {
    track("sections", activeSection, NAV_SECTIONS.length + 1, "explorer");
  }, [activeSection]);

  return (
    <>
      <ScrollProgress />
      <CustomCursor />
      <ClickBursts />
      <Navbar
        activeSection={activeSection}
        hidden={hidden && !trophiesOpen}
        theme={theme}
        onThemeChange={changeTheme}
        onOpenPalette={() => setPaletteOpen(true)}
        trophiesOpen={trophiesOpen}
        onTrophiesChange={setTrophiesOpen}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        theme={theme}
        onThemeChange={changeTheme}
        onOpenTerminal={openTerminal}
        onOpenTrophies={openTrophies}
      />
      <Terminal open={terminalOpen} onClose={closeTerminal} onThemeChange={changeTheme} />
      <AchievementToasts />
      <AnimatePresence>
        {wipe && <ThemeWipe key={wipe.key} accent={wipe.accent} edge={wipe.edge} onDone={() => setWipe(null)} />}
      </AnimatePresence>
      <main>
        <HeroSection />
        <AboutSection />
        <JourneySection />
        <SkillsSection />
        <ProjectsSection />
      </main>
      <ContactSection />
    </>
  );
}

export default App;
