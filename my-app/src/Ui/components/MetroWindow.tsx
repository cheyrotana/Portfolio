import { useEffect, useRef } from "react";
import { useSky, useThemeAttr, useWeather } from "../hooks/interactive";

// Metro theme: the view from the carriage window. Three layers of city stream past at different
// speeds (far towers, mid-rise blocks, poles and trees right by the track), and the train speeds up
// while you scroll. The sky and weather outside follow the site's live Phnom Penh sky (and the
// sky & weather menu): day or night, lit windows after dark, rain running along the glass.

const TILE = 1400; // width of one repeat of each layer, in its own units (height 240)

// Small seeded random, so the skyline is the same on every visit
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Block {
  x: number;
  w: number;
  h: number;
}

function blocks(seed: number, minW: number, maxW: number, minH: number, maxH: number, gapMax: number) {
  const r = rng(seed);
  const out: Block[] = [];
  let x = 0;
  while (x < TILE) {
    const w = Math.round(minW + r() * (maxW - minW));
    const h = Math.round(minH + r() * (maxH - minH));
    out.push({ x, w: Math.min(w, TILE - x), h });
    x += w + Math.round(r() * gapMax);
  }
  return out;
}

const FAR = blocks(7, 36, 90, 28, 92, 6);
const MID = blocks(21, 64, 150, 54, 150, 46);
const MID_WINDOWS = (() => {
  const r = rng(99);
  return MID.flatMap((b, bi) => {
    const wins: { x: number; y: number; lit: boolean; key: string }[] = [];
    for (let y = 240 - 34 - b.h + 12; y < 240 - 34 - 14; y += 16) {
      for (let x = b.x + 10; x < b.x + b.w - 14; x += 15) {
        wins.push({ x, y, lit: r() < 0.32, key: `${bi}-${x}-${y}` });
      }
    }
    return wins;
  });
})();
const TREES = (() => {
  const r = rng(5);
  const out: { x: number; s: number }[] = [];
  for (let x = 40; x < TILE - 60; x += 120 + r() * 220) out.push({ x, s: 0.8 + r() * 0.6 });
  return out;
})();
const POLES = Array.from({ length: 6 }, (_, i) => 60 + i * (TILE / 6));

function FarLayer() {
  const ground = 240 - 34;
  return (
    <svg className="mw-svg" viewBox={`0 0 ${TILE} 240`} preserveAspectRatio="xMinYMax meet" aria-hidden="true">
      <g className="mw-far-fill">
        {FAR.map((b) => (
          <rect key={b.x} x={b.x} y={ground - b.h} width={b.w} height={b.h} />
        ))}
        {/* a tall tower with a slanted crown */}
        <path d={`M300 ${ground} V58 L322 30 L344 50 V${ground} Z`} />
        <rect x="318" y="14" width="3" height="20" />
        {/* a tiered monument with a spire */}
        <path
          d={`M880 ${ground} V150 H890 V128 H898 V108 H905 V90 H911 V66 L915 40 L919 66 V90 H925 V108 H932 V128 H940 V150 H950 V${ground} Z`}
        />
        {/* a riverside pavilion roof */}
        <path d={`M1150 ${ground} V160 L1172 140 H1228 L1250 160 V${ground} Z`} />
      </g>
    </svg>
  );
}

function MidLayer() {
  const ground = 240 - 34;
  return (
    <svg className="mw-svg" viewBox={`0 0 ${TILE} 240`} preserveAspectRatio="xMinYMax meet" aria-hidden="true">
      <g className="mw-mid-fill">
        {MID.map((b) => (
          <rect key={b.x} x={b.x} y={ground - b.h} width={b.w} height={b.h} />
        ))}
      </g>
      <g>
        {MID_WINDOWS.map((w) => (
          <rect key={w.key} className={w.lit ? "mw-win is-lit" : "mw-win"} x={w.x} y={w.y} width="7" height="8" />
        ))}
      </g>
    </svg>
  );
}

function NearLayer() {
  return (
    <svg className="mw-svg" viewBox={`0 0 ${TILE} 240`} preserveAspectRatio="xMinYMax meet" aria-hidden="true">
      {/* overhead wires */}
      <line className="mw-wire" x1="0" y1="22" x2={TILE} y2="22" />
      <line className="mw-wire" x1="0" y1="30" x2={TILE} y2="34" />
      <g className="mw-near-fill">
        {TREES.map((t) => (
          <g key={t.x} transform={`translate(${t.x} ${240 - 30}) scale(${t.s})`}>
            <rect x="-3" y="-30" width="6" height="30" />
            <circle cx="0" cy="-44" r="22" />
            <circle cx="-16" cy="-32" r="15" />
            <circle cx="16" cy="-34" r="16" />
          </g>
        ))}
        {POLES.map((x) => (
          <g key={x}>
            <rect x={x} y="12" width="9" height="228" />
            <rect x={x - 26} y="18" width="44" height="6" />
          </g>
        ))}
        {/* the trackside wall */}
        <rect x="0" y="212" width={TILE} height="28" />
      </g>
    </svg>
  );
}

const LAYERS = [
  { className: "mw-far", speed: 0.12, Art: FarLayer },
  { className: "mw-mid", speed: 0.42, Art: MidLayer },
  { className: "mw-near", speed: 1.9, Art: NearLayer },
];

export function MetroWindow({ caption }: { caption: string }) {
  const theme = useThemeAttr();
  const sky = useSky();
  const weather = useWeather();
  const glassRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (theme !== "metro") return;
    const glass = glassRef.current;
    if (!glass) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const offsets = LAYERS.map(() => 0);
    let boost = 0;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let lastY = window.scrollY;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      boost *= 0.94;
      const speed = 90 + boost; // px per second at the near layer's scale of 1
      layerRefs.current.forEach((el, i) => {
        if (!el) return;
        const tile = el.firstElementChild?.getBoundingClientRect().width || TILE;
        offsets[i] = (offsets[i] + dt * speed * LAYERS[i].speed) % tile;
        el.style.transform = `translate3d(${-offsets[i].toFixed(1)}px, 0, 0)`;
      });
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const onScroll = () => {
      const y = window.scrollY;
      boost = Math.min(1400, boost + Math.abs(y - lastY) * 5);
      lastY = y;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !still) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(glass);
    if (!still) {
      raf = requestAnimationFrame(frame);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [theme]);

  const wet = weather?.kind === "rain" || weather?.kind === "storm";
  return (
    <div className="metro-window" data-sky={sky} data-wet={wet ? "true" : undefined} data-storm={weather?.kind === "storm" ? "true" : undefined}>
      <div ref={glassRef} className="metro-window-glass" role="img" aria-label={`View from the train window: Phnom Penh ${sky === "night" ? "at night" : "by day"}${wet ? " in the rain" : ""}`}>
        <span className="mw-sky" aria-hidden="true" />
        <span className="mw-orb" aria-hidden="true" />
        {LAYERS.map(({ className, Art }, i) => (
          <div
            key={className}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            className={`mw-layer ${className}`}
            aria-hidden="true"
          >
            <Art />
            <Art />
          </div>
        ))}
        {wet && <span className="mw-rain" aria-hidden="true" />}
        <span className="mw-glare" aria-hidden="true" />
      </div>
      <span className="metro-window-caption">{caption}</span>
    </div>
  );
}
