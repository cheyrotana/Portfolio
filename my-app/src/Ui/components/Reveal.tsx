import { motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// Fades and lifts its children into place the first time they scroll into view.
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_/[]{}=+*^?#";

// Text that scrambles into place — once when it first scrolls into view, and again on hover.
export function ScrambleText({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(text);
  const timer = useRef<number | undefined>(undefined);

  const scramble = useCallback(() => {
    if (reduceMotion) return;
    window.clearInterval(timer.current);
    const frames = 16;
    let frame = 0;
    timer.current = window.setInterval(() => {
      frame++;
      const revealed = (frame / frames) * text.length;
      setDisplay(
        text
          .split("")
          .map((c, i) => (c === " " || i < revealed ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (frame >= frames) {
        window.clearInterval(timer.current);
        setDisplay(text);
      }
    }, 32);
  }, [text, reduceMotion]);

  useEffect(() => {
    if (!inView) return;
    const id = requestAnimationFrame(scramble);
    return () => cancelAnimationFrame(id);
  }, [inView, scramble]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  return (
    <span ref={ref} onMouseEnter={scramble} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  intro,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <Reveal className="mb-10 sm:mb-14">
      <span className="eyebrow">
        <span className="only-editorial">{`${index} —`}</span>
        <span className="only-pop">{`#${index}`}</span>
        <span className="only-persona">{`▶ ${index}`}</span>
        <span>{eyebrow}</span>
      </span>
      <h2 className="heading mt-4 text-4xl sm:text-5xl lg:text-6xl text-fg">
        {typeof title === "string" ? <ScrambleText text={title} /> : title}
      </h2>
      {intro && <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">{intro}</p>}
    </Reveal>
  );
}
