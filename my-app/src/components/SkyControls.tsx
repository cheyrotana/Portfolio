import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Radio, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useSky, useSkyPick, useWeather, useWeatherPick } from "../hooks/interactive";
import { play } from "../lib/sound";
import { setSky, setWeather, WEATHER_KINDS, type Sky, type WeatherKind } from "../lib/weather";
import { KeyHints } from "./KeyHints";
import { WeatherIcon } from "./Weather";

// The sky & weather controller: a pause-menu style overlay (big tilted words on a red slab in the
// Persona theme) for picking the weather and day/night, or going back to live Phnom Penh. The
// terminal's `weather` and `sky` commands still do the same.

interface Item {
  id: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  pick: () => void;
}

function Column({ title, items, colIndex }: { title: string; items: Item[]; colIndex: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="ctl-col" aria-label={title}>
      <h3 className="ctl-col-title">{title}</h3>
      <ul className="ctl-list" role="radiogroup" aria-label={title}>
        {items.map((it, i) => (
          <motion.li
            key={it.id}
            initial={reduceMotion ? false : { opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.12 + colIndex * 0.08 + i * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={it.active}
              data-col={colIndex}
              className={`ctl-item ${it.active ? "is-active" : ""}`}
              onClick={it.pick}
              data-cursor="Select"
            >
              <span className="ctl-item-icon" aria-hidden="true">
                {it.icon}
              </span>
              <span className="ctl-item-label">{it.label}</span>
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

export function SkyControls({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const weather = useWeather();
  const sky = useSky();
  const weatherPick = useWeatherPick();
  const skyPick = useSkyPick();
  const isDay = sky === "day";

  const choose = (fn: () => void) => () => {
    fn();
    play("tick");
  };

  const weatherItems: Item[] = [
    {
      id: "live",
      label: "Live",
      icon: <Radio strokeWidth={2.4} />,
      active: weatherPick === null,
      pick: choose(() => setWeather(null)),
    },
    ...WEATHER_KINDS.map((k) => ({
      id: k.id,
      label: k.id === "storm" ? "Storm" : k.id === "clear" ? "Clear" : k.label,
      icon: <WeatherIcon kind={k.id as WeatherKind} isDay={isDay} />,
      active: weatherPick === k.id,
      pick: choose(() => setWeather(k.id)),
    })),
  ];

  const skyItems: Item[] = [
    { id: "live", label: "Live", icon: <Radio strokeWidth={2.4} />, active: skyPick === null, pick: choose(() => setSky(null)) },
    ...(["day", "night"] as Sky[]).map((s) => ({
      id: s,
      label: s === "day" ? "Day" : "Night",
      icon: <WeatherIcon kind="clear" isDay={s === "day"} />,
      active: skyPick === s,
      pick: choose(() => setSky(s)),
    })),
  ];

  // Start on the weather that's currently picked
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLButtonElement>('.ctl-item[data-col="0"].is-active')?.focus(),
    );
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Arrows move within a column, left/right jump between columns, Esc closes
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const current = document.activeElement as HTMLElement | null;
    const col = current?.dataset.col;
    if (col === undefined) return;
    const inCol = [...(panelRef.current?.querySelectorAll<HTMLButtonElement>(`.ctl-item[data-col="${col}"]`) ?? [])];
    const at = inCol.indexOf(current as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = inCol[(at + (e.key === "ArrowDown" ? 1 : -1) + inCol.length) % inCol.length];
      next?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const other = col === "0" ? "1" : "0";
      const target =
        panelRef.current?.querySelector<HTMLButtonElement>(`.ctl-item[data-col="${other}"].is-active`) ??
        panelRef.current?.querySelector<HTMLButtonElement>(`.ctl-item[data-col="${other}"]`);
      target?.focus();
    }
  };

  const status = weather
    ? `${weather.label}${weather.temp !== null ? ` · ${weather.temp}°C` : ""} · ${isDay ? "Day" : "Night"}`
    : `${isDay ? "Day" : "Night"}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ctl"
          role="dialog"
          aria-modal="true"
          aria-label="Sky and weather controls"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panelRef}
            className="ctl-panel"
            onKeyDown={onKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -120, rotate: -4 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 120, rotate: 3 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="ctl-slab" aria-hidden="true" />
            <span className="ctl-dots" aria-hidden="true" />

            <header className="ctl-head">
              <span className="ctl-kicker">Controls</span>
              <h2 className="ctl-title">Sky &amp; Weather</h2>
              <button type="button" className="ctl-close icon-btn" onClick={onClose} aria-label="Close" data-cursor="Close">
                <X size={18} />
              </button>
            </header>

            <div className="ctl-cols">
              <Column title="Weather" items={weatherItems} colIndex={0} />
              <Column title="Sky" items={skyItems} colIndex={1} />
            </div>

            <footer className="ctl-foot">
              <p className="ctl-now">
                <span className="ctl-now-tag">Now</span> {status}
                {weatherPick === null && skyPick === null ? " · live from Phnom Penh" : " · picked by you"}
              </p>
              <KeyHints />
              <p className="ctl-hint">
                Or type <code>weather storm</code> / <code>sky night</code> in the terminal
              </p>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
