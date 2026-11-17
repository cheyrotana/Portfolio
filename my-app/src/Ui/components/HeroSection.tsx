import {
  AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue,
} from "framer-motion";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import phumiPhone from "../../assets/PhumiYerng/1.jpg";
import hrmPhone2 from "../../assets/HRM/mlmupc-3.jpg";
import { profile, socials } from "../data/profile";
import { DemoPhone } from "./DemoPhone";

const ease = [0.22, 1, 0.36, 1] as const;

const REEL_WORDS = ["mobile", "web", "full-stack", "IoT"];

// One word of the headline rolls like a slot-machine reel; it advances on its own, and on click.
function WordReel() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = () => setIndex((i) => (i + 1) % REEL_WORDS.length);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % REEL_WORDS.length), 2600);
    return () => clearInterval(id);
  }, [reduceMotion, paused]);

  // The outer span carries the theme's highlight (and Persona's tilt); the inner button animates its width.
  return (
    <span className="accent-text inline-block align-bottom">
    <motion.button
      type="button"
      layout
      onClick={next}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative inline-grid overflow-hidden align-bottom cursor-pointer [font:inherit] [letter-spacing:inherit] [text-transform:inherit] [color:inherit] px-[0.06em]"
      transition={{ layout: { type: "spring", stiffness: 380, damping: 32 } }}
      aria-label={`${REEL_WORDS[index]} — click to spin`}
      data-cursor="Spin"
      title="Click to spin"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={REEL_WORDS[index]}
          className="block whitespace-nowrap"
          initial={{ y: "-110%", filter: "blur(6px)" }}
          animate={{ y: "0%", filter: "blur(0px)" }}
          exit={{ y: "110%", filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 320, damping: 20, mass: 0.8 }}
        >
          {REEL_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </motion.button>
    </span>
  );
}

// Phone screenshots floating on the right; each bobs gently on its own rhythm.
// Spiky burst shape for the Persona theme: alternating outer and inner points around a circle.
const STARBURST = `polygon(${Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 36 + (i % 4) * 3;
  return `${(50 + r * Math.cos(angle)).toFixed(1)}% ${(50 + r * Math.sin(angle)).toFixed(1)}%`;
}).join(", ")})`;

const phones = [
  { src: phumiPhone, alt: "PhumiYerng app", className: "left-[0%] top-[16%] w-[32%] -rotate-[9deg] z-10", float: 10, delay: 0, depth: 16 },
  { src: null, alt: "HRM app demo", className: "left-[26%] -top-[4%] w-[48%] rotate-[1deg] z-20", float: 5, delay: 0.6, depth: 20 },
  { src: hrmPhone2, alt: "HRM QR check-in", className: "right-[0%] top-[20%] w-[30%] rotate-[10deg] z-10", float: 9, delay: 1.2, depth: 22 },
];

// Moves its children with the mouse; bigger depth = moves further, so layers feel 3D.
function Parallax({
  mx, my, depth, className, children,
}: { mx: MotionValue<number>; my: MotionValue<number>; depth: number; className?: string; children: ReactNode }) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

