import {
  motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Briefcase, Code2, FastForward, Flag, Rewind, GraduationCap, MoveRight, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { journey, type JourneyStop } from "../data/profile";
import { unlock } from "../achievements";
import { SET_VEHICLE_EVENT, showProject } from "../events";
import { play } from "../sound";
import { ScrambleText } from "./Reveal";
import { P5Skyline, P5Slab } from "./PersonaDecor";
import { P5Clouds } from "./Weather";
import { Ransom } from "./Ransom";
import { CarSprite, PaperPlaneSprite, TrainSprite } from "./JourneyVehicles";
import { MetroDirections } from "./MetroDirections";
import { RetroRoadTrip } from "./RetroRoadTrip";
import { useThemeAttr } from "../hooks/interactive";

const TRACK_H = 560; // height of the route area before it's scaled to fit the screen
const CARD_GAP = 30; // space between a stop's marker and its card

const KIND_ICON: Record<JourneyStop["kind"], LucideIcon> = {
  study: GraduationCap,
  project: Code2,
  work: Briefcase,
  next: Flag,
};

type VehicleId = "plane" | "car" | "train";

interface Vehicle {
  id: VehicleId;
  label: string;
  mode: "air" | "road";
  verb: string;
  start: string;
  sprite: (spin?: MotionValue<number>) => ReactNode;
}

const VEHICLES: Vehicle[] = [
  { id: "plane", label: "Paper plane", mode: "air", verb: "fly", start: "Takeoff ↗", sprite: () => <PaperPlaneSprite /> },
  { id: "car", label: "Car", mode: "road", verb: "drive", start: "Start ▸", sprite: (s) => <CarSprite spin={s} /> },
  { id: "train", label: "Train", mode: "road", verb: "ride", start: "Departs ▸", sprite: (s) => <TrainSprite spin={s} /> },
];

const VEHICLE_KEY = "journey-vehicle";

function loadVehicle(): VehicleId {
  try {
    const saved = localStorage.getItem(VEHICLE_KEY);
    if (saved === "plane" || saved === "car" || saved === "train") return saved;
  } catch {
    // storage blocked: fall back to the default
  }
  // nothing chosen yet: the Metro theme rides a train, Retro drives, the others fly the paper plane
  const theme = document.documentElement.dataset.theme;
  return theme === "metro" ? "train" : theme === "retro" ? "car" : "plane";
}

interface Geometry {
  gap: number;
  width: number;
  cardW: number;
  startY: number;
  stops: { x: number; y: number }[];
  d: string;
}

// The paper plane gets a playful route — big swoops and a loop-the-loop.
const AIR_Y = [330, 170, 340, 165, 325, 175, 335, 200];
const AIR_SWING: (number | "loop")[] = [-190, 170, "loop", -170, 180, -150, 150];
// The car gets a simple, gently waving road.
const ROAD_Y = [305, 245];

function buildGeometry(vw: number, mode: Vehicle["mode"]): Geometry {
  const gap = Math.max(330, Math.min(540, vw * 0.52));
  const start = Math.max(210, vw * 0.28); // length of the take-off run before the first stop
  const ys = mode === "air" ? AIR_Y : ROAD_Y;
  const stops = journey.map((_, i) => ({ x: start + i * gap, y: ys[i % ys.length] }));
  const last = stops[stops.length - 1];
  const width = last.x + Math.max(360, vw * 0.5);
  const cardW = vw < 640 ? 220 : 270;

  if (mode === "road") {
    // Smooth S-bends through each stop, level at every stop, then straight on off the edge.
    const startY = 290;
    let d = `M 0 ${startY} C ${start * 0.5} ${startY}, ${start * 0.5} ${stops[0].y}, ${stops[0].x} ${stops[0].y}`;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      d += ` C ${a.x + gap * 0.45} ${a.y}, ${b.x - gap * 0.45} ${b.y}, ${b.x} ${b.y}`;
    }
    d += ` C ${last.x + 160} ${last.y}, ${width - 160} ${startY}, ${width} ${startY}`;
    return { gap, width, cardW, startY, stops, d };
  }

  // Air: take off from the bottom-left, swoop between stops, then climb away off the right edge.
  const startY = TRACK_H - 76;
  let d = `M 0 ${startY} C ${start * 0.45} ${startY + 10}, ${start * 0.55} ${stops[0].y + 120}, ${stops[0].x} ${stops[0].y}`;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const swing = AIR_SWING[i % AIR_SWING.length];
    if (swing === "loop") {
      const mx = (a.x + b.x) / 2;
      const my = Math.min(a.y, b.y) + 70;
      d += ` C ${a.x + gap * 0.25} ${a.y + 60}, ${mx - gap * 0.3} ${my + 40}, ${mx} ${my}`;
      d += ` C ${mx + 190} ${my - 230}, ${mx - 190} ${my - 230}, ${mx} ${my}`;
      d += ` C ${mx + gap * 0.3} ${my + 40}, ${b.x - gap * 0.25} ${b.y + 80}, ${b.x} ${b.y}`;
    } else {
      d += ` C ${a.x + gap * 0.38} ${a.y + swing}, ${b.x - gap * 0.38} ${b.y - swing * 0.55}, ${b.x} ${b.y}`;
    }
  }
  d += ` C ${last.x + 140} ${last.y - 20}, ${width - 160} 140, ${width} 70`;
  return { gap, width, cardW, startY, stops, d };
}

