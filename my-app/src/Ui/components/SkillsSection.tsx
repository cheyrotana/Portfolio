import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useThemeAttr } from "../hooks/interactive";
import { MetroSkillMap } from "./MetroMap";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { track } from "../achievements";
import { skillGroups, type Skill } from "../data/profile";
import { projects } from "../data/projects";
import { openProject } from "../events";
import { play } from "../sound";
import { P5Slab } from "./PersonaDecor";
import { P5Clouds } from "./Weather";
import { Ransom } from "./Ransom";
import { Reveal, SectionHeader } from "./Reveal";
import { RetroTapes } from "./RetroTapes";

// Where each tool was actually used, straight from the project data (no made-up skill levels).
const usedIn = (skill: Skill) => projects.filter((p) => p.tech.includes(skill.name));
const groupProjects = skillGroups.map((g) => new Set(g.skills.flatMap((s) => usedIn(s).map((p) => p.id))).size);

const allTools = skillGroups.flatMap((g) => g.skills);
const allProjects = new Set(allTools.flatMap((s) => usedIn(s).map((p) => p.id))).size;

const meta = (tools: number, projectCount: number) =>
  `${tools} tools${projectCount > 0 ? ` · ${projectCount} project${projectCount > 1 ? "s" : ""}` : ""}`;

// Menu entries: "All skills" first (the default), then each group.
const ENTRIES = [
  { title: "All skills", blurb: "Everything I work with, at a glance. Pick a group for the details.", meta: meta(allTools.length, allProjects) },
  ...skillGroups.map((g, i) => ({ title: g.title, blurb: g.blurb, meta: meta(g.skills.length, groupProjects[i]) })),
];

// One tool, with the projects it was used in (each opens that project's case study).
function SkillTile({ skill, index, reduceMotion }: { skill: Skill; index: number; reduceMotion: boolean | null }) {
  const { name, icon: Icon, color } = skill;
  const used = usedIn(skill);
  return (
    <motion.li
      className="skill-tile"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.05, duration: 0.3 }}
    >
      <span className="skill-tile-icon" aria-hidden="true">
        <Icon size={26} style={{ color: color ?? "currentColor" }} />
      </span>
      <span className="min-w-0">
        <span className="skill-tile-name block font-semibold text-fg">{name}</span>
        {used.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {used.map((p) => (
              <button
                key={p.id}
                type="button"
                className="skill-used chip"
                onClick={() => openProject(p.id)}
                data-cursor="Open"
                aria-label={`${name} was used in ${p.title}: open the case study`}
              >
                {p.title}
                <ArrowUpRight size={12} aria-hidden="true" />
              </button>
            ))}
          </span>
        )}
      </span>
    </motion.li>
  );
}

