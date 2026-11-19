// Retro theme: the portfolio as a 70s jazz record.
// - RetroTurntable: a record player in the corner. Each groove is a section; the tonearm follows the scroll,
//   clicking a groove jumps there, and dropping the needle plays the background music (bgm.ts).
// - RetroStripes: the sunset stripes between sections.
// - RetroCredits / RetroBand: About as the back of the sleeve, Skills as the band.
// - RetroEq / RetroSticker: an equaliser that moves with the music, and starburst stickers.
// Styles: src/retro.css.
import { ChevronDown, ChevronUp, Drum, Guitar, Mic, Piano, Wrench, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { bgmLevels, setBgm } from "../bgm";
import { NAV_SECTIONS } from "../data/sections";
import { profile, skillGroups } from "../data/profile";
import { useBgmOn, useThemeAttr } from "../hooks/interactive";
import { rideProgress } from "../metroRide";
import { play } from "../sound";

// ── The turntable ──────────────────────────────────────────────────────────────────────────────

// Record geometry (SVG units): centre, the lead-in edge, and five grooves from the edge inwards.
const CX = 100;
const CY = 100;
const R_EDGE = 88;
const R_FIRST = 82;
const BAND = 9.6;
// The tonearm pivots at (PX, PY) and is ARM long; its angle puts the needle at a given radius.
const PX = 212;
const PY = 30;
const ARM = 150;
const REST = 4; // degrees: parked beside the record

function armAngle(r: number) {
  const dx = PX - CX;
  const dy = PY - CY;
  const k = (r * r - dx * dx - dy * dy - ARM * ARM) / (2 * ARM);
  const R = Math.hypot(dx, dy);
  const phi = Math.atan2(-dy, dx);
  return ((Math.asin(Math.min(1, -k / R)) - phi) * 180) / Math.PI;
}

// Where the page is, as a position on the record: 0–1 is the hero (lead-in), 1–2 the first section…
function pagePosition() {
  const ids = ["home", ...NAV_SECTIONS.map((s) => s.id)];
  const tops = ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? 0);
  const end = document.documentElement.scrollHeight - window.scrollY;
  const at = window.innerHeight * 0.5;
  for (let i = ids.length - 1; i >= 0; i--) {
    if (tops[i] <= at) {
      const next = i + 1 < ids.length ? tops[i + 1] : end;
      const span = Math.max(1, next - tops[i]);
      return i + Math.min(1, (at - tops[i]) / span);
    }
  }
  return 0;
}

const radiusAt = (p: number) => (p < 1 ? R_EDGE - (R_EDGE - R_FIRST) * p : R_FIRST - BAND * Math.min(5, p - 1));

const COLLAPSE_KEY = "portfolio-retro-deck";

function initiallyCollapsed() {
  try {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved) return saved === "1";
  } catch {
    // storage blocked: fall back to the screen size
  }
  // small and medium screens start with the mini deck, so it doesn't cover the content
  return window.matchMedia("(max-width: 1439px)").matches;
}

