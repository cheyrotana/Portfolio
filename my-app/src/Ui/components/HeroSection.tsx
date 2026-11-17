import { motion } from "framer-motion";
import { openControls } from "../events";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import portrait from "../../assets/me/ta-prohm.jpg";
import { profile, socials } from "../data/profile";
import { useWeather } from "../hooks/interactive";
import { P5Sky, P5Skyline, P5Slab } from "./PersonaDecor";
import { P5Clouds, WeatherIcon } from "./Weather";
import { Ransom } from "./Ransom";

const ease = [0.22, 1, 0.36, 1] as const;
const TZ = "Asia/Phnom_Penh";

// Spiky burst behind the photo (Persona theme): alternating outer and uneven inner points.
const BURST = Array.from({ length: 32 }, (_, i) => {
  const a = (i / 32) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 33 + ((i * 37) % 10) * 0.9;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function partOfDay(hour: number) {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 20) return "Evening";
  return "Night";
}

// Calendar corner (Persona theme): today's date and time in Phnom Penh.
function DateWidget() {
  const now = useNow(30_000);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o }).format(now);
  const date = fmt({ month: "numeric", day: "numeric" });
  const weekday = fmt({ weekday: "short" });
  const time = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const hour = Number(fmt({ hour: "numeric", hourCycle: "h23" }));
  const weather = useWeather();

  return (
    <div
      className="p5-date"
      role="button"
      tabIndex={0}
      onClick={openControls}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openControls())}
      data-cursor="Weather"
      title="Sky & weather controls (Alt+W)"
      aria-label={`${weekday} ${date}, ${time} in Phnom Penh${weather ? `, ${weather.label}` : ""}. Open the sky and weather controls`}
    >
      <span className="p5-date-top">
        <span className="p5-date-day">{date}</span>
        <span className="p5-date-side">
          <span className="p5-date-weekday">{weekday}</span>
          {weather && (
            <span className="p5-date-weather" title={weather.live ? "Live weather in Phnom Penh" : "Weather you picked"}>
              <WeatherIcon kind={weather.kind} isDay={weather.isDay} className="p5-date-weather-icon" />
              {weather.temp !== null && <span className="p5-date-temp">{weather.temp}°</span>}
            </span>
          )}
        </span>
      </span>
      <span className="p5-date-meta">
        {partOfDay(hour)} · Phnom Penh {time}
        {weather ? ` · ${weather.label}` : ""}
      </span>
    </div>
  );
}

const status = [
  { persona: "LV.4", plain: "Studying", value: profile.education },
  { persona: "Now", plain: "Now", value: profile.currently },
  { persona: "Base", plain: "Based in", value: profile.location },
];

function HeroSection() {
  return (
    <section id="home" className="hero relative min-h-screen flex items-center overflow-hidden pt-28 pb-24">
      {/* Backgrounds */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="bg-decor absolute inset-0 not-persona-block" />
        <P5Slab variant="full" />
        <P5Sky />
        <P5Clouds count={6} from={2} to={70} seed={1} />
        <P5Skyline />
      </div>
      <div className="only-persona">
        <DateWidget />
      </div>

      <div className="relative mx-auto max-w-6xl w-full px-5 sm:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-12 items-center">
        {/* Photo */}
        <motion.figure
          className="hero-photo-wrap relative mx-auto w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[420px]"
          initial={{ opacity: 0, scale: 0.92, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="only-persona">
            <svg className="p5-burst" viewBox="0 0 100 100" aria-hidden="true">
              <polygon points={BURST} />
            </svg>
          </div>
          <div className="hero-photo">
            <span className="hero-photo-shadow" aria-hidden="true" />
            <span className="hero-photo-rim" aria-hidden="true" />
            <img
              src={portrait}
              alt={`${profile.name} among the ruins of Ta Prohm temple`}
              className="hero-photo-img"
              width={853}
              height={1280}
              fetchPriority="high"
            />
          </div>
          <figcaption className="hero-photo-caption">Ta Prohm, Siem Reap</figcaption>
        </motion.figure>

        {/* Who I am */}
        <div className="hero-text relative">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
          >
            Hello, I'm
          </motion.p>

          <motion.h1
            className="heading hero-name mt-4 text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[5.6rem] text-fg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease }}
          >
            <Ransom text="Chey" seed={1} className="block" />
            <Ransom text="Rotana" seed={4} className="block hero-name-last" />
          </motion.h1>

          <motion.p
            className="hero-role mt-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease }}
          >
            <span>{profile.role}</span>
          </motion.p>

          <motion.p
            className="mt-5 max-w-xl text-base sm:text-lg text-muted leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6, ease }}
          >
            I build Flutter apps, Angular dashboards and the NestJS APIs behind them — right now for the government HR
            platform at MLMUPC.
          </motion.p>

          <motion.dl
            className="status-panel mt-7 max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease }}
          >
            {status.map((row) => (
              <div key={row.plain} className="status-row">
                <dt className="status-key">
                  <span className="only-persona">{row.persona}</span>
                  <span className="not-persona">{row.plain}</span>
                </dt>
                <dd className="status-value">{row.value}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.nav
            className="hero-menu mt-8 flex flex-wrap items-center gap-3"
            aria-label="Start here"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease }}
          >
            <a href="#work" className="btn btn-primary hero-menu-item">
              See my work <ArrowRight size={16} className="hero-menu-arrow" />
            </a>
            <a href="#contact" className="btn btn-ghost hero-menu-item">
              Get in touch
            </a>
            <span className="flex gap-2 ml-1">
              {socials.map(({ name, url, icon: Icon }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={name}>
                  <Icon size={18} />
                </a>
              ))}
            </span>
          </motion.nav>
        </div>
      </div>

      <a href="#about" className="hero-scroll absolute bottom-6 left-1/2 -translate-x-1/2 z-10 [[data-theme=persona]_&]:bottom-14" aria-label="Scroll to About">
        <span className="not-persona">
          <motion.span className="block" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ArrowDown size={24} />
          </motion.span>
        </span>
        <span className="only-persona">
          <span className="p5-scroll-tag">▼ Scroll</span>
        </span>
      </a>
    </section>
  );
}

export default HeroSection;
