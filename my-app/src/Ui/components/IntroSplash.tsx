import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { profile } from "../data/profile";
// import { audioReady, play } from "../sound";
import { introDone, introTheme } from "../intro";
import { Ransom } from "./Ransom";

// Persona theme only: a quick title card every time the site loads (refreshes too) — a burst, the
// name in cut-out letters, then a red slash wipes it away. Any click or key skips it.

const BURST = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 30 + ((i * 29) % 12);
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

export function IntroSplash() {
  const [show, setShow] = useState(() => introTheme() === "persona");

  useEffect(() => {
    if (!show) return;
    // Sound effects are switched off for now. Browsers keep sound off on page load until the visitor
    // clicks or presses a key, so the card could only play them when that's already allowed; a click
    // or key to skip unlocks the exit sound. To bring them back, uncomment these lines and the import.
    // const live = audioReady();
    // if (live) play("intro", { force: true });
    const hide = (e?: Event) => {
      // if (e || live) play("introExit", { force: true });
      // the key that skips the card shouldn't also scroll the page (Space, arrows, Page Down…)
      if (e?.type === "keydown") e.preventDefault();
      setShow(false);
      introDone();
    };
    const id = window.setTimeout(() => hide(), 2100);
    window.addEventListener("pointerdown", hide);
    window.addEventListener("keydown", hide);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", hide);
      window.removeEventListener("keydown", hide);
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="p5-intro"
          aria-hidden="true"
          initial={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          exit={{ clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 88% 100%)" }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.svg
            className="p5-intro-burst"
            viewBox="0 0 100 100"
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 1.4, 0.4, 1] }}
          >
            <polygon points={BURST} />
          </motion.svg>
          <motion.div
            className="p5-intro-slash"
            initial={{ x: "-120%" }}
            animate={{ x: "0%" }}
            transition={{ delay: 0.15, duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
          />
          <div className="p5-intro-title heading">
            <Ransom text={profile.name} seed={3} />
          </div>
          <motion.p
            className="p5-intro-role"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.35 }}
          >
            {profile.role}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