export function RetroTurntable() {
  const playing = useBgmOn();
  const [track, setTrack] = useState(0); // 0 = lead-in (hero), 1–5 = the sections
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [tucked, setTucked] = useState(false); // the mini deck slides away while scrolling down
  const armRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 4) setTucked(y > lastY && y > 200);
      lastY = y;
      const p = pagePosition();
      setTrack(Math.min(5, Math.floor(p)));
      armRef.current?.setAttribute("transform", `rotate(${armAngle(radiusAt(p)).toFixed(2)} ${PX} ${PY})`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // While the needle is down, the music's levels drive CSS variables (--eq1…--eq6, --vu-l, --vu-r) that the
  // meters, the equalisers and the sunbursts read.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.music = playing ? "on" : "off";
    const names = ["--eq1", "--eq2", "--eq3", "--eq4", "--eq5", "--eq6", "--vu-l", "--vu-r"];
    const clear = () => names.forEach((n) => root.style.removeProperty(n));
    if (!playing) {
      clear();
      return () => delete root.dataset.music;
    }
    const bins = new Uint8Array(32);
    const bands = [[0, 0], [1, 1], [2, 3], [4, 6], [7, 11], [12, 20]];
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!bgmLevels(bins)) return;
      const v = bands.map(([a, b]) => {
        let sum = 0;
        for (let i = a; i <= b; i++) sum += bins[i];
        return Math.min(1, (sum / (b - a + 1) / 255) * 1.35);
      });
      v.forEach((x, i) => root.style.setProperty(names[i], x.toFixed(3)));
      root.style.setProperty("--vu-l", ((v[0] + v[1]) / 2).toFixed(3));
      root.style.setProperty("--vu-r", ((v[3] + v[4] + v[5]) / 3).toFixed(3));
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      clear();
      delete root.dataset.music;
    };
  }, [playing]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // storage blocked: remembered for this visit only
    }
  };

  const needle = () => {
    play(playing ? "tick" : "pop");
    setBgm(!playing);
  };

  const section = track > 0 ? NAV_SECTIONS[track - 1] : null;
  const now = section ? section.label : "Home";

  return (
    <aside
      className={`retro-deck ${collapsed ? "is-collapsed" : ""} ${collapsed && tucked ? "is-tucked" : ""} ${playing ? "is-playing" : ""}`}
      aria-label="Music player and sections"
    >
      <svg
        className="retro-deck-svg"
        viewBox="0 0 240 200"
        role="group" aria-label="Sections: each ring jumps to one">
        <rect x="2" y="2" width="236" height="196" rx="18" className="retro-deck-wood" />
        <g className="retro-deck-record">
          <circle cx={CX} cy={CY} r={R_EDGE + 2} className="retro-deck-vinyl" />
          {NAV_SECTIONS.map((s, i) => {
            const outer = R_FIRST - BAND * i;
            const mid = outer - BAND / 2;
            return (
              <a key={s.id} href={`#${s.id}`} aria-label={`Go to ${s.label}`}>
                <circle
                  cx={CX}
                  cy={CY}
                  r={mid}
                  className={`retro-groove ${track === i + 1 ? "is-current" : ""}`}
                  strokeWidth={BAND - 1.2}
                />
              </a>
            );
          })}
          <path d="M 40 52 A 76 76 0 0 1 70 30" className="retro-deck-shine" />
          <circle cx={CX} cy={CY} r={30} className="retro-deck-label" />
          <text x={CX} y={CY - 8} className="retro-deck-label-name">
            Chey Rotana
          </text>
          <text x={CX} y={CY + 16} className="retro-deck-label-side">
            Portfolio
          </text>
          <circle cx={CX} cy={CY} r={2.6} className="retro-deck-hole" />
        </g>
        <circle cx={PX} cy={PY} r={11} className="retro-deck-pivot" />
        <g ref={armRef} transform={`rotate(${REST} ${PX} ${PY})`} className="retro-deck-arm">
          <rect x={PX - 3} y={PY} width={6} height={ARM - 14} rx={3} className="retro-deck-arm-bar" />
          <rect x={PX - 8} y={PY + ARM - 20} width={16} height={22} rx={3} className="retro-deck-head" />
        </g>
        <g className="retro-vu" aria-hidden="true">
          <rect x={210} y={74} width={9} height={84} rx={2} className="retro-vu-slot" />
          <rect x={223} y={74} width={9} height={84} rx={2} className="retro-vu-slot" />
          <rect x={211.5} y={75.5} width={6} height={81} rx={1} className="retro-vu-bar retro-vu-l" />
          <rect x={224.5} y={75.5} width={6} height={81} rx={1} className="retro-vu-bar retro-vu-r" />
        </g>
      </svg>

      <div className="retro-deck-bar">
        <p className="retro-deck-now" aria-live="polite">
          <span className="retro-cond">{playing ? "Music on · now at" : "Now at"}</span>
          <b>{now}</b>
        </p>
        <button type="button" className="retro-deck-btn" onClick={needle} aria-pressed={playing}>
          {playing ? "Pause music" : "Play music"}
        </button>
      </div>

      <button
        type="button"
        className="retro-deck-fold"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Open the record player" : "Fold the record player away"}
        title={collapsed ? "Open the record player" : "Fold away"}
      >
        {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </aside>
  );
}

export function RetroStripes({ flip = false }: { flip?: boolean }) {
  return (
    <div className="only-retro">
      <div className={`retro-stripes ${flip ? "retro-stripes-flip" : ""}`} aria-hidden="true" />
    </div>
  );
}

// ── Small pieces ───────────────────────────────────────────────────────────────────────────────

