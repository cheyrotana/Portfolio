// Retro theme, Work section (design P1): a listening station. The track list on the left splits the projects
// into Side A (client work) and Side B (team and study projects); the picked one drops onto the turntable,
// with its sleeve beside it and liner notes below: what it is, the highlights, a few screens, the tools and
// links. The record spins while the music plays. ← → change track. Styles: .retro-ls* in src/retro.css.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ExternalLink, Github, SkipBack, SkipForward } from "lucide-react";
import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { CATEGORIES, type Project } from "../data/projects";
import { play } from "../sound";

// Sleeve art per project (falls back to HRM's): background, ink colour, vinyl label colour.
const COVERS: Record<string, { cover: string; ink: string; label: string }> = {
  hrm: {
    cover: "linear-gradient(#a8431b 0 54%, #e07a2e 54% 69%, #e8a91c 69% 84%, #f4e6c8 84%)",
    ink: "#f4e6c8",
    label: "#e8a91c",
  },
  "face-scan": {
    cover: "repeating-linear-gradient(90deg, #1d1828 0 18px, #2c2540 18px 36px)",
    ink: "#e8a91c",
    label: "#a8431b",
  },
  phumiyerng: {
    cover: "radial-gradient(circle at 70% 70%, #e8a91c 0 18%, #f4e6c8 18% 30%, #a8431b 30% 42%, #6f7a2c 42%)",
    ink: "#f4e6c8",
    label: "#6f7a2c",
  },
  unifinder: {
    cover: "repeating-conic-gradient(from 180deg at 50% 100%, #a8431b 0 10deg, #e8a91c 10deg 20deg)",
    ink: "#3a2314",
    label: "#a8431b",
  },
  modula: {
    cover: "repeating-linear-gradient(45deg, #6f7a2c 0 26px, #e8a91c 26px 52px)",
    ink: "#3a2314",
    label: "#e07a2e",
  },
  "frost-guard": {
    cover: "linear-gradient(160deg, #2f5d7c 0 50%, #9cc3d5 50%)",
    ink: "#f4e6c8",
    label: "#9cc3d5",
  },
};

const kindOf = (p: Project) =>
  p.categories
    .filter((c) => c !== "client")
    .map((c) => CATEGORIES.find((x) => x.id === c)?.label)
    .join(" & ");

export function RetroListening({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const reduceMotion = useReducedMotion();
  // Side A first, then Side B: the order the tracks are played in
  const sideA = projects.filter((p) => p.categories.includes("client"));
  const sideB = projects.filter((p) => !p.categories.includes("client"));
  const order = [...sideA, ...sideB];
  const [pickedId, setPickedId] = useState(order[0]?.id);
  const k = Math.max(0, order.findIndex((p) => p.id === pickedId));
  const cur = order[k];
  if (!cur) return null;
  const art = COVERS[cur.id] ?? COVERS.hrm;

  const go = (i: number) => {
    const next = order[(i + order.length) % order.length];
    if (next.id === cur.id) return;
    play("tick");
    setPickedId(next.id);
  };

  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(k + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(k - 1);
    else return;
    e.preventDefault();
  };

  const side = (label: string, list: Project[], letter: string) =>
    list.length > 0 && (
      <>
        <p className="retro-cond retro-ls-side">{label}</p>
        <ol className="retro-ls-tracks">
          {list.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className="retro-ls-track"
                aria-pressed={p.id === cur.id}
                onClick={() => go(order.indexOf(p))}
                data-cursor="Play"
              >
                <span className="retro-ls-no">
                  {letter}
                  {i + 1}
                </span>
                <span className="retro-ls-name">{p.title}</span>
                {p.status ? <span className="retro-ls-status">{p.status}</span> : <span className="retro-ls-year">{p.year}</span>}
              </button>
            </li>
          ))}
        </ol>
      </>
    );

  return (
    <div className="retro-ls" onKeyDown={onKey}>
      {/* The track list */}
      <nav className="retro-ls-list" aria-label="Projects">
        {side("Side A · Client work", sideA, "A")}
        {side("Side B · Team & study projects", sideB, "B")}
        <p className="retro-ls-hint">
          {order.length} tracks · use ← → to change track
        </p>
      </nav>

      {/* The station */}
      <div className="retro-ls-station" style={{ "--label": art.label } as CSSProperties}>
        <div className="retro-ls-deck">
          <div className="retro-ls-platter" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={cur.id}
                className="retro-ls-record"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 1.06 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
                transition={{ duration: reduceMotion ? 0.12 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="retro-ls-label">{cur.logo && <img src={cur.logo} alt="" />}</span>
              </motion.span>
            </AnimatePresence>
            <span className="retro-ls-arm" />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={cur.id}
              type="button"
              className="retro-ls-sleeve"
              style={{ background: art.cover, color: art.ink }}
              onClick={() => onOpen(cur.id)}
              aria-label={`See the full project: ${cur.title}`}
              data-cursor="Open"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -6, y: 16 }}
              animate={{ opacity: 1, rotate: -2, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.3 }}
            >
              <span className="retro-cond retro-ls-now">
                Now playing · {k < sideA.length ? `A${k + 1}` : `B${k - sideA.length + 1}`}
              </span>
              <span className="retro-ls-sleeve-title">{cur.title}</span>
              {cur.stat && (
                <span className="retro-ls-sticker">
                  <b>{cur.stat.value}</b>
                  {cur.stat.label}
                </span>
              )}
            </motion.button>
          </AnimatePresence>
        </div>

        {/* Liner notes */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={cur.id}
            className="retro-ls-notes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.22 }}
          >
            <p className="retro-cond retro-ls-kicker">
              {cur.role} · {cur.year} · {kindOf(cur) || "Client work"}
              {cur.status ? ` · ${cur.status}` : ""}
            </p>
            <h3 className="retro-ls-title">{cur.title}</h3>
            <p className="retro-ls-client">{cur.client}</p>
            <p className="retro-ls-desc">{cur.description}</p>

            <div className="retro-ls-cols">
              <div>
                <p className="retro-cond retro-ls-sub">Highlights</p>
                <ul className="retro-ls-highlights">
                  {cur.highlights.slice(0, 3).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              {cur.images.length > 0 && (
                <div>
                  <p className="retro-cond retro-ls-sub">Screens</p>
                  <div className="retro-ls-shots">
                    {cur.images.slice(0, 3).map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => onOpen(cur.id)}
                        aria-label={`${cur.title}, screen ${i + 1}: open the project`}
                        data-cursor="Open"
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="retro-ls-tech">
              {cur.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </p>

            <div className="retro-ls-keys">
              <button type="button" className="retro-tdeck-key" onClick={() => go(k - 1)} aria-label="Previous track">
                <SkipBack size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-primary" onClick={() => onOpen(cur.id)}>
                See the full project
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              {cur.githubUrl && (
                <a className="btn" href={cur.githubUrl} target="_blank" rel="noreferrer">
                  <Github size={18} aria-hidden="true" />
                  Code
                </a>
              )}
              {cur.demoUrl && (
                <a className="btn" href={cur.demoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} aria-hidden="true" />
                  Live
                </a>
              )}
              <button type="button" className="retro-tdeck-key" onClick={() => go(k + 1)} aria-label="Next track">
                <SkipForward size={18} aria-hidden="true" />
              </button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}
