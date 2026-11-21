import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, projects, type Category } from "../data/projects";
import { track } from "../lib/achievements";
import { LAUNCH_APP_EVENT, OPEN_PROJECT_EVENT, SHOW_PROJECT_EVENT } from "../lib/events";
import { play } from "../lib/sound";
import { APPS, appOf } from "../data/apps";
import { ProjectPhone } from "../components/ProjectPhone";
import { P5Slab } from "../themes/persona/PersonaDecor";
import { P5Clouds } from "../components/Weather";
import { ProjectModal } from "../components/ProjectModal";
import { SectionHeader } from "../components/Reveal";
import { RetroWork } from "../themes/retro/RetroWork";
import { useThemeAttr } from "../hooks/interactive";

function ProjectsSection() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const retro = useThemeAttr() === "retro"; // Retro shows the projects as tracks at a listening station
  const highlightTimer = useRef<number | undefined>(undefined);

  // Launching an app on the phone; launching all of them unlocks an achievement.
  const appIdRef = useRef<string | null>(null);
  useEffect(() => {
    appIdRef.current = appId;
  }, [appId]);
  const launch = useCallback((id: string) => {
    play("pop");
    setAppId(id);
    track("project-apps", id, APPS.length, "jackpot");
  }, []);
  const goHome = useCallback(() => {
    play("tick");
    setAppId(null);
  }, []);

  // Reading three different case studies unlocks an achievement.
  useEffect(() => {
    if (openId) track("case-studies", openId, 3, "detective");
  }, [openId]);

  // Other sections (e.g. the Journey route) can ask to show a project: launch it on the phone,
  // scroll the phone into view and make it pulse for a moment.
  useEffect(() => {
    const onShow = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setFilter("all");
      launch(appOf(id));
      setHighlight(true);
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlight(false), 2800);
      requestAnimationFrame(() =>
        document.getElementById("project-phone")?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    };
    // "Launch a random app" from the command palette or terminal
    const onRandom = () => {
      const others = APPS.filter((a) => a.id !== appIdRef.current);
      launch(others[Math.floor(Math.random() * others.length)].id);
      requestAnimationFrame(() =>
        document.getElementById("project-phone")?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    };
    // …or open its case study straight away.
    const onOpen = (e: Event) => {
      setFilter("all");
      setOpenId((e as CustomEvent<string>).detail);
    };
    window.addEventListener(SHOW_PROJECT_EVENT, onShow);
    window.addEventListener(OPEN_PROJECT_EVENT, onOpen);
    window.addEventListener(LAUNCH_APP_EVENT, onRandom);
    return () => {
      window.removeEventListener(LAUNCH_APP_EVENT, onRandom);
      window.removeEventListener(SHOW_PROJECT_EVENT, onShow);
      window.removeEventListener(OPEN_PROJECT_EVENT, onOpen);
      window.clearTimeout(highlightTimer.current);
    };
  }, [launch]);

  const visible = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.categories.includes(filter))),
    [filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    for (const p of projects) for (const cat of p.categories) c[cat] = (c[cat] ?? 0) + 1;
    return c;
  }, []);

  // The modal steps through whatever the current filter shows.
  const openIndex = visible.findIndex((p) => p.id === openId);
  const step = useCallback(
    (dir: 1 | -1) => {
      if (openIndex < 0) return;
      setOpenId(visible[(openIndex + dir + visible.length) % visible.length].id);
    },
    [openIndex, visible],
  );
  const close = useCallback(() => setOpenId(null), []);

  // The phone shows every project, so show them all if the current filter hides the one opened.
  const openFromPhone = useCallback(
    (id: string) => {
      if (!visible.some((p) => p.id === id)) setFilter("all");
      setOpenId(id);
    },
    [visible],
  );
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  return (
    <section id="work" className="relative py-24 sm:py-32 bg-bg-alt overflow-hidden">
      <P5Slab side="right" />
      <P5Clouds count={10} seed={5} />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          index="04"
          eyebrow="Selected work"
          title="Projects"
          intro={
            retro
              ? "Government platforms in real use, plus the team projects that got me here. Pick a track to hear its story, then open the full project."
              : "Government platforms in real use, plus the team projects that got me here. Each one is an app on the phone below: launch it to see the real screens, filter by type, and open the case study for the full story."
          }
        />

        {/* Filters (Retro: Side A / Side B on the station instead) */}
        {!retro && (
        <LayoutGroup>
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8" role="tablist" aria-label="Filter projects">
            {CATEGORIES.filter((c) => counts[c.id]).map((c) => {
              const selected = filter === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setFilter(c.id);
                    // close the running app if this filter hides it
                    const running = APPS.find((a) => a.id === appId)?.project;
                    if (running && c.id !== "all" && !running.categories.includes(c.id)) setAppId(null);
                  }}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors border border-line [[data-theme=persona]_&]:rounded-none [[data-theme=persona]_&]:-skew-x-12 ${
                    selected ? "text-accent-fg" : "text-muted hover:text-fg bg-surface"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-full bg-accent [[data-theme=persona]_&]:rounded-none [[data-theme=persona]_&]:shadow-[3px_3px_0_#fff]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">
                    {c.label}
                    <span className={`ml-2 font-mono text-xs ${selected ? "opacity-80" : "opacity-60"}`}>
                      {counts[c.id]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        )}

        {/* The projects as apps on a phone, with the story beside it (Retro: a listening station) */}
        {retro ? (
          <RetroWork projects={projects} onOpen={openFromPhone} />
        ) : (
          <ProjectPhone
            appId={appId}
            visible={visible}
            highlighted={highlight}
            onLaunch={launch}
            onHome={goHome}
            onOpen={openFromPhone}
          />
        )}
      </div>

      <AnimatePresence>
        {openIndex >= 0 && (
          <ProjectModal
            project={visible[openIndex]}
            position={`${openIndex + 1} / ${visible.length}`}
            onClose={close}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export default ProjectsSection;
