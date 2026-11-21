import { motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Ransom } from "./Ransom";
import { MetroDirections } from "./MetroDirections";
import { useThemeAttr } from "../hooks/interactive";

// Fades and lifts its children into place the first time they scroll into view. Not in Retro: there the
// whole section rises in with the scroll (retro.css), and a second, timed fade on top of it looks jumpy.
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const retro = useThemeAttr() === "retro";
  // Retro runs its own entrances (retroReveal.ts); a motion wrapper there would fight them (its inline
  // opacity and transform against the CSS keyframes: things showed, vanished and came back), so a plain div.
  if (retro) return <div className={className}>{children}</div>;
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

// Retro: the big section number. The last digit's reel spins through 0–9 once and stops on the number.
function OdometerNumber({ index }: { index: string }) {
  const last = Number(index.slice(-1)) || 0;
  const reel = [...Array(10).keys(), ...Array(last + 1).keys()];
  return (
    <span className="retro-odo" aria-hidden="true" style={{ "--odo": reel.length - 1 } as CSSProperties}>
      <span>{index.slice(0, -1)}</span>
      <span className="retro-odo-win">
        <span className="retro-odo-reel">
          {reel.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </span>
      </span>
    </span>
  );
}

// Retro: the title in letters that drop in one after another (the needle-drop entrance). Each word stays
// whole so lines only break between words; screen readers get the plain title.
function DropLetters({ text }: { text: string }) {
  let n = 0;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, w) => (
          <span key={w}>
            {w > 0 && " "}
            <span className="drop-word">
              {[...word].map((ch, i) => (
                <span key={i} className="drop-letter" style={{ "--li": n++ } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </>
  );
}

// Retro: each section enters its own way (retro.css): About comes out of a record sleeve (it is the back of
// one), Work gets the needle drop next to its turntable, the rest the big type sweep.
type Entrance = "sweep" | "needle" | "sleeve";
const RETRO_ENTRANCE: Record<string, Entrance> = { "01": "sleeve", "04": "needle" };

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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const entrance = RETRO_ENTRANCE[index] ?? "sweep";
  return (
    <Reveal className="section-header relative mb-10 sm:mb-14">
      <div ref={ref} data-stamp={inView ? "in" : "wait"} data-entrance={entrance}>
        <span className="only-persona">
          <span className="p5-index" aria-hidden="true">{index}</span>
        </span>
        {/* Retro entrance pieces (retro.css) */}
        <span className="only-retro">
          {entrance === "sweep" && (
            <>
              {/* the section's name sweeps across and stays as a faint backdrop, the 70s stripes slash
                  through and the section number rolls in like an odometer */}
              <span className="retro-sweep" aria-hidden="true">
                {eyebrow}
              </span>
              <span className="retro-slash" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <OdometerNumber index={index} />
            </>
          )}
          {entrance === "needle" && (
            // a tonearm swings over and drops its needle on the title; a ripple runs out from the drop
            <span className="retro-drop" aria-hidden="true">
              <span className="retro-drop-arm">
                <span className="retro-drop-bar" />
              </span>
              <span className="retro-drop-ring" />
              <span className="retro-drop-ring is-late" />
            </span>
          )}
          {entrance === "sleeve" && (
            // a sleeve slides in and the record is pulled out of it, spinning
            <span className="retro-pull" aria-hidden="true">
              <span className="retro-pull-record" />
              <span className="retro-pull-sleeve">{eyebrow}</span>
            </span>
          )}
        </span>
        <span className="eyebrow relative">
          <span className="only-metro">
            <span className="metro-badge" aria-hidden="true">{Number(index)}</span>
          </span>
          <span className="only-persona">{`▶ ${index}`}</span>
          <span className="only-retro">
            <span className="retro-eyebrow-code" aria-hidden="true">
              {index}
            </span>
          </span>
          <span>{eyebrow}</span>
        </span>
        <MetroDirections stop={Number(index)} />
        {entrance === "sweep" && (
          <span className="only-retro">
            <span className="retro-rule" aria-hidden="true" />
          </span>
        )}
        <h2 className="heading relative mt-4 text-4xl sm:text-5xl lg:text-6xl text-fg">
          {/* in Retro the title rises from behind the rule (the mask clips it until it's up) */}
          <span className="title-mask">
            <span className="title-lift">
              {typeof title === "string" ? (
                <>
                  {entrance === "needle" && (
                    <span className="only-retro">
                      <DropLetters text={title} />
                    </span>
                  )}
                  <span className={entrance === "needle" ? "not-persona not-retro" : "not-persona"}>
                    <ScrambleText text={title} />
                  </span>
                  <span className="only-persona">
                    <Ransom text={title} seed={Number(index) || 0} />
                  </span>
                </>
              ) : (
                title
              )}
            </span>
          </span>
        </h2>
        {intro && <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">{intro}</p>}
      </div>
    </Reveal>
  );
}
