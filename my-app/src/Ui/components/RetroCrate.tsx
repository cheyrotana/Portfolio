// Retro theme, Work section: the projects are records in a crate. Flip through the sleeves; the pulled one
// stands up with its vinyl sliding out, and "See the full project" opens the project window.
import { AnimatePresence, motion } from "framer-motion";
import { useState, type KeyboardEvent } from "react";
import { CATEGORIES, type Project } from "../data/projects";
import { play } from "../sound";

// Sleeve art per project (falls back to the first one): background, ink colour, vinyl label colour.
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
    cover:
      "radial-gradient(circle at 70% 70%, #e8a91c 0 18%, #f4e6c8 18% 30%, #a8431b 30% 42%, #6f7a2c 42%)",
    ink: "#f4e6c8",
    label: "#6f7a2c",
  },
  unifinder: {
    cover:
      "repeating-conic-gradient(from 180deg at 50% 100%, #a8431b 0 10deg, #e8a91c 10deg 20deg)",
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

export function RetroCrate({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const [picked, setPicked] = useState(0);
  const n = projects.length;
  const k = n ? ((picked % n) + n) % n : 0; // the filter can shrink the list under the current pick
  const cur = projects[k];

  const go = (i: number) => {
    if (!n) return;
    play("tick");
    setPicked(((i % n) + n) % n);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(k + 1);
    else if (e.key === "ArrowLeft") go(k - 1);
    else return;
    e.preventDefault();
  };

  if (!cur) return null;

  return (
    <div className="retro-crate-wrap" onKeyDown={onKey}>
      <section className="retro-crate-col" aria-label="Projects">
        <p className="retro-cond retro-crate-count">
          Project {k + 1} of {n}
          <span className="retro-crate-hint"> · use ← → to browse</span>
        </p>
        <div className="retro-crate">
          {projects.map((p, i) => {
            const d = i - k;
            const art = COVERS[p.id] ?? COVERS.hrm;
            const style =
              d === 0
                ? { transform: "translateY(calc(var(--slv) * -0.5)) rotate(-2deg)", zIndex: 240, filter: "none" }
                : d > 0
                  ? {
                      transform: `translateY(${-d * 22}px) scale(${1 - d * 0.04})`,
                      zIndex: 200 - d,
                      filter: `brightness(${1 - d * 0.08})`,
                    }
                  : {
                      transform: `translateY(40px) rotateX(${62 + d * 4}deg) scale(.97)`,
                      zIndex: 260 + d,
                      filter: "brightness(.8)",
                    };
            return (
              <div key={p.id} className="retro-sleeve" style={style}>
                <div
                  className="retro-sleeve-vinyl"
                  aria-hidden="true"
                  style={{ transform: d === 0 ? "translateX(var(--vinyl-out)) rotate(30deg)" : "none" }}
                >
                  <span style={{ background: art.label }} />
                </div>
                <button
                  type="button"
                  className="retro-sleeve-cover"
                  style={{ background: art.cover, color: art.ink }}
                  onClick={() => (d === 0 ? onOpen(p.id) : go(i))}
                  aria-label={d === 0 ? `See the full project: ${p.title}` : `Show ${p.title}`}
                  data-cursor={d === 0 ? "Open" : "Show"}
                >
                  <span className="retro-sleeve-title">{p.title}</span>
                  {p.logo && <img src={p.logo} alt="" className="retro-sleeve-logo" />}
                  <span className="retro-sleeve-year">{p.year}</span>
                </button>
              </div>
            );
          })}
          <div className="retro-crate-box" aria-hidden="true">
            <span>Projects</span>
          </div>
        </div>
        <div className="retro-crate-ctl">
          <button type="button" className="btn btn-ghost" onClick={() => go(k - 1)}>
            ‹ Previous
          </button>
          <button type="button" className="btn btn-primary" onClick={() => go(k + 1)}>
            Next ›
          </button>
        </div>
      </section>

      <section className="retro-pulled-col" aria-label="Selected project">
        <div className="retro-tabs" role="tablist" aria-label="Choose a project">
          {projects.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === k}
              className={`retro-tab ${i === k ? "is-on" : ""}`}
              onClick={() => go(i)}
            >
              {p.title.replace(/ System| Connector/, "")}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.article
            key={cur.id}
            className="retro-pulled"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="retro-cond retro-pulled-kicker">
              {kindOf(cur)} · {cur.year}
            </p>
            <h3 className="retro-pulled-title">{cur.title}</h3>
            <p className="retro-pulled-client">
              {cur.client} · {cur.role}
            </p>
            <p className="retro-pulled-text">{cur.summary}</p>
            {cur.stat && (
              <p className="retro-pulled-stat">
                {cur.stat.value} {cur.stat.label}
              </p>
            )}
            <p className="retro-pulled-tech">
              {cur.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </p>
            <button type="button" className="retro-pulled-play" onClick={() => onOpen(cur.id)}>
              See the full project →
            </button>
          </motion.article>
        </AnimatePresence>
      </section>
    </div>
  );
}