function Cloud({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 50" className={`journey-cloud absolute ${className}`} style={style} aria-hidden="true">
      <path d="M 18 44 C 4 44 2 26 16 24 C 16 10 36 4 46 16 C 54 2 80 4 82 22 C 98 18 112 30 104 44 Z" />
    </svg>
  );
}

function RouteJourney() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const headIn = useInView(headRef, { once: true, amount: 0.5 });

  const [vehicleId, setVehicleId] = useState<VehicleId>(loadVehicle);
  const vehicle = VEHICLES.find((v) => v.id === vehicleId) ?? VEHICLES[0];
  const chooseVehicle = useCallback((id: VehicleId) => {
    setVehicleId(id);
    play("pop");
    try {
      localStorage.setItem(VEHICLE_KEY, id);
    } catch {
      // storage blocked: the choice still applies for this visit
    }
  }, []);

  // The command palette and terminal can switch vehicles too.
  useEffect(() => {
    const onSet = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id === "plane" || id === "car" || id === "train") chooseVehicle(id);
    };
    window.addEventListener(SET_VEHICLE_EVENT, onSet);
    return () => window.removeEventListener(SET_VEHICLE_EVENT, onSet);
  }, [chooseVehicle]);

  const [vw, setVw] = useState(() => window.innerWidth);
  const [stageH, setStageH] = useState(TRACK_H);
  const geo = useMemo(() => buildGeometry(vw, vehicle.mode), [vw, vehicle.mode]);
  const scale = Math.min(1, Math.max(0.55, stageH / TRACK_H));

  // Route measurements, taken once per layout.
  const lengths = useRef({ total: 0, stops: [] as number[] });

  const vx = useMotionValue(0);
  const vy = useMotionValue(geo.startY);
  const vRot = useMotionValue(0);
  const wheelSpin = useMotionValue(0);
  const trackX = useMotionValue(0);
  const trail = useMotionValue(0);
  const [active, setActive] = useState(-1);

  // Scrolling back up: the vehicle turns its nose around (a quick 3D turn) and heads back the way it came.
  const heading = useSpring(0, { stiffness: 220, damping: 24 }); // 0 = facing forward, 1 = facing back
  const turnY = useTransform(heading, (h) => h * 180);
  const lastP = useRef(0);
  // "Skip the journey" jumps past the section; that shouldn't count as flying the whole route
  const skipped = useRef(false);
  const lastRaw = useRef(0);
  const facingBack = useRef(false);
  const [goingBack, setGoingBack] = useState(false); // drives the skip button's direction

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 });
  const progress = reduceMotion ? scrollYProgress : smooth;
  const cloudsX = useTransform(trackX, (v) => v * 0.45);

  // Keep the layout in step with the window and the space available for the route.
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    const el = stageRef.current;
    const ro = el ? new ResizeObserver(([e]) => setStageH(e.contentRect.height)) : null;
    if (el && ro) ro.observe(el);
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, []);

  const place = useCallback(
    (p: number) => {
      const path = pathRef.current;
      const { total, stops } = lengths.current;
      if (!path || !total) return;

      // Face the way we're moving.
      if (p < lastP.current - 0.0003 && !facingBack.current) {
        facingBack.current = true;
        heading.set(1);
        setGoingBack(true);
      } else if (p > lastP.current + 0.0003 && facingBack.current) {
        facingBack.current = false;
        heading.set(0);
        setGoingBack(false);
      }
      lastP.current = p;

      const L = Math.min(1, Math.max(0, p)) * total;
      const pt = path.getPointAtLength(L);
      const a = path.getPointAtLength(Math.max(0, L - 2));
      const b = path.getPointAtLength(Math.min(total, L + 2));

      vx.set(pt.x);
      vy.set(pt.y);
      vRot.set((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
      wheelSpin.set(L * 2.4);
      trail.set(L / total);

      // The camera keeps the vehicle about 40% of the way across the screen.
      const vwNow = window.innerWidth;
      trackX.set(Math.min(0, Math.max(-(geo.width * scale - vwNow), vwNow * 0.4 - pt.x * scale)));

      const reached = stops.filter((sl) => sl <= L + 6).length - 1;
      setActive((prev) => (prev === reached ? prev : reached));
      if (reached === stops.length - 1 && !skipped.current) unlock("pilot");
    },
    [geo.width, scale, heading, vx, vy, vRot, wheelSpin, trail, trackX],
  );

  // Measure the route once per layout: total length and where each stop sits along it (one pass).
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const best = geo.stops.map(() => ({ l: 0, d: Infinity }));
    for (let l = 0; l <= total; l += 6) {
      const q = path.getPointAtLength(l);
      for (let i = 0; i < geo.stops.length; i++) {
        const s = geo.stops[i];
        const dist = (q.x - s.x) ** 2 + (q.y - s.y) ** 2;
        if (dist < best[i].d) best[i] = { l, d: dist };
      }
    }
    lengths.current = { total, stops: best.map((x) => x.l) };
    const id = requestAnimationFrame(() => place(progress.get()));
    return () => cancelAnimationFrame(id);
  }, [geo, place, progress]);

  useMotionValueEvent(progress, "change", place);
  // scrolling back up into the journey makes it count again
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (skipped.current && v < lastRaw.current && v < 0.98) skipped.current = false;
    lastRaw.current = v;
  });

  // Sideways trackpad swipes (or shift + wheel) move along the route too, while the section is pinned.
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

  const scrollLength = Math.round(geo.width * scale * 0.85);
  const current = active >= 0 ? journey[active] : null;

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="relative bg-bg"
      style={{ height: `calc(100vh + ${scrollLength}px)` }}
      aria-label="Journey"
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="bg-decor absolute inset-0 pointer-events-none opacity-70 not-persona-block" aria-hidden="true" />
        <P5Slab variant="full" />
        <P5Clouds count={5} to={70} seed={3} />
        <P5Skyline className="p5-skyline-low" />

        {/* Heading + vehicle picker */}
        <div
          ref={headRef}
          data-stamp={headIn ? "in" : "wait"}
          className="journey-head relative mx-auto w-full max-w-6xl px-5 sm:px-8 pt-24 sm:pt-28"
        >
          <span className="only-persona">
            <span className="p5-index !top-12 sm:!top-16" aria-hidden="true">02</span>
          </span>
          <span className="eyebrow relative">
            <span className="only-metro">
              <span className="metro-badge" aria-hidden="true">2</span>
            </span>
            <span className="only-retro">
              <span className="retro-eyebrow-code" aria-hidden="true">02</span>
            </span>
            <span className="only-pop">#02</span>
            <span className="only-persona">▶ 02</span>
            <span>Journey</span>
          </span>
          <MetroDirections stop={2} />
          <div className="relative mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <h2 className="heading text-4xl sm:text-5xl lg:text-6xl text-fg">
                <span className="not-persona">
                  <ScrambleText text="The journey so far" />
                </span>
                <span className="only-persona">
                  <Ransom text="The journey so far" seed={2} />
                </span>
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                Keep scrolling to {vehicle.verb} <MoveRight size={16} className="text-accent" />
                {/* follows the scroll direction: skip on to Skills, or back up to About */}
                {goingBack ? (
                  <a href="#about" data-jump className="journey-skip" data-cursor="Skip">
                    <Rewind size={14} aria-hidden="true" /> Skip back up
                  </a>
                ) : (
                  <a
                    href="#skills"
                    data-jump
                    className="journey-skip"
                    onClick={() => (skipped.current = true)}
                    data-cursor="Skip"
                  >
                    Skip the journey <FastForward size={14} aria-hidden="true" />
                  </a>
                )}
              </p>
            </div>
            <div className="vehicle-picker flex items-center gap-1 p-1" role="radiogroup" aria-label="Choose a vehicle">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={v.id === vehicleId}
                  onClick={() => chooseVehicle(v.id)}
                  className={`vehicle-option ${v.id === vehicleId ? "is-selected" : ""}`}
                  data-cursor={v.label}
                >
                  <span className="vehicle-icon" aria-hidden="true">{v.sprite()}</span>
                  <span className="text-xs font-semibold whitespace-nowrap">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Route */}
        <div ref={stageRef} className="relative flex-1 min-h-0 mt-2" data-mode={vehicle.mode}>
          {/* Clouds drift by more slowly than the route, for depth */}
          <motion.div className="absolute inset-y-0 left-0" style={{ x: cloudsX, width: geo.width }} aria-hidden="true">
            {geo.stops.map((s, i) => (
              <Cloud
                key={i}
                className={i % 2 ? "w-24 sm:w-32 opacity-70" : "w-16 sm:w-20 opacity-50"}
                style={{ left: s.x + geo.gap * 0.35, top: i % 2 ? "8%" : "72%" }}
              />
            ))}
          </motion.div>

          <motion.div className="absolute left-0 top-1/2" style={{ x: trackX, y: "-50%" }}>
            <div
              className="relative"
              style={{ width: geo.width, height: TRACK_H, transform: `scale(${scale})`, transformOrigin: "0 50%" }}
            >
              <svg width={geo.width} height={TRACK_H} className="absolute inset-0 overflow-visible" aria-hidden="true">
                <path ref={pathRef} d={geo.d} className="journey-route" fill="none" />
                <path d={geo.d} className="journey-road-line" fill="none" />
                <motion.path d={geo.d} className="journey-flown" fill="none" style={{ pathLength: trail }} />
              </svg>

              <span
                className="absolute left-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted"
                style={{ top: geo.startY + 22 }}
              >
                {vehicle.start}
              </span>

              {/* Stops */}
              <ol>
                {journey.map((stop, i) => {
                  const { x, y } = geo.stops[i];
                  const above = y > TRACK_H / 2;
                  const reached = i <= active;
                  const Icon = KIND_ICON[stop.kind];
                  return (
                    <li key={stop.title}>
                      <span
                        className={`journey-marker absolute -translate-x-1/2 -translate-y-1/2 ${reached ? "is-reached" : ""}`}
                        style={{ left: x, top: y }}
                      />
                      <span
                        className="absolute w-px bg-line"
                        style={{ left: x, top: above ? y - CARD_GAP : y + 9, height: CARD_GAP - 9 }}
                      />
                      <motion.div
                        className={`journey-card card absolute p-4 sm:p-5 ${stop.projectId ? "is-link" : ""}`}
                        style={{
                          left: x - 28,
                          width: geo.cardW,
                          ...(above ? { bottom: TRACK_H - y + CARD_GAP } : { top: y + CARD_GAP }),
                        }}
                        animate={{ opacity: reached ? 1 : 0.42, y: reached ? 0 : above ? 10 : -10, scale: reached ? 1 : 0.97 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        {...(stop.projectId && {
                          role: "link",
                          tabIndex: 0,
                          "aria-label": `${stop.title} — see this project`,
                          "data-cursor": "View",
                          onClick: () => showProject(stop.projectId!),
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              showProject(stop.projectId!);
                            }
                          },
                        })}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-accent">
                            {stop.range ?? stop.date}
                          </span>
                          <Icon size={16} className={reached ? "text-accent" : "text-muted"} />
                        </div>
                        <h3 className="heading mt-1.5 text-xl sm:text-2xl text-fg">{stop.title}</h3>
                        <p className="text-xs sm:text-sm font-semibold text-muted">{stop.org}</p>
                        <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">{stop.text}</p>
                        {stop.projectId && (
                          <span className="journey-card-link mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                            See the project <ArrowRight size={13} />
                          </span>
                        )}
                        {stop.kind === "next" && (
                          <a href="#contact" className="btn btn-primary mt-3 !py-2 !px-3 text-xs">
                            Let's talk <ArrowRight size={14} />
                          </a>
                        )}
                      </motion.div>
                    </li>
                  );
                })}
              </ol>

              {/* The vehicle */}
              <motion.div
                className="journey-vehicle absolute left-0 top-0 z-10 pointer-events-none"
                style={{ x: vx, y: vy, rotate: vRot, translateX: "-50%", translateY: "-50%" }}
                aria-hidden="true"
              >
                <motion.div style={{ rotateY: turnY, transformPerspective: 600 }}>{vehicle.sprite(wheelSpin)}</motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Trip status */}
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 pb-6 sm:pb-8">
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <span className="font-mono text-muted whitespace-nowrap">
              {String(Math.max(0, active + 1)).padStart(2, "0")} / {String(journey.length).padStart(2, "0")}
            </span>
            <div className="relative flex-1 h-1 bg-line/40 overflow-hidden rounded-full">
              <motion.div className="absolute inset-y-0 left-0 w-full origin-left bg-accent" style={{ scaleX: progress }} />
            </div>
            <span className="font-semibold text-fg truncate max-w-[50%]" aria-live="polite">
              {current ? `${current.date} · ${current.title}` : "Ready to go"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Retro drives a camper van past roadside billboards (canvas J1; with ?room, Side B of the parked 3D room);
// the other themes drive the route.
function JourneySection() {
  return useThemeAttr() === "retro" ? <RetroRoadTrip /> : <RouteJourney />;
}

export default JourneySection;
