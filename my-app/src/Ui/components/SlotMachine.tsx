import {
  animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, type MotionValue,
} from "framer-motion";
import {
  ArrowRight, Building2, Dices, GraduationCap, Hand, ScanFace, Snowflake, Sparkles, Store, Trees, type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { unlock } from "../achievements";
import type { Project } from "../data/projects";
import { SPIN_EVENT } from "../events";
import { play, spinSound } from "../sound";
import { ImageSlideshow } from "./Gallery";

// One symbol (icon + colour) per project on the reels.
const SYMBOLS: Record<string, { icon: LucideIcon; color: string }> = {
  hrm: { icon: Building2, color: "#3b82f6" },
  "face-scan": { icon: ScanFace, color: "#a855f7" },
  phumiyerng: { icon: Trees, color: "#16a34a" },
  unifinder: { icon: GraduationCap, color: "#f59e0b" },
  modula: { icon: Store, color: "#ef4444" },
  "frost-guard": { icon: Snowflake, color: "#06b6d4" },
};

const CELL = 92; // height of one symbol on a reel, px
const WINDOW = Math.round(CELL * 1.7); // one full symbol plus a peek above and below
const REPEATS = 14; // copies of the symbol list on each strip, enough for the longest spin
const DURATIONS = [1.6, 2.1, 2.6]; // reels stop one after another
const LOOPS = [6, 8, 10]; // full turns before stopping
const AUTO_FIRST_MS = 900; // first automatic pull after the machine scrolls into view
const AUTO_EVERY_MS = 9000; // then one every few seconds while it stays on screen
const SIGN_BULBS = 13;

// y offset that centres cell `n` of a strip in the reel window.
const offsetFor = (n: number) => -n * CELL + (WINDOW - CELL) / 2;

function Reel({ items, y, won }: { items: Project[]; y: MotionValue<number>; won: boolean }) {
  return (
    <div className={`slot-reel relative flex-1 min-w-0 overflow-hidden ${won ? "slot-reel-won" : ""}`} style={{ height: WINDOW }}>
      <motion.div style={{ y }}>
        {Array.from({ length: REPEATS }, (_, copy) =>
          items.map((p) => {
            const sym = SYMBOLS[p.id] ?? { icon: Sparkles, color: "var(--accent)" };
            const Icon = sym.icon;
            return (
              <div key={`${copy}-${p.id}`} className="flex flex-col items-center justify-center gap-1.5 px-1" style={{ height: CELL }}>
                <span className="slot-symbol grid place-items-center w-12 h-12 sm:w-14 sm:h-14" style={{ ["--sym" as string]: sym.color }}>
                  <Icon size={28} strokeWidth={2.2} />
                </span>
                <span className="slot-symbol-label w-full text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate">
                  {p.title}
                </span>
              </div>
            );
          }),
        )}
      </motion.div>
    </div>
  );
}

// Bits of confetti that burst out of the machine on a win.
function Confetti() {
  const colors = ["var(--accent)", "#facc15", "#22c55e", "#3b82f6", "#ffffff"];
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 140 + (i % 5) * 28;
        return (
          <motion.span
            key={i}
            className="absolute w-2.5 h-3.5"
            style={{ background: colors[i % colors.length], borderRadius: i % 3 === 0 ? 999 : 2 }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.5 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 60, opacity: 0, rotate: 720, scale: 1 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

interface LuckyDrawProps {
  projects: Project[];
  onOpen: (id: string) => void;
  paused?: boolean; // e.g. while a case study is open
}

export function LuckyDraw({ projects, onOpen, paused = false }: LuckyDrawProps) {
  const reduceMotion = useReducedMotion();
  const n = projects.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.45 });

  // Start on three different symbols so the first view isn't already a jackpot.
  const y0 = useMotionValue(offsetFor(0));
  const y1 = useMotionValue(offsetFor(Math.min(2, n - 1)));
  const y2 = useMotionValue(offsetFor(Math.min(4, n - 1)));

  const [state, setState] = useState<"idle" | "spinning" | "won">("idle");
  const [winner, setWinner] = useState<number | null>(null);
  const [spins, setSpins] = useState(0);
  const [hovered, setHovered] = useState(false);
  const spinningRef = useRef(false);

  // `manual` is anything truthy (e.g. a click event) when the visitor pulled the lever themselves.
  const pull = useCallback(async (manual: unknown = false) => {
    if (spinningRef.current || n === 0) return;
    spinningRef.current = true;
    const byVisitor = manual !== false;

    // Pick a project, never the same one twice in a row.
    let pick = Math.floor(Math.random() * n);
    if (n > 1 && pick === winner) pick = (pick + 1 + Math.floor(Math.random() * (n - 1))) % n;

    setState("spinning");
    setSpins((s) => s + 1);
    // Casino sounds: lever clunk, then reels whirring and clicking until each one thuds into place.
    // They play for the visitor's own pulls (unless muted); automatic pulls only when sound is switched on.
    play("lever", { force: byVisitor });
    const reels = spinSound({ force: byVisitor, reels: 3 });

    await Promise.all(
      [y0, y1, y2].map((y, r) =>
        animate(y, offsetFor(LOOPS[r] * n + pick), {
          duration: reduceMotion ? 0.3 : DURATIONS[r],
          ease: [0.12, 0.55, 0.2, 1.04], // fast start, long slow-down, tiny bounce as it lands
        }).then(() => {
          y.set(offsetFor(pick)); // snap back to the same symbol in the first copy of the strip
          reels.reelStopped();
        }),
      ),
    );

    reels.stop();
    setWinner(pick);
    setState("won");
    spinningRef.current = false;
    play("jackpot", { force: byVisitor });
    if (byVisitor) unlock("jackpot");
  }, [n, winner, reduceMotion, y0, y1, y2]);

  // The command palette / terminal can pull the lever: bring the machine into view first.
  useEffect(() => {
    const onSpin = () => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => void pull(true), 750);
    };
    window.addEventListener(SPIN_EVENT, onSpin);
    return () => window.removeEventListener(SPIN_EVENT, onSpin);
  }, [pull]);

  // The machine pulls its own lever: soon after it comes into view, then every few seconds.
  useEffect(() => {
    if (!inView || paused || hovered || state === "spinning") return;
    const id = window.setTimeout(pull, spins === 0 ? AUTO_FIRST_MS : AUTO_EVERY_MS);
    return () => window.clearTimeout(id);
  }, [inView, paused, hovered, state, spins, pull]);

  const won = state === "won" && winner !== null;
  const winning = winner !== null ? projects[winner] : null;
  const blink = state === "spinning" ? "0.18s" : won ? "0.12s" : "1.2s";

  return (
    <div
      ref={rootRef}
      className="lucky-band card relative overflow-hidden grid lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 items-center p-6 sm:p-10 mb-14"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="bg-decor absolute inset-0 pointer-events-none opacity-60" aria-hidden="true" />

      {/* ── The machine ─────────────────────────────────────────────── */}
      <div className="relative mx-auto pr-12 sm:pr-14">
        <div className="slot-machine relative w-[min(70vw,400px)]">
          {/* Marquee sign */}
          <div className="slot-sign relative mx-4 px-4 pt-3 pb-4 text-center" style={{ ["--blink" as string]: blink }}>
            <div className="flex justify-between">
              {Array.from({ length: SIGN_BULBS }, (_, i) => <span key={i} className="slot-bulb" />)}
            </div>
            <p className="slot-sign-text heading text-3xl sm:text-4xl mt-1.5">Jackpot</p>
            <p className="slot-sign-sub text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em]">Project lucky draw</p>
            <div className="flex justify-between mt-2">
              {Array.from({ length: SIGN_BULBS }, (_, i) => <span key={i} className="slot-bulb" />)}
            </div>
          </div>

          {/* Cabinet */}
          <div className="slot-cabinet relative px-4 sm:px-5 pt-5 pb-4">
            {/* Reel window */}
            <div className="slot-window relative p-2.5">
              <div className="relative flex gap-2">
                <Reel items={projects} y={y0} won={won} />
                <Reel items={projects} y={y1} won={won} />
                <Reel items={projects} y={y2} won={won} />
                <span className="slot-payline pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ height: CELL }} />
              </div>
              <span className="slot-glass pointer-events-none absolute inset-0" aria-hidden="true" />
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="slot-led px-2.5 py-1.5 font-mono text-xs sm:text-sm">
                <span className="opacity-60">SPINS </span>
                {String(spins).padStart(3, "0")}
              </div>
              <div className={`slot-led px-2.5 py-1.5 font-mono text-xs sm:text-sm ${won ? "slot-led-win" : ""}`}>
                {state === "spinning" ? "· · ·" : won ? "WIN!" : "READY"}
              </div>
              <button
                type="button"
                className="slot-spin-btn heading text-sm sm:text-base"
                onClick={pull}
                disabled={state === "spinning"}
                aria-label="Spin the reels"
                data-cursor="Spin"
              >
                Spin
              </button>
            </div>

            {/* Coin tray */}
            <div className="slot-tray mt-4 mx-auto h-6 w-3/4" aria-hidden="true" />
          </div>

          {/* Lever */}
          <div className="absolute top-[44%] -right-12 sm:-right-14 w-12 sm:w-14 h-40">
            <button
              type="button"
              onClick={pull}
              disabled={state === "spinning"}
              className="group absolute inset-0 cursor-grab active:cursor-grabbing disabled:cursor-wait"
              aria-label="Pull the lever"
              data-cursor="Pull!"
              title="Pull the lever"
            >
              <motion.span
                className="absolute bottom-4 left-1/2 -ml-[5px] w-[10px] h-[112px] origin-bottom"
                animate={state === "spinning" ? { scaleY: [1, -0.85, -0.85, 1] } : { scaleY: 1 }}
                transition={{ duration: 0.9, times: [0, 0.35, 0.6, 1], ease: "easeInOut" }}
              >
                <span className="slot-lever-rod absolute inset-0" />
                <span className="slot-lever-knob absolute -top-7 left-1/2 -ml-[17px] w-[34px] h-[34px] transition-transform group-hover:scale-110" />
              </motion.span>
              <span className="slot-lever-mount absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-8" />
            </button>
          </div>

          {/* "Pull me" hint before the first spin */}
          <AnimatePresence>
            {spins === 0 && (
              <motion.span
                className="slot-hint absolute -right-14 sm:-right-16 top-[28%] hidden sm:flex items-center gap-1 text-xs font-bold whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, -5, 0] }}
                exit={{ opacity: 0 }}
                transition={{ y: { repeat: Infinity, duration: 1.1 } }}
              >
                <Hand size={14} /> Pull!
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence>{won && <Confetti key={spins} />}</AnimatePresence>
        </div>
      </div>

      {/* ── Result ──────────────────────────────────────────────────── */}
      <div className="relative min-w-0" aria-live="polite">
        <AnimatePresence mode="wait">
          {won && winning ? (
            <motion.div
              key={`won-${spins}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.p
                className="heading text-4xl sm:text-5xl text-fg"
                initial={{ scale: 0.4, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 14 }}
              >
                <span className="accent-text">Jackpot!</span>
              </motion.p>
              <p className="mt-4 text-sm font-mono text-muted">
                {winning.year} · {winning.client}
              </p>
              <h3 className="heading mt-1 text-3xl sm:text-4xl text-fg">{winning.title}</h3>
              <p className="mt-1 text-sm font-semibold text-accent">{winning.role}</p>

              <div
                className="mt-5 aspect-[16/9] overflow-hidden border border-line rounded-[var(--radius-sm)] cursor-zoom-in [[data-theme=pop]_&]:border-[2.5px]"
                data-cursor="Open"
              >
                <ImageSlideshow images={winning.images} alt={winning.title} onImageClick={() => onOpen(winning.id)} />
              </div>

              <p className="mt-5 text-muted leading-relaxed">{winning.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {winning.tech.map((t) => <span key={t} className="chip">{t}</span>)}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={() => onOpen(winning.id)}>
                  Open case study <ArrowRight size={16} />
                </button>
                <button type="button" className="btn btn-ghost" onClick={pull}>
                  <Dices size={16} /> Spin again
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="eyebrow">
                <Dices size={14} /> Feeling lucky?
              </span>
              <h3 className="heading mt-4 text-4xl sm:text-5xl text-fg">
                Let the machine <span className="accent-text">pick</span> for you.
              </h3>
              <p className="mt-4 text-muted leading-relaxed max-w-md">
                {state === "spinning"
                  ? "The reels are spinning…"
                  : "Not sure where to start? Pull the lever — or just wait, it pulls itself — and land on one of my projects."}
              </p>
              <button type="button" className="btn btn-primary mt-6" onClick={pull} disabled={state === "spinning"}>
                <Dices size={16} /> Pull the lever
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
