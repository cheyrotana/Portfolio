// Retro theme: the portfolio as a 70s jazz record.
// - RetroTurntable: a record player in the corner. Each groove is a section (the playing one lights up),
//   clicking a groove jumps there, and the needle plays the music (bgm.ts): it rides the groove on screen while
//   the music plays and swings back to its rest when it stops.
// - RetroStripes: the sunset stripes between sections.
// - RetroEq / RetroSticker: an equaliser that moves with the music, and starburst stickers.
// Styles: styles/base.css (the shared pieces) and the section files in styles/.
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { bgmLevels, setBgm } from "../../lib/bgm";
import { NAV_SECTIONS } from "../../data/sections";
import { useBgmLive, useBgmOn, useThemeAttr } from "../../hooks/interactive";
import { rideProgress } from "../metro/metroRide";
import { play } from "../../lib/sound";

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

export function RetroTurntable() {
  const playing = useBgmOn(); // the setting (the keys)
  const live = useBgmLive(); // actually playing (the arm, the spin, the meters): a remembered "on" waits for a click
  const [track, setTrack] = useState(0); // 0 = lead-in (hero), 1–5 = the sections
  const [collapsed, setCollapsed] = useState(true); // always starts as the mini deck; opening it lasts for this visit only
  const [tucked, setTucked] = useState(false); // the mini deck slides away while scrolling down
  const armRef = useRef<SVGGElement>(null);
  const armTarget = useRef(REST);
  const armNow = useRef(REST);
  const armRaf = useRef(0);

  // The tonearm follows the music: while it plays, the needle rides the groove of the section on screen;
  // off, the arm swings back to its rest beside the record. It eases to where it should be (a frame loop only
  // while it moves; the scroll just moves the target).
  const moveArm = useCallback(() => {
    if (armRaf.current) return;
    let last = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000); // (a slow frame catches up instead of lagging)
      last = now;
      const want = armTarget.current;
      const next = still ? want : armNow.current + (want - armNow.current) * (1 - Math.exp(-dt * 7));
      armNow.current = Math.abs(want - next) < 0.05 ? want : next;
      armRef.current?.setAttribute("transform", `rotate(${armNow.current.toFixed(2)} ${PX} ${PY})`);
      armRaf.current = armNow.current === want ? 0 : requestAnimationFrame(step);
    };
    armRaf.current = requestAnimationFrame(step);
  }, []);

  const liveRef = useRef(live);
  useEffect(() => {
    liveRef.current = live;
    armTarget.current = live ? armAngle(radiusAt(pagePosition())) : REST;
    moveArm();
  }, [live, moveArm]);
  useEffect(
    () => () => {
      cancelAnimationFrame(armRaf.current);
      armRaf.current = 0; // (or the next mount's moves would think one is still running)
    },
    [],
  );

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
      if (liveRef.current) {
        armTarget.current = armAngle(radiusAt(p));
        moveArm();
      }
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
  }, [moveArm]);

  // While the needle is down, the music's levels drive CSS variables (--eq1…--eq6, --vu-l, --vu-r) that the
  // meters, the equalisers and the hero's rings read. They are written only on the elements that read them, only
  // while those are on screen, about 30 times a second, and only when a value changes: a custom property
  // changed on a big element (or <html>) makes the browser restyle everything inside it.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.music = live ? "on" : "off";
    const names = ["--eq1", "--eq2", "--eq3", "--eq4", "--eq5", "--eq6", "--vu-l", "--vu-r"];
    const READERS = ".retro-eq, .retro-vu, .retro-gate-rings"; // small elements only: never a whole section
    const seen = new Set<HTMLElement>(); // elements we've written to (to clean up)
    const visible = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) visible.add(el);
        else visible.delete(el);
      }),
    );
    const watched = new Set<Element>();
    const watch = () =>
      document.querySelectorAll<HTMLElement>(READERS).forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    const clear = () => seen.forEach((t) => names.forEach((n) => t.style.removeProperty(n)));
    if (!live) {
      io.disconnect();
      return () => delete root.dataset.music;
    }
    const bins = new Uint8Array(32);
    const bands = [[0, 0], [1, 1], [2, 3], [4, 6], [7, 11], [12, 20]];
    const last = new WeakMap<HTMLElement, string[]>();
    let raf = 0;
    let frame = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (frame++ % 60 === 0) watch(); // sections mount late
      if (frame % 2) return; // ~30 updates a second is plenty for a meter
      if (!visible.size || !bgmLevels(bins)) return;
      const v = bands.map(([a, b]) => {
        let sum = 0;
        for (let i = a; i <= b; i++) sum += bins[i];
        return Math.min(1, (sum / (b - a + 1) / 255) * 1.35);
      });
      v.push((v[0] + v[1]) / 2, (v[3] + v[4] + v[5]) / 3);
      const vals = v.map((x) => x.toFixed(2));
      for (const t of visible) {
        const prev = last.get(t) ?? [];
        vals.forEach((s, i) => {
          if (s !== prev[i]) t.style.setProperty(names[i], s); // unchanged: no restyle
        });
        last.set(t, vals);
        seen.add(t);
      }
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      clear();
      delete root.dataset.music;
    };
  }, [live]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  const needle = () => {
    play(playing ? "tick" : "pop");
    setBgm(!playing);
  };

  const section = track > 0 ? NAV_SECTIONS[track - 1] : null;
  const now = section ? section.label : "Home";

  return (
    <aside
      className={`retro-deck ${collapsed ? "is-collapsed" : ""} ${collapsed && tucked ? "is-tucked" : ""} ${live ? "is-playing" : ""}`}
      aria-label="Music player and sections"
    >
      {/* three layers: the wood, the record on its own (so its spin runs on the GPU, not the main thread:
          an animated <g> inside an SVG is repainted every frame) and the tonearm and meters on top */}
      <div className="retro-deck-stack">
      <svg className="retro-deck-svg" viewBox="0 0 240 200" aria-hidden="true">
        <rect x="2" y="2" width="236" height="196" rx="18" className="retro-deck-wood" />
      </svg>
      <svg
        className="retro-deck-record"
        viewBox={`${CX - R_EDGE - 2} ${CY - R_EDGE - 2} ${2 * (R_EDGE + 2)} ${2 * (R_EDGE + 2)}`}
        role="group"
        aria-label="Sections: each ring jumps to one"
      >
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
      </svg>
      <svg className="retro-deck-top" viewBox="0 0 240 200" aria-hidden="true">
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
      </div>

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

// The seam between two sections: a wavy ribbon of sunset stripes laid over the line where one section ends
// and the next begins, so the change of background happens under the ribbon. The ribbon is thicker than the
// waves are tall, so that line is always covered. Scrolling drifts the waves sideways (retro.css).
const WAVE_W = 2880; // four waves; the ribbon is drawn twice as wide as the screen and slides by one wave
const WAVE_H = 104;
const WAVE_PERIOD = 720;
const WAVE_AMP = 18;
const STRIPE = 15;
const STRIPES = 4;

function waveY(x: number, offset: number, phase: number) {
  return WAVE_H / 2 + offset + WAVE_AMP * Math.sin((2 * Math.PI * x) / WAVE_PERIOD + phase);
}

function wavePath(top: number, bottom: number, phase: number) {
  const xs: number[] = [];
  for (let x = 0; x <= WAVE_W; x += 24) xs.push(x);
  const f = (n: number) => n.toFixed(1);
  const upper = xs.map((x, i) => `${i ? "L" : "M"}${x} ${f(waveY(x, top, phase))}`).join("");
  const lower = [...xs].reverse().map((x) => `L${x} ${f(waveY(x, bottom, phase))}`).join("");
  return `${upper}${lower}Z`;
}

function edgePath(offset: number, phase: number) {
  let d = "";
  for (let x = 0; x <= WAVE_W; x += 24) d += `${x ? "L" : "M"}${x} ${waveY(x, offset, phase).toFixed(1)}`;
  return d;
}

const RIBBON = [false, true].map((flip) => {
  const phase = flip ? Math.PI : 0;
  const half = (STRIPE * STRIPES) / 2;
  const colors = ["var(--r-mustard)", "var(--r-orange)", "var(--r-rust)", "var(--r-brown)"];
  return {
    stripes: (flip ? [...colors].reverse() : colors).map((fill, i) => ({
      fill,
      d: wavePath(-half + i * STRIPE, -half + (i + 1) * STRIPE, phase),
    })),
    edges: [edgePath(-half, phase), edgePath(half, phase)],
  };
});

export function RetroStripes({ flip = false }: { flip?: boolean }) {
  const ribbon = RIBBON[flip ? 1 : 0];
  return (
    <div className="only-retro">
      <div className="retro-stripes" aria-hidden="true">
        <svg className="retro-wave" viewBox={`0 0 ${WAVE_W} ${WAVE_H}`} preserveAspectRatio="none">
          {ribbon.stripes.map((s) => (
            <path key={s.fill} d={s.d} fill={s.fill} />
          ))}
          {ribbon.edges.map((d) => (
            <path key={d} d={d} className="retro-wave-edge" />
          ))}
        </svg>
      </div>
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
    // The tuning knob reads --dial; set it on the knob only, not on <html> (that restyles the whole page).
    const knob = () => document.querySelector<HTMLElement>(".nav-settings");

    // Station positions are measured once (and again on resize / font load), not on every scroll frame:
    // measuring right after a style write forces a full layout each frame.
    let xsCache: number[] | null = null;
    let maxScroll = -1;
    const centres = () => {
      const box = dial.getBoundingClientRect();
      return [...dial.querySelectorAll<HTMLElement>(".nav-link")].map((l) => {
        const r = l.getBoundingClientRect();
        return r.left + r.width / 2 - box.left;
      });
    };
    const update = () => {
      raf = 0;
      if (maxScroll < 0) maxScroll = document.documentElement.scrollHeight - innerHeight;
      knob()?.style.setProperty("--dial", (maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0).toFixed(3));
      if (dial.offsetParent === null) return;
      if (!xsCache?.length) xsCache = centres();
      const xs = xsCache;
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
    const remeasure = () => {
      xsCache = null;
      maxScroll = -1;
      queue();
    };
    update();
    dial.addEventListener("pointerover", onOver);
    dial.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    // the page grows as sections and images load, so the scroll length is re-read now and then
    const grow = new ResizeObserver(remeasure);
    grow.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      grow.disconnect();
      dial.removeEventListener("pointerover", onOver);
      dial.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", remeasure);
      knob()?.style.removeProperty("--dial");
    };
  }, [theme]);

  return <span ref={ref} className="retro-needle" aria-hidden="true" />;
}
