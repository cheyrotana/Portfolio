import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { profile } from "../data/profile";
import { Ransom } from "./Ransom";

const KEY = "portfolio-intro-seen";

// Persona theme only: a quick title card on the first visit of a session — a burst, the name in
// cut-out letters, then a red slash wipes it away. Any click or key skips it.
function shouldShow() {
  if (document.documentElement.getAttribute("data-theme") !== "persona") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return !sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
}

const BURST = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 30 + ((i * 29) % 12);
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

export function IntroSplash() {
  const [show, setShow] = useState(shouldShow);

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    const hide = () => setShow(false);
    const id = window.setTimeout(hide, 2100);
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
