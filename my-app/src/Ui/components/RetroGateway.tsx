// Retro theme, the hero (#home): a giant record with my name on the label, which turns into a 70s sunset.
// The move plays on its own (about 2.5 s) once you scroll, swipe or press a key, so it's equally smooth
// however you scroll; the page holds still while it plays. Scrolling up at the top of the page plays it
// backwards. What happens:
//   1. the record's grooves split into five rings;
//   2. into the grooves: the rings warm to sunset colours and sweep out past the edges of the screen
//      while the sky warms in behind them;
//   3. the label sinks to the horizon and grows into the sun; the striped hills rise over it;
//   4. my name and a few highlights come in, the navbar drops in from above and the corner record
//      player fades up. (My photo hangs in About: RetroPolaroid.)
// "Play music" (or clicking the record) lowers the tonearm and starts the background music.
// Two layers: .retro-gate-bg (sky, sun, hero text, photo) sits under the corner player, and
// .retro-gate-stage (record, rings, label) above it, so the label can land on the player.
// While the record is showing, <html> gets data-gate="in" (the navbar and the player stay put) and
// --gate-dock / --gate-nav (0 → 1: the corner player's label fades in and the navbar drops in at the end).
// Styles: .retro-gate* and .retro-hero* in src/retro.css.
import { ArrowDown, ChevronsRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { setBgm } from "../bgm";
import { showProject } from "../events";
import { NAV_SECTIONS } from "../data/sections";
import { profile, socials } from "../data/profile";
import { projects } from "../data/projects";
import { useBgmOn } from "../hooks/interactive";
import { play } from "../sound";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progress of p through the window [from, from + span], 0 → 1. */
const seg = (p: number, from: number, span: number) => clamp01((p - from) / span);

const LABEL = 0.46; // label diameter, as a share of the record's
const BAND = (0.5 - LABEL / 2) / NAV_SECTIONS.length; // ring width, as a share of the record's diameter
const END = 0.86; // the move is complete here (the timings below were laid out on a 0–1 scale)
const DURATION = 2300; // ms for the whole move
const SPINUP = 700; // ms for the record to get up to speed before it splits, like a turntable starting
const RPM_DEG = 200; // 33⅓ rpm, in degrees per second

// the rings' sunset colours, outermost first (they warm from the grooves' black as they sweep out)
const RING_COLORS = ["#a8431b", "#c25a24", "#e07a2e", "#e9893f", "#e8a91c"];

const hits = projects.filter((p) => p.stat);
// the newest three, back to front, for the crate in the hero
const crate = projects.slice(0, 3).reverse();

export function RetroGateway() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRef = useRef<HTMLSpanElement>(null);
  const labelTextRef = useRef<HTMLSpanElement>(null);
  const turnRef = useRef<HTMLSpanElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<HTMLDivElement>(null);
  const crateRef = useRef<HTMLDivElement>(null);
  const goRef = useRef<(dir: 1 | -1, instant?: boolean) => void>(() => {});
  const playing = useBgmOn();

  const toggle = () => {
    play(playing ? "tick" : "pop");
    setBgm(!playing);
  };

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = 0; // where the move is, 0 → END
    let target = 0;
    let raf = 0;
    let last = 0;
    let lockUntil = 0; // swallow the tail of a trackpad fling after the move
    let atTopSince = performance.now();
    // the record's own turning: spin-up when the move starts, a gentle stop (label upright) when it ends
    let angle = 0;
    let spinning = false;
    let spinStart = 0;
    let settle: { from: number; to: number; start: number; ms: number } | null = null;
    const turn = () => {
      const r = `rotate(${angle.toFixed(1)}deg)`;
      if (turnRef.current) turnRef.current.style.transform = r;
      if (labelTextRef.current) labelTextRef.current.style.transform = r;
    };

    // Lay everything out for progress p.
    const render = () => {
      const stage = stageRef.current;
      const disc = discRef.current;
      if (!stage || !disc) return;
      const box = stage.getBoundingClientRect();
      const d = disc.offsetWidth;
      const cx = disc.offsetLeft + d / 2;
      const cy = disc.offsetTop + d / 2;

      // 1 · the solid record hands over to its rings (same size and place, so the swap can't be seen)
      const split = seg(p, 0.03, 0.05);
      disc.style.opacity = String(1 - split);
      disc.style.pointerEvents = split > 0.5 ? "none" : "";
      if (hudRef.current) {
        hudRef.current.style.opacity = String(1 - seg(p, 0, 0.08));
        hudRef.current.style.visibility = p > 0.1 ? "hidden" : "visible";
      }

      // where the sun ends up: the label lands there and becomes it
      const sun = sunRef.current;
      const sr = sun?.getBoundingClientRect();
      const sunX = sr ? sr.left + sr.width / 2 - box.left : cx;
      const sunY = sr ? sr.top + sr.height / 2 - box.top : cy;
      const sunD = sr ? sr.width : LABEL * d;

      // 2 · into the grooves: the rings warm from black to sunset colours and sweep out past the edges of
      //     the screen, the inner ones a beat later, drifting down towards where the sun will sit
      const reach = Math.hypot(box.width, box.height) * 1.25;
      const heat = seg(p, 0.1, 0.22);
      ringRefs.current.forEach((ring, i) => {
        if (!ring) return;
        const size0 = d - 2 * i * BAND * d;
        const grow = ease(seg(p, 0.08 + i * 0.03, 0.4));
        const scale = lerp(1, reach / size0, grow);
        const x = lerp(cx, sunX, grow * 0.6);
        const y = lerp(cy, sunY, grow * 0.6);
        ring.style.width = `${size0.toFixed(1)}px`;
        ring.style.height = `${size0.toFixed(1)}px`;
        ring.style.borderWidth = `${(BAND * d).toFixed(2)}px`;
        ring.style.transform = `translate(${(x - size0 / 2).toFixed(1)}px, ${(y - size0 / 2).toFixed(1)}px) scale(${scale.toFixed(4)})`;
        ring.style.opacity = String(split * (1 - seg(p, 0.36 + i * 0.03, 0.16)));
        ring.style.setProperty("--heat", heat.toFixed(3));
      });

      // 3 · the label sinks to the horizon and grows into the sun, then hands over to it
      const label = labelRef.current;
      if (label) {
        const fly = ease(seg(p, 0.16, 0.36));
        const size = LABEL * d;
        const s = lerp(1, sunD / size, fly);
        label.style.width = `${size.toFixed(1)}px`;
        label.style.height = `${size.toFixed(1)}px`;
        label.style.transform = `translate(${(lerp(cx, sunX, fly) - size / 2).toFixed(1)}px, ${(lerp(cy, sunY, fly) - size / 2).toFixed(1)}px) scale(${s.toFixed(4)})`;
        label.style.setProperty("--label-ring", (1 - seg(p, 0.14, 0.2)).toFixed(3));
        label.style.opacity = String(1 - seg(p, 0.5, 0.06));
        const words = String(1 - seg(p, 0.08, 0.1)); // the label's words and spindle hole go before it becomes the sun
        if (labelTextRef.current) labelTextRef.current.style.opacity = words;
        const hole = label.querySelector<HTMLElement>(".retro-gate-hole");
        if (hole) hole.style.opacity = words;
      }
      if (sun) sun.style.opacity = String(seg(p, 0.48, 0.06));

      // 4 · the sky warms in behind the rings, the hills rise over the sun, then the hero
      if (skyRef.current) skyRef.current.style.opacity = String(seg(p, 0.1, 0.3));
      if (groundRef.current)
        groundRef.current.style.transform = `translateY(${((1 - ease(seg(p, 0.48, 0.24))) * 45).toFixed(2)}vh)`;
      const show = (el: HTMLElement | null, from: number, dx: number, dy: number) => {
        if (!el) return;
        const t = ease(seg(p, from, 0.18));
        el.style.opacity = String(t);
        el.style.transform = `translate(${((1 - t) * dx).toFixed(1)}px, ${((1 - t) * dy).toFixed(1)}px)`;
        el.style.visibility = t > 0 ? "visible" : "hidden";
      };
      show(textRef.current, 0.6, -60, 0);
      show(crateRef.current, 0.64, 0, 80);
      show(factsRef.current, 0.68, 0, 30);

      // 5 · the navbar drops in from above, the corner player fades up
      root.style.setProperty("--gate-dock", seg(p, 0.66, 0.14).toFixed(3));
      root.style.setProperty("--gate-nav", ease(seg(p, 0.6, 0.22)).toFixed(3));
      if (p < END) root.dataset.gate = "in";
      else delete root.dataset.gate;
      // data attributes, not classes: React rewrites className when the music starts or stops
      if (sectionRef.current) sectionRef.current.dataset.open = p >= END ? "true" : "false";
    };

    // Play the move towards `target` at a steady pace (each step's own easing is in render).
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (spinning) {
        const up = clamp01((now - spinStart) / SPINUP);
        angle += ((RPM_DEG * (1 - (1 - up) ** 2)) * dt) / 1000;
      } else if (settle) {
        const t = clamp01((now - settle.start) / settle.ms);
        angle = lerp(settle.from, settle.to, 1 - (1 - t) ** 3);
        if (t >= 1) settle = null;
      }
      // going forward, the move waits until the record is up to speed
      if (target < p || now - spinStart >= SPINUP) {
        const step = (END / DURATION) * dt;
        p = target > p ? Math.min(target, p + step) : Math.max(target, p - step);
      }
      if (p === 0 && target === 0 && spinning) {
        // back at rest: coast to a stop with the label upright, at about the speed it was turning
        spinning = false;
        let left = 360 - (angle % 360);
        if (left < 40) left += 360;
        settle = { from: angle, to: angle + left, start: now, ms: Math.min(2600, Math.max(500, ((3 * left) / RPM_DEG) * 1000)) };
      }
      if (p === END) spinning = false;
      render();
      turn();
      if (p !== target || settle) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        lockUntil = performance.now() + 700;
      }
    };
    const go = (dir: 1 | -1, instant = false) => {
      target = dir > 0 ? END : 0;
      if (p === target) return;
      if (instant || reduced) {
        cancelAnimationFrame(raf);
        raf = 0;
        p = target;
        spinning = false;
        settle = null;
        angle = 0;
        render();
        turn();
        return;
      }
      // from rest the record spins up first; otherwise it is already turning
      const now = performance.now();
      settle = null;
      spinStart = p === 0 && dir > 0 && !spinning ? now : now - SPINUP;
      spinning = true;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    goRef.current = go;

    const busy = () => raf !== 0 || performance.now() < lockUntil;
    const closed = () => p < END;
    // scrolling up from the hero, held at the very top for a moment, plays it back
    const canRewind = () => window.scrollY <= 0 && performance.now() - atTopSince > 350 && p === END;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      if (busy() && window.scrollY <= 1) return e.preventDefault();
      if (closed() && window.scrollY <= 1) {
        e.preventDefault();
        if (e.deltaY > 0) go(1);
      } else if (e.deltaY < 0 && canRewind()) {
        e.preventDefault();
        go(-1);
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY; // > 0: swiping up (scrolling down)
      if (busy() && window.scrollY <= 1) return e.preventDefault();
      if (closed() && window.scrollY <= 1) {
        e.preventDefault();
        if (dy > 12) go(1);
      } else if (dy < -12 && canRewind()) {
        e.preventDefault();
        go(-1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && el !== document.body && el.closest("input, textarea, select, button, a, [contenteditable]")) return;
      const down = ["ArrowDown", "PageDown", " ", "End"].includes(e.key);
      const up = ["ArrowUp", "PageUp", "Home"].includes(e.key);
      if (closed() && window.scrollY <= 1 && (down || busy())) {
        e.preventDefault();
        if (down) go(1);
      } else if (up && canRewind()) {
        e.preventDefault();
        go(-1);
      }
    };
    // a jump down the page (a nav link, a restored scroll position) opens it straight away
    const onScroll = () => {
      if (window.scrollY > 0) atTopSince = Infinity;
      else if (atTopSince === Infinity) atTopSince = performance.now();
      if (window.scrollY > 8 && closed()) go(1, true);
    };
    const onResize = () => render();

    if (window.scrollY > 8 || window.location.hash.length > 1) p = target = END;
    render();
    // off screen, the hero's own animations (rays, rings, grooves) pause
    const away = new IntersectionObserver(([e]) => {
      if (sectionRef.current) sectionRef.current.dataset.away = e.isIntersecting ? "false" : "true";
    });
    if (sectionRef.current) away.observe(sectionRef.current);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      away.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--gate-dock");
      root.style.removeProperty("--gate-nav");
      delete root.dataset.gate;
    };
  }, []);

  return (
    <section ref={sectionRef} id="home" className={`retro-gate ${playing ? "is-playing" : ""}`}>
      {/* the sunset and the hero itself, under the corner player */}
      <div className="retro-gate-bg">
        <div className="retro-gate-rings" aria-hidden="true" />
        <div ref={skyRef} className="retro-gate-sky" aria-hidden="true">
          <span className="retro-gate-rays" />
        </div>
        <div ref={sunRef} className="retro-gate-sun" aria-hidden="true" />
        <div ref={groundRef} className="retro-gate-ground" aria-hidden="true">
          <span className="retro-hill" />
          <span className="retro-hill" />
          <span className="retro-hill" />
          <span className="retro-hill" />
        </div>


        <div ref={textRef} className="retro-hero-text">
          <p className="retro-hero-kicker">Portfolio · {profile.location}</p>
          <h1 className="retro-hero-name">
            Chey
            <br />
            Rotana
          </h1>
          <p className="retro-hero-role">{profile.role}</p>
          <p className="retro-hero-now">
            {profile.currently} · {profile.internship}
          </p>
          <div className="retro-hero-actions">
            <a href="#work" className="retro-hero-btn">
              See my work
            </a>
            <a href="#contact" className="retro-hero-btn is-ghost">
              Get in touch
            </a>
            <span className="retro-hero-socials">
              {socials.map(({ name, url, icon: Icon }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}>
                  <Icon size={18} />
                </a>
              ))}
            </span>
          </div>
        </div>

        {/* my newest work as record sleeves standing in a crate; hovering one lifts it out */}
        <div ref={crateRef} className="retro-hero-crate">
          <div className="hero-crate-sleeves">
            {crate.map((p, i) => {
              const n = projects.indexOf(p) + 1;
              return (
                <a
                  key={p.id}
                  href="#work"
                  className={`hero-sleeve hero-sleeve-${i}`}
                  onClick={(e) => {
                    e.preventDefault();
                    play("tick");
                    showProject(p.id);
                  }}
                  onMouseEnter={() => play("type")}
                >
                  <span className="hero-sleeve-disc" aria-hidden="true" />
                  <span className="hero-sleeve-cover">
                    <span className="hero-sleeve-top">
                      <span className="hero-sleeve-title">{p.title}</span>
                      <span className="hero-sleeve-n">0{n}</span>
                    </span>
                    {p.stat && (
                      <span className="hero-sleeve-sticker">
                        <b>{p.stat.value}</b> {p.stat.label}
                      </span>
                    )}
                  </span>
                </a>
              );
            })}
            <span className="hero-crate-box" aria-hidden="true">
              <span>Newest work</span>
            </span>
          </div>
          <a href="#work" className="hero-crate-all">
            All {projects.length} projects <span aria-hidden="true">→</span>
          </a>
        </div>

        <div ref={factsRef} className="retro-hero-facts">
          <p className="retro-wip">
            <b>Work in progress</b> This theme is still being improved
          </p>
          <span>
            <b>{projects.length}</b> projects
          </span>
          {hits.map((p) => (
            <span key={p.id} className="is-hit">
              <b>{p.stat!.value}</b> {p.stat!.label} · {p.title}
            </span>
          ))}
          <a href="#about" className="retro-hero-next">
            About me <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      {/* the record, its rings and its label, above the corner player */}
      <div ref={stageRef} className="retro-gate-stage">
        <div ref={discRef} className="retro-gate-zoom">
          <button
            type="button"
            className="retro-gate-disc"
            onClick={toggle}
            aria-label={playing ? "Pause music" : "Play music"}
            data-cursor={playing ? "Pause" : "Play"}
          >
            <span ref={turnRef} className="retro-gate-turn" aria-hidden="true">
              <span className="retro-gate-grooves" />
            </span>
            <span className="retro-gate-sheen" aria-hidden="true" />
          </button>
          <span className="retro-gate-arm" aria-hidden="true">
            <span className="retro-gate-arm-bar">
              <span className="retro-gate-arm-head" />
            </span>
          </span>
        </div>

        {NAV_SECTIONS.map((s, i) => (
          <span
            key={s.id}
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            className="retro-gate-ring"
            style={{ "--ring-sun": RING_COLORS[i % RING_COLORS.length] } as CSSProperties}
            aria-hidden="true"
          />
        ))}

        <span ref={labelRef} className="retro-gate-label" aria-hidden="true">
          {/* printed like a real record label: my name curving along the top edge, "Portfolio" along the
              bottom, a thin ring in between and the spindle hole in the middle */}
          <span ref={labelTextRef} className="retro-gate-text">
            <svg viewBox="0 0 200 200" className="retro-gate-print">
              <defs>
                <path id="gate-arc-top" d="M 31 100 A 69 69 0 0 1 169 100" />
                <path id="gate-arc-bottom" d="M 20 100 A 80 80 0 0 0 180 100" />
              </defs>
              <circle cx="100" cy="100" r="44" className="retro-gate-print-ring" />
              <circle cx="100" cy="100" r="38" className="retro-gate-print-ring is-thin" />
              <text className="retro-gate-print-name">
                <textPath href="#gate-arc-top" startOffset="50%" textAnchor="middle">
                  {profile.name}
                </textPath>
              </text>
              <text className="retro-gate-print-kicker">
                <textPath href="#gate-arc-bottom" startOffset="50%" textAnchor="middle">
                  Portfolio · Side A
                </textPath>
              </text>
            </svg>
          </span>
          <span className="retro-gate-hole" />
        </span>

        {/* three keys like the buttons on an old stereo */}
        <div ref={hudRef} className="retro-gate-hud">
          <button
            type="button"
            className="retro-key"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={playing ? "Pause music" : "Play music"}
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            <span>{playing ? "Pause" : "Music"}</span>
          </button>
          <button
            type="button"
            className="retro-key retro-key-lit"
            onClick={() => goRef.current(1)}
            aria-label="Enter (or scroll down)"
          >
            <ArrowDown size={18} strokeWidth={2.6} className="retro-key-bob" />
            <span>Enter</span>
          </button>
          <button
            type="button"
            className="retro-key"
            onClick={() => goRef.current(1, true)}
            aria-label="Skip the intro"
          >
            <ChevronsRight size={20} strokeWidth={2.6} />
            <span>Skip</span>
          </button>
        </div>
      </div>
    </section>
  );
}
