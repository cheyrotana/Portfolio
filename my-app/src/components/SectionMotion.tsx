import { useEffect, useRef, useState, type CSSProperties } from "react";
import { NAV_SECTIONS } from "../data/sections";

// Section motion, and nothing for visitors who prefer reduced motion:
// 1. Persona: cards slide in from alternating sides with a tilt as they scroll into view;
// 2. jumping to a section from the navbar, footer or a Metro "next stop" display covers the screen
//    while the page jumps underneath: Persona sends a red-and-black wipe across, Metro rides
//    through a tunnel until the station pulls in, Retro sends sunset rings out from the click until a
//    record covers the screen and its label names the section. Links marked data-jump (like "Skip the
//    journey") jump straight there in every theme, without scrolling through everything between.

const CARDS = "#about .card, #contact .card, .skill-menu-item, .ph-index-row";

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function useCardEntrances() {
  useEffect(() => {
    if (reduced() || !("IntersectionObserver" in window)) return;

    // data attributes rather than classes, so React re-rendering className can't wipe them
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, n) => {
            const el = e.target as HTMLElement;
            el.dataset.enterN = String(Math.min(n, 5));
            el.dataset.enter = "in";
            io.unobserve(el);
          });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    document.querySelectorAll<HTMLElement>(CARDS).forEach((el) => {
      if (el.dataset.enter && el.dataset.enter !== "wait") return;
      // alternate sides by position in the list (a link inside an <li> counts as the <li>)
      const item = el.parentElement?.tagName === "LI" ? el.parentElement : el;
      const index = item.parentElement ? Array.prototype.indexOf.call(item.parentElement.children, item) : 0;
      el.dataset.enterSide = index % 2 ? "r" : "l";
      el.dataset.enter = "wait";
      io.observe(el);
    });

    // once the slide-in ends, drop the animation so hover effects work as normal
    const done = (e: AnimationEvent) => {
      const el = e.target as HTMLElement;
      if (el.dataset?.enter === "in" && e.animationName.startsWith("p5-enter")) el.dataset.enter = "done";
    };
    document.addEventListener("animationend", done);
    return () => {
      io.disconnect();
      document.removeEventListener("animationend", done);
    };
  }, []);
}

// How long each theme's cover takes to close (the page jumps then) and to clear again
const TIMING = {
  wipe: { in: 420, out: 460 }, // Persona: red and black slabs
  ride: { in: 760, out: 520 }, // Metro: a tunnel, then the station pulls in
  spin: { in: 620, out: 600 }, // Retro: sunset rings, a record, then the rings shrink away
};

type Kind = keyof typeof TIMING;

export function SectionMotion() {
  useCardEntrances();
  const [wipe, setWipe] = useState<{
    phase: "in" | "out";
    label: string;
    kind: Kind;
    stop: string;
    x: number; // where the rings start (the click), in px
    y: number;
    r: number; // ring radius that covers the screen from there and from the centre
  } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const timers: number[] = [];

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const jumpLink = link.hasAttribute("data-jump");
      if (!jumpLink && !link.closest("header, .site-foot, .metro-next")) return;
      const id = link.getAttribute("href")!.slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;

      const jump = () => {
        const html = document.documentElement;
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        html.style.scrollBehavior = prev;
        history.pushState(null, "", `#${id}`);
      };

      const theme = document.documentElement.dataset.theme;
      const kind: Kind | null =
        theme === "persona" ? "wipe" : theme === "metro" ? "ride" : theme === "retro" ? "spin" : null;
      if (!kind || reduced()) {
        if (!jumpLink) return; // ordinary smooth scroll
        e.preventDefault();
        jump();
        return;
      }

      e.preventDefault();
      if (busy.current) return;
      busy.current = true;
      const index = NAV_SECTIONS.findIndex((s) => s.id === id);
      const label =
        id === "home" ? (kind === "ride" ? "Departures" : "Top") : (NAV_SECTIONS[index]?.label ?? link.textContent ?? "");
      const stop = index >= 0 ? String(index + 1) : "R";
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = e.clientX || w / 2;
      const y = e.clientY || h / 2;
      const r = Math.ceil(Math.max(Math.hypot(Math.max(x, w - x), Math.max(y, h - y)), Math.hypot(w, h) / 2)) + 8;
      const at = { x, y, r };
      setWipe({ phase: "in", label, kind, stop, ...at });

      timers.push(
        window.setTimeout(() => {
          jump(); // while the screen is covered
          setWipe({ phase: "out", label, kind, stop, ...at });
        }, TIMING[kind].in),
        window.setTimeout(() => {
          setWipe(null);
          busy.current = false;
        }, TIMING[kind].in + TIMING[kind].out),
      );
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (!wipe) return null;
  if (wipe.kind === "spin") {
    return (
      <div
        className={`retro-change is-${wipe.phase}`}
        style={{ "--x": `${wipe.x}px`, "--y": `${wipe.y}px`, "--r": `${wipe.r}px` } as CSSProperties}
        aria-hidden="true"
      >
        <span className="retro-change-ring" />
        <span className="retro-change-ring" />
        <span className="retro-change-ring" />
        <span className="retro-change-ring retro-change-vinyl" />
        <span className="retro-change-label">
          <span className="retro-change-side">{wipe.stop === "R" ? "Side A" : `Track ${wipe.stop.padStart(2, "0")}`}</span>
          <span className="retro-change-name">{wipe.label}</span>
          <span className="retro-change-hole" />
        </span>
      </div>
    );
  }
  if (wipe.kind === "ride") {
    return (
      <div className={`metro-ride is-${wipe.phase}`} aria-hidden="true">
        <span className="metro-ride-tunnel">
          <span />
          <span />
          <span />
        </span>
        <div className="metro-ride-platform">
          <span className="metro-ride-stripe" />
          <span className="metro-ride-sign">
            <span className="metro-badge">{wipe.stop}</span>
            {wipe.label}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={`p5-navwipe is-${wipe.phase}`} aria-hidden="true">
      <span className="p5-navwipe-red" />
      <span className="p5-navwipe-black">
        <span className="p5-navwipe-label">{wipe.label}</span>
      </span>
    </div>
  );
}
