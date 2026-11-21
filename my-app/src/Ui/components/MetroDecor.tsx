import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { places, profile } from "../data/profile";
import { projects, type Project } from "../data/projects";
import { openControls, showProject } from "../events";
import { useThemeAttr, useWeather } from "../hooks/interactive";
import { introDone, introTheme } from "../intro";
import { NAV_SECTIONS } from "../data/sections";
import { rideProgress } from "../metroRide";

// Metro theme: the portfolio as a transit line. Everything here renders only in that theme.
// - SplitFlap / MetroHero: a departure board that flips your name and status into place
// - MetroTrain: the navbar is the line map; a train rides it as you scroll between sections
// - MetroNextStop: the in-train "next stop" display between sections
// - MetroDoors: the opening — train doors slide apart to reveal the page

const TZ = "Asia/Phnom_Penh";
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&·";
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Letters on split-flap tiles. Each tile spins through random letters before landing, left to right. */
function SplitFlap({ text, start = true, delay = 0, size = "md" }: { text: string; start?: boolean; delay?: number; size?: "lg" | "md" | "sm" }) {
  const target = text.toUpperCase();
  const blank = target.replace(/./g, " ");
  const [shown, setShown] = useState(blank);
  const still = reduced(); // reduced motion: the letters are simply there

  useEffect(() => {
    if (!start || still) return;
    const t0 = performance.now() + delay;
    const id = window.setInterval(() => {
      const now = performance.now() - t0;
      let done = true;
      const next = [...target]
        .map((ch, i) => {
          if (ch === " ") return " ";
          const begins = i * 45;
          const lands = begins + 260 + (i % 3) * 70;
          if (now >= lands) return ch;
          done = false;
          if (now < begins) return " ";
          return FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
        })
        .join("");
      setShown(next);
      if (done) window.clearInterval(id);
    }, 70);
    return () => window.clearInterval(id);
  }, [start, still, target, delay]);

  const letters = still ? target : shown;
  // tiles are grouped by word so a long line only wraps between words
  const words: { start: number; len: number }[] = [];
  target.split(" ").reduce((at, w) => (words.push({ start: at, len: w.length }), at + w.length + 1), 0);
  return (
    <span className={`flap-row flap-${size}`}>
      <span className="sr-only">{text}</span>
      {words.map((w) => (
        <span key={w.start} className="flap-word" aria-hidden="true">
          {[...letters.slice(w.start, w.start + w.len)].map((ch, j) => (
            <span key={j} className="flap">
              <span key={ch} className="flap-char">
                {ch}
              </span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function usePhnomPenhTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
}

/** The Phnom Penh clock at the end of the Metro navbar's line display. */
export function MetroNavClock() {
  const time = usePhnomPenhTime();
  return (
    <span className="metro-nav-clock" title="Time in Phnom Penh">
      <span className="metro-nav-clock-city">Phnom Penh</span>
      <span className="metro-nav-clock-time">{time}</span>
    </span>
  );
}

const LINE_OF: Record<string, { code: string; name: string }> = {
  mobile: { code: "M", name: "Mobile line" },
  web: { code: "W", name: "Web line" },
  hardware: { code: "H", name: "Hardware line" },
  game: { code: "G", name: "Game line" },
};

function LineBadges({ project }: { project: Project }) {
  const lines = project.categories.filter((c) => c in LINE_OF);
  return (
    <span className="metro-lines">
      {lines.map((c) => (
        <span key={c} className="metro-line-badge" data-line={c} title={LINE_OF[c].name}>
          {LINE_OF[c].code}
          <span className="sr-only"> {LINE_OF[c].name}</span>
        </span>
      ))}
    </span>
  );
}

const BOARD = [
  { time: "Now", dest: profile.currently, platform: "4", status: "On time", tone: "go" },
  { time: "2026", dest: `Interned · ${places.intern.place}`, platform: "3", status: "Arrived", tone: "plain" },
  { time: "2024", dest: `Studying · ${places.study.place}`, platform: "2", status: "Boarding", tone: "wait" },
  { time: "Base", dest: profile.location, platform: "—", status: "Home", tone: "plain" },
];

/** The hero in the Metro theme: a departure board, and a platform card with the photo. */
export function MetroHero({ go, portrait }: { go: boolean; portrait: string }) {
  const time = usePhnomPenhTime();
  const weather = useWeather();
  const departures = projects.slice(0, 4);

  return (
    <div className="metro-hero relative mx-auto max-w-6xl w-full px-5 sm:px-8">
      {/* the first screen: the city (fixed behind the page) with the name plate over it */}
      <div className="metro-stage">
        <div className="metro-nameplate">
          <span className="metro-nameplate-line">
            <span className="metro-badge" aria-hidden="true">
              R
            </span>
            Rotana Central · Line 1
          </span>
          <h1 className="metro-board-name">
            <SplitFlap text={profile.name} start={go} size="lg" />
          </h1>
          <p className="metro-board-role">
            <SplitFlap text={profile.role} start={go} delay={500} size="sm" />
          </p>
          <div className="metro-platform-actions">
            <a href="#work" className="btn btn-primary">
              Board the work line <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#contact" className="btn btn-ghost metro-nameplate-ghost">
              Get in touch
            </a>
          </div>
        </div>
      </div>

      <div className="metro-hero-detail">
        <div className="metro-board">
          <div className="metro-board-head">
            <span className="metro-board-title">Departures</span>
            <button type="button" className="metro-board-clock" onClick={openControls} title="Sky & weather controls (Alt+W)">
              <span className="metro-live-dot" aria-hidden="true" />
              Phnom Penh {time}
              {weather && (
                <span className="metro-board-weather">
                  {weather.temp !== null && ` · ${weather.temp}°`} {weather.label}
                </span>
              )}
            </button>
          </div>
  
          <table className="metro-board-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Destination</th>
                <th scope="col">Plat.</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {BOARD.map((row) => (
                <tr key={row.time}>
                  <td className="metro-board-time">{row.time}</td>
                  <td>{row.dest}</td>
                  <td>{row.platform}</td>
                  <td className={`metro-status is-${row.tone}`}>
                    <SplitFlap text={row.status} start={go} delay={900} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
  
          <p className="metro-board-sub">Next departures · tap one to board</p>
          <ul className="metro-departures">
            {departures.map((p) => (
              <li key={p.id}>
                <button type="button" className="metro-departure" onClick={() => showProject(p.id)} data-cursor="Board">
                  <span className="metro-board-time">{p.year}</span>
                  <span className="metro-departure-name">
                    {p.title}
                    <span className="metro-departure-client">{p.client}</span>
                  </span>
                  <LineBadges project={p} />
                  <span className="metro-departure-go">
                    Board <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
  
        <aside className="metro-platform">
          <div className="metro-platform-photo">
            <img src={portrait} alt={`${profile.name}, standing among temple ruins`} width={853} height={1280} fetchPriority="high" />
            <span className="metro-platform-pill">
              <span className="metro-badge" aria-hidden="true">4</span>
              Platform 4&nbsp;·&nbsp;Mobile &amp; web
            </span>
          </div>
          <p className="metro-platform-intro">
            I build Flutter apps, Angular dashboards and the NestJS APIs behind them — right now on the CamCyber
            Digital Tech Team, for government platforms like HRM.
          </p>
        </aside>
      </div>
    </div>
  );
}

const NEXT_STOP_NOTE: Record<string, string> = {
  about: "Who I am, where I study and what I'm working on",
  journey: "Ride the route from CADT to CamCyber",
  skills: "The tools I build with",
  work: "Selected work · change here for case studies",
  contact: "Terminus · all messages welcome",
};

/** The in-train "next stop" display, between two sections. */
export function MetroNextStop({ to }: { to: string }) {
  const label = NAV_SECTIONS.find((s) => s.id === to)?.label ?? to;
  const note = NEXT_STOP_NOTE[to] ?? "";
  const ticker = `Next stop: ${label} · ${note} · Please mind the gap · `;
  return (
    <div className="only-metro">
      <a href={`#${to}`} className="metro-next" aria-label={`Next stop: ${label}`}>
        <span className="metro-next-dot" aria-hidden="true" />
        <span className="metro-next-text">
          <span className="metro-next-label">Next stop</span>
          <span className="metro-next-name">{label}</span>
        </span>
        <span className="metro-next-led" aria-hidden="true">
          <span className="metro-next-ticker">
            <span>{ticker}</span>
            <span>{ticker}</span>
          </span>
        </span>
      </a>
    </div>
  );
}

/**
 * The train on the navbar's line map. It sits between two stations according to how far you've
 * scrolled from one section to the next, and marks the stations already passed.
 */
export function MetroTrain() {
  const ref = useRef<HTMLSpanElement>(null);
  const theme = useThemeAttr();

  useEffect(() => {
    if (theme !== "metro") return;
    const train = ref.current;
    const line = train?.closest<HTMLElement>(".nav-links");
    if (!train || !line) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const links = [...line.querySelectorAll<HTMLElement>(".nav-link")];
      if (!links.length || line.offsetParent === null) return;
      const lineBox = line.getBoundingClientRect();
      const xs = links.map((l) => {
        const r = l.getBoundingClientRect();
        return r.left + r.width / 2 - lineBox.left;
      });
      const stations = [14, ...xs]; // "home" is the terminus at the start of the line
      // the same place on the line as the 3D city's train
      const { i, f } = rideProgress();
      const next = Math.min(i + 1, stations.length - 1);
      const x = stations[i] + (stations[next] - stations[i]) * f;

      train.style.transform = `translateX(${x.toFixed(1)}px)`;
      line.style.setProperty("--m-progress", `${x.toFixed(1)}px`);
      links.forEach((l, k) => l.toggleAttribute("data-passed", xs[k] <= x + 2));
    };

    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [theme]);

  return (
    <span ref={ref} className="metro-train" aria-hidden="true">
      <span className="metro-train-windows" />
    </span>
  );
}

/** The Metro opening: closed train doors with the line's sign, sliding apart to reveal the page. */
export function MetroDoors() {
  const [show, setShow] = useState(() => introTheme() === "metro");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) return;
    let opened = false;
    const timers: number[] = [];
    const openDoors = (e?: Event) => {
      if (e?.type === "keydown") e.preventDefault(); // the key that skips shouldn't also scroll
      if (opened) return;
      opened = true;
      setOpen(true);
      introDone();
      timers.push(window.setTimeout(() => setShow(false), 700));
    };
    timers.push(window.setTimeout(() => openDoors(), 900));
    window.addEventListener("pointerdown", openDoors);
    window.addEventListener("keydown", openDoors);
    document.documentElement.style.overflow = "hidden";
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("pointerdown", openDoors);
      window.removeEventListener("keydown", openDoors);
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className={`metro-doors ${open ? "is-open" : ""}`} aria-hidden="true">
      <div className="metro-door metro-door-l">
        <span className="metro-door-window" />
      </div>
      <div className="metro-door metro-door-r">
        <span className="metro-door-window" />
      </div>
      <div className="metro-doors-sign">
        <span className="metro-badge">R</span>
        <span>
          Rotana Line <b>· Doors opening</b>
        </span>
      </div>
    </div>
  );
}
