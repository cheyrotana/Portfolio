import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, projects, type Category, type Project } from "../data/projects";
import { track } from "../achievements";
import { OPEN_PROJECT_EVENT, SHOW_PROJECT_EVENT } from "../events";
import { ImageSlideshow } from "./Gallery";
import { LuckyDraw } from "./SlotMachine";
import { ProjectModal } from "./ProjectModal";
import { SectionHeader } from "./Reveal";

type CardSize = "big" | "wide" | "normal";

// Bento layout when every project is shown (3-column grid). Fills 4 rows exactly:
// HRM takes a 2×2 block, Face Scan and PhumiYerng stack beside it, then UniFinder + Modula, then Frost Guard.
const BENTO: Record<string, { span: string; size: CardSize }> = {
  hrm: { span: "lg:col-span-2 lg:row-span-2", size: "big" },
  "face-scan": { span: "", size: "normal" },
  phumiyerng: { span: "", size: "normal" },
  unifinder: { span: "lg:col-span-2", size: "wide" },
  modula: { span: "", size: "normal" },
  "frost-guard": { span: "lg:col-span-3", size: "wide" },
};

// On large screens the media stretches to fill the row, so cards sharing a row line up.
const MEDIA_SIZE: Record<CardSize, string> = {
  big: "aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[340px]",
  wide: "aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[280px]",
  normal: "aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[220px]",
};

function ProjectCard({
  project, size, onOpen, highlighted,
}: { project: Project; size: CardSize; onOpen: () => void; highlighted: boolean }) {
  const [hover, setHover] = useState(false);
  const big = size === "big";
  const shownTech = project.tech.slice(0, size === "normal" ? 3 : 5);
  const extra = project.tech.length - shownTech.length;

  return (
    <article
      className={`card card-hover tilt group h-full flex flex-col overflow-hidden cursor-pointer ${highlighted ? "project-highlight" : ""}`}
      data-cursor="Open"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      tabIndex={0}
      role="button"
      aria-label={`Open ${project.title} case study`}
    >
      <div className={`relative border-b border-line [[data-theme=pop]_&]:border-b-[2.5px] ${MEDIA_SIZE[size]}`}>
        <ImageSlideshow images={project.images} alt={project.title} onImageClick={onOpen} autoPlay="hover" active={hover} />
        {project.stat && (
          <span className="absolute left-3 top-3 z-10 card !shadow-none px-3 py-1.5 text-xs font-semibold text-fg">
            <span className="text-accent">{project.stat.value}</span> {project.stat.label}
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted font-mono">
          <span>{project.year} · {project.client}</span>
          {project.status && <span className="text-accent">{project.status}</span>}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`heading text-fg ${big ? "text-3xl sm:text-4xl" : "text-2xl sm:text-[1.7rem]"}`}>{project.title}</h3>
            <p className="mt-1 text-sm font-medium text-accent">{project.role}</p>
          </div>
          <span className="icon-btn !w-9 !h-9 flex-shrink-0 transition-transform group-hover:rotate-45 group-hover:!text-accent">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <p className={`text-muted leading-relaxed ${big ? "text-base" : "text-sm"}`}>{project.summary}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {shownTech.map((t) => <span key={t} className="chip">{t}</span>)}
          {extra > 0 && <span className="chip">+{extra}</span>}
        </div>
      </div>
    </article>
  );
}

function ProjectsSection() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);

  // Reading three different case studies unlocks an achievement.
  useEffect(() => {
    if (openId) track("case-studies", openId, 3, "detective");
  }, [openId]);

  // Other sections (e.g. the Journey route) can ask to show a project: show everything,
  // scroll its card into view and make it pulse for a moment.
  useEffect(() => {
    const onShow = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setFilter("all");
      setHighlightId(id);
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2800);
      // Wait a frame so the card exists if the filter was hiding it.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById(`project-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        ),
      );
    };
    // …or open its case study straight away.
    const onOpen = (e: Event) => {
      setFilter("all");
      setOpenId((e as CustomEvent<string>).detail);
    };
    window.addEventListener(SHOW_PROJECT_EVENT, onShow);
    window.addEventListener(OPEN_PROJECT_EVENT, onOpen);
    return () => {
      window.removeEventListener(SHOW_PROJECT_EVENT, onShow);
      window.removeEventListener(OPEN_PROJECT_EVENT, onOpen);
      window.clearTimeout(highlightTimer.current);
    };
  }, []);

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

  // The machine draws from every project, so show them all if the current filter hides the winner.
  const openFromDraw = useCallback(
    (id: string) => {
      if (!visible.some((p) => p.id === id)) setFilter("all");
      setOpenId(id);
    },
    [visible],
  );
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  return (
    <section id="work" className="relative py-24 sm:py-32 bg-bg-alt">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          index="04"
          eyebrow="Selected work"
          title="Projects"
          intro="Government platforms in real use, plus the team projects that got me here. Filter by type, hover to preview, and open any project for the full story."
        />

        {/* Slot machine: lands on a random project and opens it */}
        <LuckyDraw projects={projects} onOpen={openFromDraw} paused={openId !== null} />

        {/* Filters */}
        <LayoutGroup>
          <div className="flex flex-wrap gap-2 mb-8 sm:mb-10" role="tablist" aria-label="Filter projects">
            {CATEGORIES.filter((c) => counts[c.id]).map((c) => {
              const selected = filter === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(c.id)}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-colors border border-line [[data-theme=pop]_&]:border-2 [[data-theme=persona]_&]:rounded-none [[data-theme=persona]_&]:-skew-x-12 ${
                    selected ? "text-accent-fg" : "text-muted hover:text-fg bg-surface"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-full bg-accent [[data-theme=pop]_&]:shadow-[3px_3px_0_var(--line)] [[data-theme=persona]_&]:rounded-none [[data-theme=persona]_&]:shadow-[3px_3px_0_#fff]"
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

        {/* Grid */}
        <motion.div layout className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:grid-flow-dense">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => {
              // Filtered views use a plain, even grid; the bento layout is only for "All".
              const bento = filter === "all" ? BENTO[p.id] : undefined;
              return (
                <motion.div
                  key={p.id}
                  id={`project-${p.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={bento?.span ?? ""}
                >
                  <ProjectCard
                    project={p}
                    size={bento?.size ?? "normal"}
                    onOpen={() => setOpenId(p.id)}
                    highlighted={highlightId === p.id}
                  />
                </motion.div>
              );
            })}

          </AnimatePresence>
        </motion.div>
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
