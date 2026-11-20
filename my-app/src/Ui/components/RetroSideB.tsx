// Retro theme, Journey: Side B of the record. The section pins while you scroll through it. Behind it the
// room's camera rides low over the record, following the needle (RetroRoom, via roomBus.sideB), and the
// groove it's playing glows. On the right the track that's playing shows big, sliding in like a track
// change; on the left a slim track list jumps to any stop. Styles: .room-sideb* in src/retro-room.css.
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight, FastForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { unlock } from "../achievements";
import { journey } from "../data/profile";
import { showProject } from "../events";
import { setSideB } from "../retroRoomBus";
import { play } from "../sound";

const STEP_VH = 55; // scroll length per track
const KIND = { study: "Study", project: "Project", work: "Work", next: "Next" } as const;

export function RetroSideB() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [here, setHere] = useState(0);
  const n = journey.length;

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setSideB(v > 0 && v < 1 ? v : -1);
    const i = Math.min(n - 1, Math.floor(v * n));
    setHere((prev) => {
      if (prev !== i) play("tick");
      return i;
    });
    if (v > 0.97) unlock("pilot");
  });
  useEffect(() => () => setSideB(-1), []);

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const room = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (room * (i + 0.5)) / n, behavior: reduce ? "auto" : "smooth" });
  };

  const cur = journey[here];

  return (
    <section
      id="journey"
      ref={ref}
      className="room-sideb relative"
      style={{ height: `calc(100vh + ${n * STEP_VH}vh)` }}
      aria-label="Journey"
    >
      <div className="room-sideb-stage">
        {/* left: the sleeve's back, a slim track list */}
        <div className="room-sheet room-sideb-sheet">
          <span className="eyebrow relative">
            <span className="retro-eyebrow-code" aria-hidden="true">
              02
            </span>
            <span>Journey</span>
          </span>
          <h2 className="heading room-sideb-title">Side B</h2>
          <p className="room-sideb-sub">The journey so far. Keep scrolling and the needle plays it.</p>

          <ol className="room-tracks" aria-label="Stops">
            {journey.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === here ? "step" : undefined}
                  data-past={i < here || undefined}
                >
                  <span className="room-track-no">B{i + 1}</span>
                  <span className="room-track-name">{s.title}</span>
                  <span className="room-track-date">{s.date}</span>
                </button>
              </li>
            ))}
          </ol>
          <a href="#skills" data-jump className="room-skip">
            Skip side B <FastForward size={14} aria-hidden="true" />
          </a>
        </div>

        {/* right: the track that's playing, big */}
        <div className="room-sideb-feature" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {cur && (
              <motion.article
                key={cur.title}
                className="room-feature"
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40, rotate: 1.5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                <p className="room-feature-top">
                  <span className="room-feature-no">B{here + 1}</span>
                  <span className="room-cond">
                    {KIND[cur.kind]} · {cur.date}
                    <br />
                    Track {here + 1} of {n}
                  </span>
                </p>
                <h3 className="room-feature-title">{cur.title}</h3>
                <p className="room-feature-org">{cur.org}</p>
                <p className="room-feature-text">{cur.text}</p>
                {cur.projectId && (
                  <button type="button" className="room-link is-light" onClick={() => showProject(cur.projectId!)}>
                    See the project <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
                {cur.kind === "next" && (
                  <a href="#contact" className="btn btn-primary mt-4" data-jump>
                    Let's talk <ArrowRight size={14} aria-hidden="true" />
                  </a>
                )}
              </motion.article>
            )}
          </AnimatePresence>
          {/* phones: the list is hidden, so step through here */}
          <div className="room-feature-dots" role="group" aria-label="Stops">
            {journey.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === here ? "step" : undefined}
                aria-label={`B${i + 1}: ${s.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
