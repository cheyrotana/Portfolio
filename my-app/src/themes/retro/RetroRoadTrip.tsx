// Retro Journey (canvas J4, "night drive"): a road trip in a camper van, at night. The van holds the middle
// of the road while scrolling drives it on, its headlight on the road: the stop you're at stands as a big
// lamp-lit billboard in the stereo set's walnut and dark glass, the ones before and after wait small at the
// roadside, the hills and road dashes roll past under the stars and the city lights, and a car radio at the
// bottom lists every stop, its red needle on the one you're at.
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Compass, FastForward, GraduationCap, Rewind } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { journey, type JourneyStop } from "../../data/profile";
import { projects } from "../../data/projects";
import { iconOf } from "./retroWorkData";
import { openProject } from "../../lib/events";
import { unlock } from "../../lib/achievements";
import { play } from "../../lib/sound";
import { VanSprite } from "../../components/JourneyVehicles";

const KIND: Record<JourneyStop["kind"], string> = { study: "Study", project: "Project", work: "Work", next: "Next" };
const LAST = journey.length - 1;
const STEP_VH = 50; // scroll length per stop: a few wheel notches each

function Billboard({ stop, i, pos }: { stop: JourneyStop; i: number; pos: MotionValue<number> }) {
  // d = how far this stop is from the van, in stops (0 = right here)
  const d = useTransform(pos, (p) => i - p);
  const x = useTransform(d, (v) => `${(v * 42).toFixed(2)}vw`);
  const scale = useTransform(d, (v) => 1 - Math.min(1, Math.abs(v)) * 0.62);
  const opacity = useTransform(d, (v) => Math.max(0, 1 - Math.max(0, Math.abs(v) - 1) * 0.9) * (Math.abs(v) < 0.5 ? 1 : 0.8));
  const y = useTransform(d, (v) => `${(Math.min(1, Math.abs(v)) * 18).toFixed(2)}%`);
  const link = stop.projectId;
  // the board shows a picture, not a paragraph: the project's app icon, or a symbol for study / what's next
  const project = link ? projects.find((p) => p.id === link) : undefined;
  const icon = stop.logo ?? (project && iconOf(project));
  return (
    <motion.div className="rt-board" style={{ x, scale, opacity, y }} data-kind={stop.kind}>
      <article className="rt-board-face">
        <span className="rt-bulbs" aria-hidden="true">
          <span /> <span /> <span /> <span />
        </span>
        <span className="rt-board-pic" aria-hidden="true">
          {icon ? <img src={icon} alt="" data-org={stop.logo ? "" : undefined} /> : stop.kind === "next" ? <Compass /> : <GraduationCap />}
        </span>
        <div className="rt-board-top">
          <span className="rt-board-date">
            {stop.range ?? stop.date}
          </span>
          <span className="rt-board-kind">{KIND[stop.kind]}</span>
        </div>
        <h3 className="rt-board-title">{stop.title}</h3>
        <p className="rt-board-org">{stop.org}</p>
        <p className="rt-board-text sr-only">{stop.text}</p>
        {link && (
          <button type="button" className="rt-board-link" onClick={() => openProject(link)} data-cursor="View">
            See the project <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
        {stop.kind === "next" && (
          <a href="#contact" className="btn btn-primary mt-3 !py-2 !px-3 text-xs">
            Let's talk <ArrowRight size={14} />
          </a>
        )}
      </article>
      <span className="rt-posts" aria-hidden="true">
        <span />
        <span />
      </span>
    </motion.div>
  );
}

export function RetroRoadTrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const prog = reduce ? scrollYProgress : smooth;
  const pos = useTransform(prog, (p) => p * LAST);
  const [here, setHere] = useState(0);

  // like the route journey: the van turns round when you scroll back up, the skip key follows the
  // direction, and driving all the way (not skipping) unlocks the achievement
  const heading = useSpring(0, { stiffness: 220, damping: 24 }); // 0 = facing on, 1 = facing back
  const turnY = useTransform(heading, (h) => h * 180);
  const [goingBack, setGoingBack] = useState(false);
  const lastP = useRef(0);
  const back = useRef(false);
  const skipped = useRef(false);
  const lastRaw = useRef(0);

  // which way the van faces follows the page's scroll direction, not the van's own progress: that stays at
  // 0 above the section, so a van that had turned round on the way up used to drive back in reversed
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const step = y - (scrollY.getPrevious() ?? y);
    if (step < -2 && !back.current) {
      back.current = true;
      heading.set(1);
      setGoingBack(true);
    } else if (step > 2 && back.current) {
      back.current = false;
      heading.set(0);
      setGoingBack(false);
    }
  });

  useMotionValueEvent(pos, "change", (p) => {
    lastP.current = p;
    const i = Math.round(p);
    setHere((prev) => {
      if (prev !== i) play("tick");
      return i;
    });
    if (p >= LAST - 0.02 && !skipped.current) unlock("pilot");
  });
  // scrolling back up into the journey makes it count again
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (skipped.current && v < lastRaw.current && v < 0.98) skipped.current = false;
    lastRaw.current = v;
  });

  // sideways trackpad swipes (or shift + wheel) drive too, while the section is pinned
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const r = section.getBoundingClientRect();
      if (r.top > 1 || r.bottom < window.innerHeight - 1) return;
      e.preventDefault();
      window.scrollBy({ top: e.deltaX });
    };
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, []);

  // everything rolls past at its own speed (transforms only)
  const dashX = useTransform(pos, (p) => `${(-(p * 640) % 88).toFixed(1)}px`);
  const farX = useTransform(pos, (p) => `${(-(p * 90) % 900).toFixed(1)}px`);
  const nearX = useTransform(pos, (p) => `${(-(p * 260) % 1300).toFixed(1)}px`);
  const spin = useTransform(pos, (p) => p * 640 * 2.4);
  const bob = useTransform(pos, (p) => Math.sin(p * 40) * 1.5);

  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const room = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (room * i) / LAST, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="rt relative"
      style={{ height: `calc(100vh + ${LAST * STEP_VH}vh)` }}
      aria-label="Journey"
    >
      <div className="rt-stage sticky top-0 h-screen overflow-hidden">
        <span className="rt-rays" aria-hidden="true" />
        <span className="rt-sun" aria-hidden="true" />
        <span className="rt-city" aria-hidden="true" />
        <motion.div className="rt-hills rt-hills-far" style={{ x: farX }} aria-hidden="true" />
        <motion.div className="rt-hills rt-hills-near" style={{ x: nearX }} aria-hidden="true" />

        <div className="rt-road" aria-hidden="true">
          <motion.span className="rt-dashes" style={{ x: dashX }} />
        </div>

        <div className="rt-head relative mx-auto w-full max-w-6xl px-5 sm:px-8 pt-24 sm:pt-28">
          <span className="eyebrow relative">
            <span className="retro-eyebrow-code" aria-hidden="true">02</span>
            <span>Journey</span>
          </span>
          <h2 className="heading rt-heading text-4xl sm:text-5xl lg:text-6xl">The journey so far</h2>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-sm rt-sub">
            Keep scrolling to drive
            {goingBack ? (
              <a href="#about" data-jump className="journey-skip" data-cursor="Skip">
                <Rewind size={14} aria-hidden="true" /> Skip back up
              </a>
            ) : (
              <a href="#skills" data-jump className="journey-skip" onClick={() => (skipped.current = true)} data-cursor="Skip">
                Skip the journey <FastForward size={14} aria-hidden="true" />
              </a>
            )}
          </p>
        </div>

        <div className="rt-boards">
          {journey.map((stop, i) => (
            <Billboard key={stop.title} stop={stop} i={i} pos={pos} />
          ))}
        </div>

        <motion.div className="rt-van" style={{ y: bob }} aria-hidden="true">
          <motion.div className="rt-van-body" style={{ rotateY: turnY, transformPerspective: 600 }}>
            <span className="rt-beam" />
            <VanSprite spin={spin} />
          </motion.div>
        </motion.div>

        <nav className="rt-strip" aria-label="Journey stops">
          <span className="rt-count">
            <small>Car radio · stop</small>
            {String(here + 1).padStart(2, "0")} / {String(journey.length).padStart(2, "0")}
          </span>
          <div className="rt-dial" style={{ "--at": (here + 0.5) / journey.length, "--n": journey.length } as CSSProperties}>
            <span className="rt-needle" aria-hidden="true" />
          <ol>
            {journey.map((stop, i) => (
              <li key={stop.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === here ? "step" : undefined}
                  data-past={i < here || undefined}
                  title={stop.title}
                >
                  {stop.date}
                </button>
              </li>
            ))}
          </ol>
          </div>
        </nav>
      </div>
    </section>
  );
}