// Persona-style skill menu: "All skills" plus each group on the left (click or arrow keys to switch),
// and the selected view on the right. Every theme; Persona dresses it up.
function SkillMenu() {
  const [active, setActive] = useState(0); // 0 = all skills, 1… = a group
  const reduceMotion = useReducedMotion();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const entry = ENTRIES[active];
  const group = active > 0 ? skillGroups[active - 1] : null;

  const select = (i: number, focus = false) => {
    if (i > 0) track("skill-groups", skillGroups[i - 1].title, skillGroups.length, "juggler");
    if (i === active) return;
    setActive(i);
    play("tick");
    if (focus) tabsRef.current[i]?.focus();
    tabsRef.current[i]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const last = ENTRIES.length - 1;
    const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
    const back = e.key === "ArrowUp" || e.key === "ArrowLeft";
    const next =
      forward ? (active === last ? 0 : active + 1)
      : back ? (active === 0 ? last : active - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
  };

  return (
    <div className="skill-menu grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-6 lg:gap-10 items-start">
      {/* The menu */}
      <div className="skill-menu-list" role="tablist" aria-label="Skill groups" onKeyDown={onKeyDown}>
        {ENTRIES.map((e, i) => (
          <button
            key={e.title}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`skill-tab-${i}`}
            aria-selected={i === active}
            aria-controls="skill-panel"
            tabIndex={i === active ? 0 : -1}
            className={`skill-menu-item ${i === active ? "is-active" : ""} ${i === 0 ? "is-all" : ""}`}
            onClick={() => select(i)}
            data-cursor="Select"
          >
            <span className="skill-menu-index">{i === 0 ? "★" : String(i).padStart(2, "0")}</span>
            <span className="skill-menu-title">{e.title}</span>
            <span className="skill-menu-meta">{e.meta}</span>
          </button>
        ))}
      </div>

      {/* The selected view */}
      <div className="skill-panel-wrap relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={entry.title}
            id="skill-panel"
            role="tabpanel"
            aria-labelledby={`skill-tab-${active}`}
            className="skill-panel card p-6 sm:p-8"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40, clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, clipPath: "polygon(0 0, 110% 0, 100% 100%, 0 100%)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="only-persona">
              <span className="skill-panel-slash" aria-hidden="true" />
            </span>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="skill-panel-title heading text-3xl sm:text-4xl text-fg">
                <span className="not-persona">{entry.title}</span>
                <span className="only-persona">
                  <Ransom text={entry.title} seed={active + 3} />
                </span>
              </h3>
              <span className="skill-panel-count font-mono text-xs text-muted">
                {active === 0 ? `${allTools.length} tools` : `${String(active).padStart(2, "0")} / ${String(skillGroups.length).padStart(2, "0")}`}
              </span>
            </div>
            <p className="mt-3 text-muted">{entry.blurb}</p>

            {group ? (
              <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                {group.skills.map((skill, i) => (
                  <SkillTile key={skill.name} skill={skill} index={i} reduceMotion={reduceMotion} />
                ))}
              </ul>
            ) : (
              // All skills: every group on its own line; the group name opens that group
              <div className="mt-6 grid gap-4">
                {skillGroups.map((g, gi) => (
                  <motion.div
                    key={g.title}
                    className="skill-all-row"
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.1 + gi * 0.05, duration: 0.3 }}
                  >
                    <button type="button" className="skill-all-group" onClick={() => select(gi + 1)} data-cursor="Open">
                      {g.title}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                    <ul className="flex flex-wrap gap-2">
                      {g.skills.map(({ name, icon: Icon, color }) => (
                        <li key={name} className="skill-all-tool">
                          <Icon size={18} style={{ color: color ?? "currentColor" }} aria-hidden="true" />
                          {name}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SkillsSection() {
  const all = skillGroups.flatMap((g) => g.skills);
  const themeAttr = useThemeAttr();
  const metro = themeAttr === "metro"; // Metro shows the skills as a network map, Retro as cassette tapes

  return (
    <section id="skills" className="relative py-24 sm:py-32 overflow-hidden">
      <P5Slab side="right" />
      <P5Clouds count={5} seed={4} />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          index="03"
          eyebrow="Skills"
          title="Tools I build with"
          intro="From the phone in an officer's hand to the database behind it — these are the tools I reach for."
        />

        <Reveal>{metro ? <MetroSkillMap /> : themeAttr === "retro" ? <RetroTapes /> : <SkillMenu />}</Reveal>
      </div>

      {/* Scrolling strip of every tool (Retro has its own, in the receiver) */}
      {themeAttr !== "retro" && (
      <div className="skills-strip mt-16 border-y border-line py-5 overflow-hidden [[data-theme=pop]_&]:bg-accent-2 [[data-theme=pop]_&]:border-y-[2.5px] [[data-theme=pop]_&]:-rotate-1 [[data-theme=persona]_&]:bg-accent [[data-theme=persona]_&]:border-y-[3px] [[data-theme=persona]_&]:-rotate-2 [[data-theme=persona]_&]:scale-105">
        <div className="animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10 pr-10 flex-shrink-0" aria-hidden={copy === 1}>
              {[...all, ...all].map(({ name, icon: Icon }, i) => (
                <span
                  key={`${name}-${i}`}
                  className="flex items-center gap-3 heading text-2xl sm:text-3xl text-muted whitespace-nowrap [[data-theme=pop]_&]:text-white [[data-theme=persona]_&]:text-white"
                >
                  <Icon size={26} />
                  {name}
                  <span className="text-accent [[data-theme=pop]_&]:text-white [[data-theme=persona]_&]:text-black">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}

export default SkillsSection;
