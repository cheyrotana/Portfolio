// Retro theme, Skills (design S2 with a deck): the five skill groups are cassettes on a shelf. Pick one and it
// drops into the tape deck; the card under the deck lists each tool with the projects it was used in (each
// opens that project). The deck's middle key plays/pauses the music (the reels turn while it plays), the outer
// keys change tape. Arrow keys work on the shelf. Styles: .retro-tapes / .retro-tdeck* / .retro-jcard in retro.css.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { track } from "../achievements";
import { setBgm } from "../bgm";
import { skillGroups, type Skill } from "../data/profile";
import { projects } from "../data/projects";
import { openProject } from "../events";
import { useBgmOn } from "../hooks/interactive";
import { play } from "../sound";
import { RetroEq } from "./RetroDecor";

// One label colour per tape (shelf spine and the label in the deck)
const TAPE_COLORS = ["#e8a91c", "#f4e6c8", "#e07a2e", "#9cc3d5", "#ead6ad"];

// Where each tool was actually used, from the project data (no made-up skill levels).
const usedIn = (skill: Skill) => projects.filter((p) => p.tech.includes(skill.name));

export function RetroTapes() {
  const [active, setActive] = useState(0);
  const playing = useBgmOn();
  const reduceMotion = useReducedMotion();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const n = skillGroups.length;
  const group = skillGroups[active];

  const select = (i: number, focus = false) => {
    const next = (i + n) % n;
    track("skill-groups", skillGroups[next].title, n, "juggler");
    if (next === active) return;
    play("tick");
    setActive(next);
    if (focus) tabsRef.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const forward = e.key === "ArrowDown" || e.key === "ArrowRight";
    const back = e.key === "ArrowUp" || e.key === "ArrowLeft";
    const next = forward ? active + 1 : back ? active - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (next === null) return;
    e.preventDefault();
    select(next, true);
  };

  return (
    <div className="retro-tapes">
      {/* The shelf */}
      <div className="retro-tape-shelf" role="tablist" aria-label="Skill groups" onKeyDown={onKeyDown}>
        {skillGroups.map((g, i) => (
          <button
            key={g.title}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tape-tab-${i}`}
            aria-selected={i === active}
            aria-controls="tape-panel"
            tabIndex={i === active ? 0 : -1}
            className="retro-tape"
            style={{ "--tape": TAPE_COLORS[i % TAPE_COLORS.length] } as CSSProperties}
            onClick={() => select(i)}
            data-cursor="Load"
          >
            <span className="retro-tape-no">{String(i + 1).padStart(2, "0")}</span>
            <span className="retro-tape-name">{g.title}</span>
            <span className="retro-tape-count">{g.skills.length} tools</span>
          </button>
        ))}
      </div>

      <div className="retro-tapes-right">
        {/* The deck */}
        <div className="retro-tdeck">
          <div className="retro-tdeck-head">
            <span className="retro-cond">CR-5 · Cassette deck</span>
            <RetroEq className="retro-tdeck-eq" />
          </div>
          <div className="retro-tdeck-well">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={group.title}
                className="retro-cassette"
                style={{ "--tape": TAPE_COLORS[active % TAPE_COLORS.length] } as CSSProperties}
                initial={reduceMotion ? { opacity: 0 } : { y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { y: 60, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="retro-cassette-label">
                  <span className="retro-cassette-title">{group.title}</span>
                  <span className="retro-cassette-side retro-cond">Side A · {String(active + 1).padStart(2, "0")}</span>
                  <span className="retro-cassette-blurb">{group.blurb}</span>
                </span>
                <span className="retro-cassette-window" aria-hidden="true">
                  <span className="retro-reel" />
                  <span className="retro-reel" />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="retro-tdeck-keys">
            <button type="button" className="retro-tdeck-key" onClick={() => select(active - 1)} aria-label="Previous tape">
              <SkipBack size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="retro-tdeck-key is-play"
              onClick={() => {
                play(playing ? "tick" : "pop");
                setBgm(!playing);
              }}
              aria-pressed={playing}
            >
              {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              {playing ? "Pause music" : "Play music"}
            </button>
            <button type="button" className="retro-tdeck-key" onClick={() => select(active + 1)} aria-label="Next tape">
              <SkipForward size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* The J-card: the tools on this tape and where they were used */}
        <div className="retro-jcard" id="tape-panel" role="tabpanel" aria-labelledby={`tape-tab-${active}`}>
          <p className="retro-cond retro-jcard-head">Track list · where I used them</p>
          <ul>
            {group.skills.map((skill) => {
              const { name, icon: Icon, color } = skill;
              const used = usedIn(skill);
              return (
                <li key={name}>
                  <span className="retro-jcard-tool">
                    <Icon size={18} style={{ color: color ?? "currentColor" }} aria-hidden="true" />
                    {name}
                  </span>
                  <span className="retro-jcard-used">
                    {used.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="retro-jcard-chip"
                        onClick={() => openProject(p.id)}
                        data-cursor="Open"
                        aria-label={`${name} was used in ${p.title}: open the project`}
                      >
                        {p.title}
                        <ArrowUpRight size={12} aria-hidden="true" />
                      </button>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