/** Six bars that jump with the music (CSS variables set by the turntable); flat while it is quiet. */
export function RetroEq({ className = "" }: { className?: string }) {
  return (
    <span className={`retro-eq ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <i key={i} />
      ))}
    </span>
  );
}

/** A starburst price-sticker. */
export function RetroSticker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`retro-sticker ${className}`}>
      <span>{children}</span>
    </span>
  );
}

// ── About: the back of the sleeve ─────────────────────────────────────────────────────────────

const credits = [
  { k: "Based in", v: profile.location },
  { k: "Studying", v: `${profile.education} · ${profile.year}` },
  { k: "Currently", v: profile.currently },
  { k: "Focus", v: "Mobile apps, dashboards and the APIs behind them" },
];

export function RetroCredits() {
  return (
    <div className="retro-back">
      <h3 className="retro-back-title">Quick facts</h3>
      <dl className="retro-credits">
        {credits.map((c) => (
          <div key={c.k}>
            <dt className="retro-cond">{c.k}</dt>
            <dd>{c.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Skills: the band ─────────────────────────────────────────────────────────────────────────

const ROLES: Record<string, { role: string; icon: LucideIcon }> = {
  Mobile: { role: "Apps", icon: Mic },
  Frontend: { role: "Web", icon: Piano },
  "Backend & Data": { role: "APIs & data", icon: Drum },
  "Hardware & Games": { role: "Devices & games", icon: Guitar },
  Tools: { role: "Everyday tools", icon: Wrench },
};

export function RetroBand() {
  const playing = useBgmOn();
  return (
    <div className="retro-band">
      <div className="retro-band-stage">
        <RetroEq className="retro-band-eq" />
        <p className="retro-band-status">
          <span className="retro-cond">{playing ? "Music on" : "Music off"}</span>
          {playing ? "The bars move with the music." : "Play some music while you look around."}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            play(playing ? "tick" : "pop");
            setBgm(!playing);
          }}
          aria-pressed={playing}
        >
          {playing ? "Pause music" : "Play music"}
        </button>
      </div>
      <ul className="retro-band-grid">
        {skillGroups.map((g, i) => {
          const r = ROLES[g.title] ?? { role: "Skills", icon: Mic };
          const Icon = r.icon;
          return (
            <li key={g.title} className="retro-player" style={{ "--d": `${i * 0.12}s` } as CSSProperties}>
              <span className="retro-player-icon" aria-hidden="true">
                <Icon size={26} strokeWidth={2.2} />
              </span>
              <p className="retro-cond retro-player-role">{r.role}</p>
              <h3 className="retro-player-name">{g.title}</h3>
              <p className="retro-player-blurb">{g.blurb}</p>
              <p className="retro-player-skills">
                {g.skills.map(({ name, icon: SkillIcon }) => (
                  <span key={name}>
                    <SkillIcon size={14} aria-hidden="true" />
                    {name}
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Retro navbar: the needle on the radio dial. It glides between the stations (section links) as the
 * page scrolls, jumps to a station you hover, ticks softly when it reaches a new one, and the tuning
 * knob (the settings button) turns with the page. Lives inside .nav-links; styles: .retro-needle.
 */
export function RetroNeedle() {
  const ref = useRef<HTMLSpanElement>(null);
  const theme = useThemeAttr();

  useEffect(() => {
    if (theme !== "retro") return;
    const needle = ref.current;
    const dial = needle?.closest<HTMLElement>(".nav-links");
    if (!needle || !dial) return;
    let raf = 0;
    let hoverX: number | null = null;
    let station = -1;

    const centres = () => {
      const box = dial.getBoundingClientRect();
      return [...dial.querySelectorAll<HTMLElement>(".nav-link")].map((l) => {
        const r = l.getBoundingClientRect();
        return r.left + r.width / 2 - box.left;
      });
    };
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      document.documentElement.style.setProperty("--dial", (max > 0 ? scrollY / max : 0).toFixed(3));
      if (dial.offsetParent === null) return;
      const xs = centres();
      if (!xs.length) return;
      const stations = [10, ...xs]; // before About: the start of the dial
      const { i, f } = rideProgress();
      const next = Math.min(i + 1, stations.length - 1);
      const x = hoverX ?? stations[i] + (stations[next] - stations[i]) * f;
      needle.style.transform = `translateX(${x.toFixed(1)}px)`;
      const near = Math.round(i + f);
      if (hoverX === null && near !== station) {
        if (station !== -1 && near > 0) play("tick");
        station = near;
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onOver = (e: PointerEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLElement>(".nav-link");
      if (!link) return;
      const box = dial.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      hoverX = r.left + r.width / 2 - box.left;
      dial.classList.add("is-tuning");
      queue();
    };
    const onLeave = () => {
      hoverX = null;
      dial.classList.remove("is-tuning");
      queue();
    };
    update();
    dial.addEventListener("pointerover", onOver);
    dial.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      dial.removeEventListener("pointerover", onOver);
      dial.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      document.documentElement.style.removeProperty("--dial");
    };
  }, [theme]);

  return <span ref={ref} className="retro-needle" aria-hidden="true" />;
}