function HeroSection() {
  const reduceMotion = useReducedMotion();
  // Mouse position over the hero, from -1 to 1 on each axis, smoothed.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 80, damping: 18 });
  const my = useSpring(rawY, { stiffness: 80, damping: 18 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
    rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-16"
      onPointerMove={onPointerMove}
    >
      <div className="bg-decor absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Pop theme: chunky decorative shapes */}
      <div className="only-pop" aria-hidden="true">
        <span className="absolute top-28 right-[8%] w-24 h-24 rounded-full bg-accent-2 border-[2.5px] border-line shadow-[5px_5px_0_var(--line)] hidden lg:block" />
        <span className="absolute bottom-24 left-[4%] w-16 h-16 rotate-12 bg-accent-3 border-[2.5px] border-line shadow-[4px_4px_0_var(--line)] rounded-xl hidden md:block" />
        <span className="absolute top-[45%] left-[46%] text-5xl text-accent hidden lg:block select-none">✦</span>
      </div>

      <div className="relative mx-auto max-w-6xl w-full px-5 sm:px-8 grid lg:grid-cols-[1.15fr_1fr] gap-14 lg:gap-8 items-center">
        {/* Text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-wrap items-center gap-3"
          >
            <span className="chip !text-fg">
              <span className="pulse-dot w-2 h-2 rounded-full bg-accent" />
              {profile.currently}
            </span>
            <span className="chip">
              <MapPin size={12} /> {profile.location}
            </span>
          </motion.div>

          <motion.p
            className="eyebrow mt-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Hi, I'm {profile.name}
          </motion.p>

          <motion.h1
            className="heading mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl text-fg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease }}
          >
            I build <WordReel /> apps that solve real problems.
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base sm:text-lg text-muted leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease }}
          >
            {profile.role} working with Flutter, Angular and NestJS.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease }}
          >
            <a href="#work" className="btn btn-primary">
              See my work <ArrowRight size={16} />
            </a>
            <a href="#contact" className="btn btn-ghost">
              Get in touch
            </a>
            <span className="flex gap-2 ml-1">
              {socials.map(({ name, url, icon: Icon }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={name}>
                  <Icon size={18} />
                </a>
              ))}
            </span>
          </motion.div>
        </div>

        {/* Floating phones */}
        <motion.div
          className="relative mx-auto w-full max-w-[520px] aspect-[1.05] hidden sm:block"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease }}
        >
          <div className="only-editorial">
            <div className="absolute inset-x-[8%] top-[10%] bottom-[4%] rounded-sm bg-bg-alt" />
          </div>
          <div className="only-pop">
            <div className="absolute inset-x-[6%] top-[8%] bottom-[2%] rounded-[2rem] bg-accent border-[2.5px] border-line shadow-[8px_8px_0_var(--line)] rotate-[-3deg]" />
          </div>
          <div className="only-persona">
            <Parallax mx={mx} my={my} depth={-12} className="absolute inset-0">
            <motion.div
              className="absolute inset-[2%] bg-accent"
              style={{ clipPath: STARBURST }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-[15%] bg-white" style={{ clipPath: STARBURST, transform: "rotate(9deg)" }} />
            <div className="absolute inset-[19%] bg-[#0a0a0a]" style={{ clipPath: STARBURST, transform: "rotate(4deg)" }} />
            </Parallax>
          </div>

          {phones.map((p) => (
            <Parallax key={p.alt} mx={mx} my={my} depth={p.depth} className={`absolute ${p.className}`}>
              <motion.div
                animate={{ y: [0, -p.float, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
              >
                {p.src === null ? (
                  <DemoPhone />
                ) : (
                <img
                  src={p.src}
                  alt={p.alt}
                  className="w-full rounded-[1.4rem] shadow-2xl ring-1 ring-black/10 [[data-theme=pop]_&]:border-[2.5px] [[data-theme=pop]_&]:border-line [[data-theme=pop]_&]:shadow-[6px_6px_0_var(--line)] [[data-theme=persona]_&]:rounded-none [[data-theme=persona]_&]:border-[3px] [[data-theme=persona]_&]:border-white [[data-theme=persona]_&]:shadow-[8px_8px_0_var(--accent)]"
                />
                )}
              </motion.div>
            </Parallax>
          ))}

          {/* Floating badges */}
          <motion.div
            className="card absolute left-0 bottom-[6%] z-30 px-4 py-3 flex items-center gap-3"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="heading text-2xl text-accent">500+</span>
            <span className="text-xs text-muted leading-tight">
              officers on the
              <br />
              NIS HR platform
            </span>
          </motion.div>
          <motion.div
            className="card absolute right-[2%] bottom-[14%] z-30 px-3 py-2 text-xs font-medium text-fg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          >
            Flutter · Angular · NestJS
          </motion.div>
        </motion.div>
      </div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted hover:text-accent transition-colors"
        aria-label="Scroll to About"
      >
        <motion.span className="block" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ArrowDown size={24} />
        </motion.span>
      </a>
    </section>
  );
}

export default HeroSection;
