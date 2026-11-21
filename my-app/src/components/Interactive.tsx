import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useFinePointer } from "../hooks/interactive";

const isTyping = (el: Element | null) => !!el?.closest("input, textarea, select, [contenteditable=true]");

// ── Scroll progress bar ─────────────────────────────────────────────────────

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.3 });
  return (
    <motion.div
      className="scroll-progress fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-accent"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

// ── Custom cursor ───────────────────────────────────────────────────────────
// A ring that trails the pointer, grows over anything clickable and shows a hint
// from the nearest [data-cursor] attribute ("Open", "Spin", "Pull!" …).

const CLICKABLE = "a, button, [role=button], [role=tab], label, summary";

export function CustomCursor() {
  const fine = useFinePointer();
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 520, damping: 38, mass: 0.45 });
  const sy = useSpring(y, { stiffness: 520, damping: 38, mass: 0.45 });
  const [mode, setMode] = useState<{ active: boolean; label: string | null; hidden: boolean }>({
    active: false, label: null, hidden: true,
  });
  const [pressed, setPressed] = useState(false);
  const last = useRef(mode);

  useEffect(() => {
    if (!fine || reduceMotion) return;
    const update = (next: typeof mode) => {
      const prev = last.current;
      if (prev.active !== next.active || prev.label !== next.label || prev.hidden !== next.hidden) {
        last.current = next;
        setMode(next);
      }
    };
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as Element | null;
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      update({
        active: !!(labelled || t?.closest(CLICKABLE)),
        label: labelled?.dataset.cursor ?? null,
        hidden: isTyping(t),
      });
    };
    const onLeave = () => update({ ...last.current, hidden: true });
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    document.documentElement.classList.add("has-custom-cursor");
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
    };
  }, [fine, reduceMotion, x, y]);

  if (!fine || reduceMotion) return null;

  const size = mode.label ? 76 : mode.active ? 46 : 26;
  return (
    <>
      <motion.div
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[95] grid place-items-center"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: size,
          height: size,
          opacity: mode.hidden ? 0 : 1,
          scale: pressed ? 0.8 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        aria-hidden="true"
      >
        <AnimatePresence>
          {mode.label && (
            <motion.span
              key={mode.label}
              className="cursor-label text-[11px] font-bold uppercase tracking-wider"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              {mode.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[96] w-1.5 h-1.5"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: mode.hidden || mode.label ? 0 : 1 }}
        aria-hidden="true"
      />
    </>
  );
}

// ── Click bursts ────────────────────────────────────────────────────────────

interface Burst {
  id: number;
  x: number;
  y: number;
}

export function ClickBursts() {
  const reduceMotion = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    if (reduceMotion) return;
    let id = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || isTyping(e.target as Element)) return;
      const burst = { id: ++id, x: e.clientX, y: e.clientY };
      setBursts((b) => [...b.slice(-5), burst]);
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== burst.id)), 700);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [reduceMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[94]" aria-hidden="true">
      {bursts.map((b) =>
        Array.from({ length: 9 }, (_, i) => {
          const angle = (i / 9) * Math.PI * 2 + b.id;
          const dist = 26 + (i % 3) * 10;
          return (
            <motion.span
              key={`${b.id}-${i}`}
              className="burst-bit absolute"
              style={{ left: b.x, top: b.y }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
              animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 0, opacity: 0, rotate: 180 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          );
        }),
      )}
    </div>
  );
}
