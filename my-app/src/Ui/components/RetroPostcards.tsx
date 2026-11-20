// Retro theme, Journey (design J2): postcards from the road. The section is pinned while you scroll through
// it; the stops are postcards on a corkboard, and scrolling slides the front card aside and brings the next
// one forward (each card rests for a moment in front). A dashed route draws itself along the board as you
// go, and the dots at the bottom jump to any stop. Projects get a "See the project" stamp.
// Styles: .rp-* in src/retro.css.
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { FastForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { unlock } from "../achievements";
import { journey, type JourneyStop } from "../data/profile";
import { showProject } from "../events";
import { play } from "../sound";
import { ScrambleText } from "./Reveal";

const N = journey.length;
const KIND: Record<JourneyStop["kind"], string> = {
  study: "Study",
  project: "Team project",
  work: "Work",
  next: "Next",
};
const TILT = [-3, 2, -1.5, 3, -2, 1.5, -2.5, 2]; // each card's own slight angle on the board

// The big word on the picture side of each card
const placeOf = (s: JourneyStop) =>
  s.kind === "study" ? "CADT" : s.kind === "next" ? "What's next?" : s.title.replace(/ \(.*\)$/, "");

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
// scroll progress → card position, with a short rest on each card: 0 … N-1
const dwell = (p: number) => {
  const f = clamp01(p) * (N - 1);
  const i = Math.min(N - 2, Math.floor(f));
  return i + smooth(clamp01((f - i - 0.18) / 0.64));
};

export function RetroPostcards() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const routeRef = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(0);
  const skipped = useRef(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const springy = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const progress = reduceMotion ? scrollYProgress : springy;

  const place = useCallback((p: number) => {
    const f = dwell(p);
    const wide = window.innerWidth >= 768;
    const step = wide ? Math.min(window.innerWidth * 0.36, 460) : window.innerWidth * 0.86;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const off = i - f;
      const a = Math.abs(off);
      const x = off * step;
      const y = Math.min(a, 2) * 28;
      const rot = TILT[i % TILT.length] + off * 7;
      const s = 1 - Math.min(a, 2) * 0.2;
      card.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      card.style.opacity = String(clamp01(2.2 - a));
      card.style.zIndex = String(100 - Math.round(a * 10));
      card.style.visibility = a > 2.3 ? "hidden" : "visible";
      card.inert = a > 0.5; // only the front card can be clicked or tabbed to
    });
    routeRef.current?.style.setProperty("stroke-dashoffset", String(1 - clamp01(p)));
    const now = Math.round(f);
    setActive((prev) => (prev === now ? prev : now));
  }, []);

  useMotionValueEvent(progress, "change", place);
  useEffect(() => {
    const id = requestAnimationFrame(() => place(progress.get())); // first layout once mounted
    const onResize = () => place(progress.get());
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, [place, progress]);

  // reaching the last card on foot (not by skipping) counts for the achievement
  useEffect(() => {
    if (active === N - 1 && !skipped.current) unlock("pilot");
    if (active > 0) play("tick");
  }, [active]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.98) skipped.current = false;
  });

  // jump to a stop: scroll to where its card rests in front
  const goTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const span = section.offsetHeight - window.innerHeight;
    const p = i / (N - 1); // card i rests in front here
    window.scrollTo({ top: section.offsetTop + p * span, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="rp-section relative"
      style={{ height: `calc(100vh + ${(N - 1) * 70}vh)` }}
      aria-label="Journey"
    >
      <div className="rp-sticky sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="journey-head relative mx-auto w-full max-w-6xl px-5 sm:px-8 pt-24 sm:pt-28">
          <span className="eyebrow relative">
            <span className="retro-eyebrow-code" aria-hidden="true">
              02
            </span>
            <span>Journey</span>
          </span>
          <div className="relative mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <h2 className="heading text-4xl sm:text-5xl lg:text-6xl text-fg">
                <ScrambleText text="The journey so far" />
              </h2>
              <p className="rp-sub">Postcards from the road, oldest first. Keep scrolling to flip to the next one.</p>
            </div>
          </div>
        </div>

        {/* the board: a dashed route that draws itself, and the cards */}
        <div className="rp-board relative flex-1">
          <svg className="rp-route" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <mask id="rp-route-mask">
                <path
                  ref={routeRef}
                  d="M20 230 C 160 60, 300 280, 460 150 S 760 30, 900 170 S 1120 260, 1180 90"
                  pathLength={1}
                  className="rp-route-reveal"
                />
              </mask>
            </defs>
            <path
              d="M20 230 C 160 60, 300 280, 460 150 S 760 30, 900 170 S 1120 260, 1180 90"
              className="rp-route-line"
              mask="url(#rp-route-mask)"
            />
          </svg>

          {journey.map((s, i) => (
            <article
              key={s.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="rp-card"
              data-kind={s.kind}
              aria-label={`${s.date}: ${s.title}`}
            >
              <span className="rp-pin" aria-hidden="true" />
              <div className="rp-pic" aria-hidden="true">
                <span className="rp-pic-sun" />
                <span className="rp-pic-hills" />
                <span className="rp-greet">Greetings from</span>
                <span className="rp-place">{placeOf(s)}</span>
              </div>
              <div className="rp-back">
                <span className="rp-stamp" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="rp-postmark">{s.date}</span>
                <p className="rp-kicker">
                  Stop {String(i + 1).padStart(2, "0")} · {KIND[s.kind]}
                </p>
                <h3 className="rp-title">{s.title}</h3>
                <p className="rp-org">{s.org}</p>
                <p className="rp-text">{s.text}</p>
                {s.projectId && (
                  <button
                    type="button"
                    className="rp-link"
                    onClick={() => showProject(s.projectId!)}
                    data-cursor="Open"
                  >
                    See the project
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* where you are, and a way out */}
        <div className="rp-foot mx-auto w-full max-w-6xl px-5 sm:px-8">
          <span className="rp-count">
            {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </span>
          <ol className="rp-dots" aria-label="Journey stops">
            {journey.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  className="rp-dot"
                  aria-current={i === active ? "step" : undefined}
                  data-done={i < active ? "" : undefined}
                  onClick={() => goTo(i)}
                  aria-label={`${s.date}: ${s.title}`}
                  title={`${s.date} · ${s.title}`}
                />
              </li>
            ))}
          </ol>
          <a href="#skills" data-jump className="journey-skip" onClick={() => (skipped.current = true)} data-cursor="Skip">
            Skip the journey <FastForward size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
