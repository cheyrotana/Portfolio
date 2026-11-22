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
// The room's needle drops with the opening, and with the music: "Music" (or clicking the record) lowers it and
// starts the background music (RetroRoom).
// Two layers: .retro-gate-bg (sky, sun, hero text, photo) sits under the corner player, and
// .retro-gate-stage (record, rings, label) above it, so the label can land on the player.
// While the record is showing, <html> gets data-gate="in" (the navbar and the player stay put) and
// --gate-dock / --gate-nav (0 → 1: the corner player's label fades in and the navbar drops in at the end).
// Styles: .retro-gate* and .retro-hero* in styles/opening.css.
import { ArrowDown, ArrowRight, ChevronsRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { isBgmLive, setBgm } from "../../lib/bgm";
import { NAV_SECTIONS } from "../../data/sections";
import { profile, socials } from "../../data/profile";
import { useBgmOn } from "../../hooks/interactive";
import { roomBus, setHeroProgress } from "./retroRoomBus";
import { NEEDLE_DOWN, RetroRoom } from "./RetroRoom";
import { play } from "../../lib/sound";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progress of p through the window [from, from + span], 0 → 1. */
const seg = (p: number, from: number, span: number) => clamp01((p - from) / span);

const LABEL = 0.46; // label diameter, as a share of the record's
const BAND = (0.5 - LABEL / 2) / NAV_SECTIONS.length; // ring width, as a share of the record's diameter
// The opening is the 3D listening room: the camera starts straight above the spinning record (its label
// fills the screen) and, once you scroll, pulls back into the room on its own (scrolling up at the top
// plays it back). false: the earlier sunset gate.
const ROOM = true;
// true: the move follows the scroll position instead of playing on its own (a tall, pinned section)
const SCRUB = false;
const END = 0.86; // the move is complete here (the timings below were laid out on a 0–1 scale)
const DURATION = ROOM ? 3000 : 2300; // ms for the whole move (the room: needle drop, lights, pull-back)
const SPINUP = 700; // ms for the record to get up to speed before it splits, like a turntable starting
const RPM_DEG = 200; // 33⅓ rpm, in degrees per second

// the rings' sunset colours, outermost first (they warm from the grooves' black as they sweep out)
const RING_COLORS = ["#9a4a2a", "#ad5a32", "#c97a3e", "#cf8650", "#d4a03a"];


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
  const titleRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<HTMLDivElement>(null);
  const goRef = useRef<(dir: 1 | -1, instant?: boolean) => void>(() => {});
  const playing = useBgmOn();

  const toggle = () => {
    play(playing ? "tick" : "pop");
    setBgm(!playing);
  };

  // (a layout effect: the opening is laid out before the first paint, so nothing shows in its CSS default state first)
  useLayoutEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dropped = false; // the opening's needle is down (for the crackle)
    let p = 0; // where the move is, 0 → END
    // A page that comes back already open (a reload past the opening): the room is there at once, but my name,
    // the highlights, the navbar and the corner player come in as at the end of the move. `ui` is where they
    // are on p's scale while that plays, -1 otherwise (they follow p).
    let ui = -1;
    let uiRaf = 0;
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

    let sized = -1; // disc size the rings were last sized for
    let lastNav = "";
    let lastDock = "";
    // Lay everything out for progress p.
    const render = () => {
      const stage = stageRef.current;
      const disc = discRef.current;
      if (!stage || !disc) return;
      // read all layout first, then write (a read after a write forces a fresh layout every frame)
      const box = stage.getBoundingClientRect();
      const d = disc.offsetWidth;
      const cx = disc.offsetLeft + d / 2;
      const cy = disc.offsetTop + d / 2;
      const sun = sunRef.current;
      const sr = sun?.getBoundingClientRect();

      if (hudRef.current) {
        hudRef.current.style.opacity = String(1 - seg(p, 0, 0.08));
        hudRef.current.style.visibility = p > 0.1 ? "hidden" : "visible";
      }
      if (!ROOM) {
      // 1 · the solid record hands over to its rings (same size and place, so the swap can't be seen)
      const split = seg(p, 0.03, 0.05);
      disc.style.opacity = String(1 - split);
      disc.style.pointerEvents = split > 0.5 ? "none" : "";

      // where the sun ends up: the label lands there and becomes it
      // (with the 3D room behind the hero, the label lands on the turntable's record instead)
      const rec = roomBus.recordScreen;
      const sunX = rec ? rec.x : sr ? sr.left + sr.width / 2 - box.left : cx;
      const sunY = rec ? rec.y : sr ? sr.top + sr.height / 2 - box.top : cy;
      const sunD = rec ? rec.d * 0.34 : sr ? sr.width : LABEL * d; // (0.34: the 3D label's share of its record)

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
        if (sized !== d) {
          // size only changes with the window; setting it every frame would re-layout and repaint the rings
          ring.style.width = `${size0.toFixed(1)}px`;
          ring.style.height = `${size0.toFixed(1)}px`;
          ring.style.borderWidth = `${(BAND * d).toFixed(2)}px`;
          ring.style.setProperty("--ring-bw", `${(BAND * d).toFixed(2)}px`);
        }
        ring.style.transform = `translate(${(x - size0 / 2).toFixed(1)}px, ${(y - size0 / 2).toFixed(1)}px) scale(${scale.toFixed(4)})`;
        ring.style.opacity = String(split * (1 - seg(p, 0.36 + i * 0.03, 0.16)));
        ring.style.setProperty("--heat", heat.toFixed(3));
      });
      sized = d;

      // 3 · the label sinks to the horizon and grows into the sun, then hands over to it
      const label = labelRef.current;
      if (label) {
        const fly = ease(seg(p, 0.16, 0.36));
        const size = LABEL * d;
        const s = lerp(1, sunD / size, fly);
        if (label.style.width !== `${size.toFixed(1)}px`) {
          label.style.width = `${size.toFixed(1)}px`;
          label.style.height = `${size.toFixed(1)}px`;
        }
        label.style.transform = `translate(${(lerp(cx, sunX, fly) - size / 2).toFixed(1)}px, ${(lerp(cy, sunY, fly) - size / 2).toFixed(1)}px) scale(${s.toFixed(4)})`;
        label.style.setProperty("--label-ring", (1 - seg(p, 0.14, 0.2)).toFixed(3));
        label.style.opacity = String(1 - seg(p, 0.5, 0.06));
        const words = String(1 - seg(p, 0.08, 0.1)); // the label's words and spindle hole go before it becomes the sun
        if (labelTextRef.current) labelTextRef.current.style.opacity = words;
        const hole = label.querySelector<HTMLElement>(".retro-gate-hole");
        if (hole) hole.style.opacity = words;
      }
      if (sun) sun.style.opacity = String(seg(p, 0.48, 0.06));
      }

      // 4 · the sky warms in behind the rings, the hills rise over the sun, then the hero
      if (skyRef.current) skyRef.current.style.opacity = String(seg(p, 0.1, 0.3));
      // the room is there from the disc screen, dim; it lights up as the camera pulls back from the record
      // the room: the needle drop, the lights, the camera (RetroRoom); a crackle as the needle touches down
      // (none if the music already has it down)
      const t = p / END;
      setHeroProgress(t);
      if (t >= NEEDLE_DOWN && !dropped) {
        dropped = true;
        if (raf && !isBgmLive()) play("tick");
      } else if (t < NEEDLE_DOWN - 0.05) dropped = false;
      if (groundRef.current)
        groundRef.current.style.transform = `translateY(${((1 - ease(seg(p, 0.48, 0.24))) * 45).toFixed(2)}vh)`;
      const q = ui >= 0 ? ui : p;
      const show =(el: HTMLElement | null, from: number, dx: number, dy: number) => {
        if (!el) return;
        const t = ease(seg(q, from, 0.18));
        el.style.opacity = String(t);
        el.style.transform = `translate(${((1 - t) * dx).toFixed(1)}px, ${((1 - t) * dy).toFixed(1)}px)`;
        el.style.visibility = t > 0 ? "visible" : "hidden";
      };
      show(textRef.current, 0.6, 0, ROOM ? 36 : 0); // (in the room the card is centred: it rises in)
      // the room's title card (like an album cover) lifts away as the needle goes over
      const title = titleRef.current;
      if (title) {
        const out = ease(seg(q, 0, 0.16));
        title.style.opacity = String(1 - out);
        title.style.transform = `translateY(${(-out * 40).toFixed(1)}px)`;
        title.style.visibility = out < 1 ? "visible" : "hidden";
      }
      show(factsRef.current, 0.68, 0, 30);

      // 5 · the navbar drops in from above, the corner player fades up
      // written on the navbar and the player only: a variable on <html> restyles the whole page every frame
      const nav = ease(seg(q, 0.6, 0.22)).toFixed(3);
      const dock = seg(q, 0.66, 0.14).toFixed(3);
      if (nav !== lastNav) {
        document.querySelectorAll<HTMLElement>(".nav-bar").forEach((el) => el.style.setProperty("--gate-nav", nav));
        lastNav = nav;
      }
      if (dock !== lastDock) {
        document.querySelectorAll<HTMLElement>(".retro-deck-stack").forEach((el) => el.style.setProperty("--gate-dock", dock));
        lastDock = dock;
      }
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
        root.dataset.gateHold = String(lockUntil); // smooth scrolling waits it out too (useSmoothScroll)
      }
    };
    const go = (dir: 1 | -1, instant = false) => {
      if (ui >= 0) {
        // (cuts a reload's entrance short)
        cancelAnimationFrame(uiRaf);
        ui = -1;
        render();
      }
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
      spinStart = p === 0 && dir > 0 && !spinning && !ROOM ? now : now - SPINUP; // (the room's record starts with the needle)
      spinning = true;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    goRef.current = go;

    if (ROOM && SCRUB) {
      // The section is tall and its stage pinned; p follows how far you've scrolled through it, easing
      // after the scroll so wheel steps glide (the page itself glides too: useSmoothScroll).
      const progress = () => {
        const el = sectionRef.current;
        if (!el) return 0;
        const run = el.offsetHeight - window.innerHeight;
        return run > 0 ? clamp01(-el.getBoundingClientRect().top / (run * 0.85)) * END : END;
      };
      const step = (now: number) => {
        const dt = Math.min(64, now - last) / 1000;
        last = now;
        p += (target - p) * (reduced ? 1 : 1 - Math.exp(-dt * 9));
        if (Math.abs(target - p) < 0.0005) p = target;
        render();
        raf = p !== target ? requestAnimationFrame(step) : 0;
      };
      const follow = () => {
        target = progress();
        if (!raf && p !== target) {
          last = performance.now();
          raf = requestAnimationFrame(step);
        }
      };
      // the stereo keys: Enter scrolls to the end of the move, Skip to About
      goRef.current = (_dir, instant) => {
        const el = sectionRef.current;
        if (!el) return;
        const about = document.getElementById("about");
        const top = el.getBoundingClientRect().top + window.scrollY;
        const to = instant && about ? about.getBoundingClientRect().top + window.scrollY : top + (el.offsetHeight - window.innerHeight) * 0.9;
        window.scrollTo({ top: to, behavior: reduced ? "auto" : "smooth" });
      };
      p = target = progress();
      render();
      window.addEventListener("scroll", follow, { passive: true });
      window.addEventListener("resize", follow);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", follow);
        window.removeEventListener("resize", follow);
        setHeroProgress(0);
        root.style.removeProperty("--gate-dock");
        root.style.removeProperty("--gate-nav");
        delete root.dataset.gate;
      };
    }

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

    // (index.html marks a reload of a page that was past the opening: the browser restores the scroll only at load)
    if (window.scrollY > 8 || window.location.hash.length > 1 || root.hasAttribute("data-gate-resume")) p = target = END;
    if (p === END && !reduced) {
      // the end of the move, at its own pace, once the fonts are in (so my name doesn't change font as it rises)
      const from = 0.56;
      ui = from;
      let start = 0;
      const step = (now: number) => {
        start ||= now;
        ui = Math.min(END, from + ((now - start) * END) / DURATION);
        if (ui >= END) ui = -1;
        render();
        uiRaf = ui >= 0 ? requestAnimationFrame(step) : 0;
      };
      const begin = () => {
        if (ui === from && !uiRaf) uiRaf = requestAnimationFrame(step);
      };
      document.fonts?.ready.then(begin);
      setTimeout(begin, 800); // (fonts slow to come: go anyway)
    }
    render();
    // for that reload: whether the page was past the opening when it was left
    const onHide = () => {
      try {
        sessionStorage.setItem("retro-open", window.scrollY > 8 ? "1" : "0");
      } catch {
        // storage blocked: a reload just plays the opening's close-up first
      }
    };
    window.addEventListener("pagehide", onHide);
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
      window.removeEventListener("pagehide", onHide);
      cancelAnimationFrame(uiRaf);
      ui = -1; // (and a pending start does nothing)
      delete root.dataset.gateHold;
      root.style.removeProperty("--gate-dock");
      root.style.removeProperty("--gate-nav");
      delete root.dataset.gate;
    };
  }, []);

  return (
    <section ref={sectionRef} id="home" className={`retro-gate ${playing ? "is-playing" : ""}`} data-room={ROOM || undefined} data-scrub={SCRUB || undefined}>
      <div className="retro-gate-pin">
      {/* the sunset and the hero itself, under the corner player */}
      <div className="retro-gate-bg">
        {/* the lamp-lit listening room: its record is the opening, the room is the hero's backdrop */}
        <div className="retro-gate-room">
          <RetroRoom heroOnly />
        </div>
        {/* the room at rest is an album cover: the title on the left, the window and the turntable on the right */}
        {ROOM && (
          <div ref={titleRef} className="retro-title">
            <p className="retro-title-kicker">Side A · Now playing</p>
            <p className="retro-title-name" aria-hidden="true">
              Chey{" "}
              <br />
              Rotana
            </p>
            <p className="retro-title-role">
              {profile.role} <span className="retro-title-dot" aria-hidden="true">·</span>{" "}
              <span className="retro-title-where">{profile.location}</span>
            </p>
            <div className="retro-title-actions">
              <button type="button" className="retro-title-drop" onClick={() => goRef.current(1)}>
                <span className="retro-title-needle" aria-hidden="true" />
                Drop the needle
              </button>
              <button
                type="button"
                className="retro-title-music"
                onClick={toggle}
                aria-label={playing ? "Pause music" : "Play music"}
                aria-pressed={playing}
              >
                {playing ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
                <span>Music</span>
              </button>
              <button type="button" className="retro-title-skip" onClick={() => goRef.current(1, true)}>
                Skip intro <ChevronsRight size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="retro-title-hint" aria-hidden="true">
              or just scroll <ArrowDown size={13} />
            </p>
          </div>
        )}
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
            Chey <br />
            Rotana
          </h1>
          <p className="retro-hero-role">{profile.role}</p>
          <p className="retro-hero-now">
            {profile.currently}
          </p>
          <div className="retro-hero-actions">
            <a href="#work" className="retro-hero-btn">
              See my work <ArrowRight size={17} aria-hidden="true" />
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

        {/* the way on: a small lit cue down to About */}
        <div ref={factsRef} className="retro-hero-facts">
          <a href="#about" className="retro-hero-next">
            About me <ArrowDown size={14} aria-hidden="true" />
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
                  ★ Portfolio ★
                </textPath>
              </text>
              {/* inside the rings, around the spindle hole */}
              <text x="100" y="83" textAnchor="middle" className="retro-gate-print-small">
                Now playing
              </text>
              <text x="100" y="124" textAnchor="middle" className="retro-gate-print-small">
                Side A
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
            aria-label={ROOM ? "Drop the needle (or scroll down)" : "Enter (or scroll down)"}
          >
            <ArrowDown size={18} strokeWidth={2.6} className="retro-key-bob" />
            <span>{ROOM ? "Play" : "Enter"}</span>
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
      </div>
    </section>
  );
}
