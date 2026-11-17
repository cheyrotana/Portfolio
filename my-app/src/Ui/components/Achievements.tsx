import { AnimatePresence, motion } from "framer-motion";
import { Lock, RotateCcw, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, onUnlock, resetAchievements, type Achievement } from "../achievements";
import { useUnlocked } from "../hooks/interactive";

// ── Toasts ──────────────────────────────────────────────────────────────────

interface Toast {
  key: number;
  achievement: Achievement;
  finale: boolean;
}

function Confetti() {
  const colors = ["var(--accent)", "#facc15", "#22c55e", "#3b82f6", "#f472b6", "#ffffff"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 w-2 h-3"
          style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], borderRadius: i % 3 ? 2 : 999 }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", rotate: 720 + i * 20, opacity: [1, 1, 0.6] }}
          transition={{ duration: 2.4 + (i % 5) * 0.35, delay: (i % 10) * 0.08, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function AchievementToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [party, setParty] = useState(0);
  const counter = useRef(0);

  useEffect(
    () =>
      onUnlock((achievement, finale) => {
        const key = ++counter.current;
        setToasts((t) => [...t.slice(-2), { key, achievement, finale }]);
        window.setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), finale ? 7000 : 4200);
        if (finale) setParty((p) => p + 1);
      }),
    [],
  );

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[110] flex flex-col items-end gap-2 pointer-events-none" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.key}
              layout
              className="achievement-toast card pointer-events-auto flex items-center gap-3 px-4 py-3 max-w-[320px]"
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              <span className="text-3xl leading-none">{t.achievement.emoji}</span>
              <span>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-accent">
                  Achievement unlocked
                </span>
                <span className="block font-semibold text-fg">{t.achievement.title}</span>
                <span className="block text-xs text-muted">
                  {t.finale ? "That's all of them — you're officially my favourite visitor! 🏆" : t.achievement.description}
                </span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>{party > 0 && <Confetti key={party} />}</AnimatePresence>
    </>
  );
}

// ── Trophy button + panel ───────────────────────────────────────────────────

export function TrophyButton({ open, onOpenChange, bare = false }: { open: boolean; onOpenChange: (open: boolean) => void; bare?: boolean }) {
  const unlocked = useUnlocked();
  const ref = useRef<HTMLDivElement>(null);
  const total = ACHIEVEMENTS.length;
  const done = unlocked.length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`btn btn-ghost !px-3 !py-2 text-sm ${bare ? "!hidden" : ""}`}
        tabIndex={bare ? -1 : undefined}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={`Achievements: ${done} of ${total} unlocked`}
        data-cursor="Trophies"
      >
        <Trophy size={16} className={done === total ? "text-accent" : ""} />
        <span className="font-mono text-xs hidden sm:inline">
          {done}/{total}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="card absolute right-0 mt-3 w-[min(92vw,340px)] p-3 z-50"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-xs uppercase tracking-widest text-muted">Achievements</p>
              <button type="button" className="text-muted hover:text-fg" onClick={() => onOpenChange(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="h-1.5 mx-1 mb-3 rounded-full bg-line/40 overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={false}
                animate={{ width: `${(done / total) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>
            <ul className="max-h-[55vh] overflow-y-auto space-y-1">
              {ACHIEVEMENTS.map((a) => {
                const got = unlocked.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)] ${got ? "bg-accent/10" : "opacity-60"}`}
                  >
                    <span className={`text-2xl leading-none ${got ? "" : "grayscale"}`}>{got ? a.emoji : "❔"}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-fg">{a.title}</span>
                      <span className="block text-xs text-muted">{got ? a.description : a.hint}</span>
                    </span>
                    {!got && <Lock size={14} className="text-muted flex-shrink-0" />}
                  </li>
                );
              })}
            </ul>
            {done > 0 && (
              <button
                type="button"
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-muted hover:text-fg py-1.5"
                onClick={resetAchievements}
              >
                <RotateCcw size={12} /> Reset progress
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
