import { useSky, useWeather } from "../../hooks/interactive";

// Persona-theme section background, shared so every section matches the hero: a red diagonal slab
// with a white slash along its edge and halftone dots. The hero and Journey get the full slab; the
// other sections get a wedge in the top corner, on whichever side keeps the slash off plain text.
// Renders nothing in the other themes.

export function P5Slab({ variant = "wedge", side = "left" }: { variant?: "full" | "wedge"; side?: "left" | "right" }) {
  return (
    <div className="only-persona">
      <div className={`p5-slab p5-slab-${variant} p5-slab-${side}`} aria-hidden="true">
        <div className="p5-slab-red" />
        <div className="p5-slab-slash" />
        <div className="p5-slab-dots" />
      </div>
    </div>
  );
}

// ── Day and night (follows the real time in Phnom Penh, see weather.ts) ─────────────────────────

/** By day a sun: the same spinning black burst as behind the hero photo, around a white disc
 * with a white ring. By night a white crescent moon. Both sit in the hero. */
export function P5Sky() {
  const sky = useSky();
  return (
    <div className="only-persona">
      <div className={`p5-sky p5-sky-${sky}`} aria-hidden="true">
        {sky === "day" ? (
          <svg viewBox="-4 -4 108 108" className="p5-sun">
            <g className="p5-sun-rays">
              <polygon points={BURST} fill="#0b0b0b" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
            </g>
            <circle cx="50" cy="50" r="29" fill="#fff" stroke="#0b0b0b" strokeWidth="3" />
            <circle cx="50" cy="50" r="22.5" fill="#fff" stroke="#0b0b0b" strokeWidth="3" />
          </svg>
        ) : (
          <svg viewBox="0 0 100 100" className="p5-moon">
            <path d="M62 8a44 44 0 1 0 30 62A36 36 0 0 1 62 8z" fill="#fff" stroke="#0b0b0b" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="40" cy="58" r="5" fill="#d9d2d2" />
            <circle cx="30" cy="40" r="3" fill="#d9d2d2" />
            <circle cx="52" cy="78" r="3.5" fill="#d9d2d2" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Phnom Penh skyline: Wat Phnom, Independence Monument, the Royal Palace throne hall and
// Vattanac Capital between plain blocks. Windows light up at night. ─────────────────────────────

const W = 1440;
const G = 170; // ground line

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// Plain blocks as [x, width, height]
const BLOCKS: [number, number, number][] = [
  [0, 46, 62], [44, 38, 92], [80, 52, 70], [232, 40, 84], [270, 58, 118], [326, 34, 76], [358, 48, 100],
  [404, 60, 66], [462, 40, 88], [650, 44, 96], [692, 36, 72], [726, 50, 110], [990, 46, 80], [1034, 58, 124],
  [1090, 40, 90], [1240, 44, 100], [1282, 52, 74], [1332, 40, 112], [1370, 70, 84],
];

// Extra plain blocks past both edges: the drawing is scaled to fit its height (so nothing is cut
// off at the top), and on wide screens these fill the space at the sides.
for (const [start, end] of [[-1600, 0], [W, W + 1600]]) {
  for (let x = start, i = 0; x < end; i++) {
    const w = 36 + Math.round(hash(i * 7 + start) * 34);
    BLOCKS.push([x, w, 56 + Math.round(hash(i * 13 + start + 5) * 64)]);
    x += w - 2;
  }
}

const LANDMARKS = [
  // Wat Phnom: hilltop stupa with a thin spire
  "M120 170 Q170 118 222 170 Z",
  "M150 140 H194 V128 H150 Z",
  "M156 128 Q172 76 188 128 Z",
  "M169 92 L172 34 L175 92 Z",
  // Independence Monument: stacked lotus tiers, narrowing upwards
  "M520 170 V150 H600 V170 Z",
  "M528 150 L536 128 H584 L592 150 Z",
  "M538 128 L544 106 H576 L582 128 Z",
  "M546 106 L550 86 H570 L574 106 Z",
  "M552 86 L555 68 H565 L568 86 Z",
  "M556 68 L560 40 L564 68 Z",
  // Royal Palace throne hall: tiered roofs with flared ends and a central spire
  "M808 170 V136 H952 V170 Z",
  "M790 140 L812 136 L880 100 L948 136 L970 140 L948 132 L880 92 L812 132 Z",
  "M822 120 L880 84 L938 120 L930 120 L880 90 L830 120 Z",
  "M826 136 L880 104 L934 136 Z",
  "M864 92 L868 70 H892 L896 92 Z",
  "M872 70 L880 18 L888 70 Z",
  // Vattanac Capital: tall tower that tapers into a curved tail
  "M1150 170 L1152 40 Q1160 8 1206 2 Q1184 26 1190 60 L1192 170 Z",
  "M1188 170 V96 H1226 V170 Z",
];

const WINDOWS = BLOCKS.flatMap(([x, w, h], b) => {
  const out: { x: number; y: number; on: number }[] = [];
  for (let y = G - h + 10; y < G - 10; y += 13)
    for (let wx = x + 7; wx < x + w - 9; wx += 11) out.push({ x: wx, y, on: hash(b * 97 + wx * 3 + y) });
  return out;
});

const BLOCK_PATH = BLOCKS.map(([x, w, h]) => `M${x} ${G}V${G - h}H${x + w}V${G}Z`).join("");
const SHAPES = BLOCK_PATH + LANDMARKS.join("");

export function P5Skyline({ className = "" }: { className?: string }) {
  const sky = useSky();
  return (
    <div className="only-persona">
      <svg
        className={`p5-skyline p5-skyline-${sky} ${className}`}
        viewBox={`0 0 ${W} ${G}`}
        preserveAspectRatio="xMidYMax meet"
        overflow="visible"
        aria-hidden="true"
      >
        {/* Draw the outline first and the fill on top, so only the outer edge shows white */}
        <path d={SHAPES} fill="none" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
        <path d={SHAPES} fill="#0b0b0b" />
        {/* Solid ground below the buildings, reaching under the tilted band between sections */}
        <rect x={-1600} y={G - 1} width={W + 3200} height={400} fill="#0b0b0b" />
        <g className="p5-skyline-windows">
          {WINDOWS.map((win, i) => (
            <rect
              key={i}
              x={win.x}
              y={win.y}
              width="5"
              height="7"
              fill={win.on > 0.93 ? "#e60012" : win.on > 0.55 ? "#fff3c4" : "#1e1e1e"}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

// Spinning burst like the one behind the hero photo: black with a white rim, so it reads on red and black.
const BURST = Array.from({ length: 32 }, (_, i) => {
  const a = (i / 32) * Math.PI * 2;
  const r = i % 2 === 0 ? 50 : 33 + ((i * 37) % 10) * 0.9;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

export function P5Burst({ className = "" }: { className?: string }) {
  return (
    <span className="only-persona">
      <svg className={`p5-burst-deco ${className}`} viewBox="-4 -4 108 108" aria-hidden="true">
        <polygon points={BURST} fill="#0b0b0b" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Night sky: small four-point stars pinned behind the page (under the red slabs), twinkling slowly.
// About a third are big four-point stars, the rest small ones that fill out the sky
const STARS = Array.from({ length: 120 }, (_, i) => ({
  left: (hash(i * 3 + 1) * 100).toFixed(1),
  top: (hash(i * 7 + 2) * 96).toFixed(1),
  size: i % 3 === 0 ? Math.round(12 + hash(i * 11 + 3) * 14) : Math.round(5 + hash(i * 11 + 3) * 6),
  delay: (hash(i * 13 + 4) * 4).toFixed(2),
  red: hash(i * 17 + 5) > 0.82,
}));

export function P5Stars() {
  const sky = useSky();
  const weather = useWeather();
  // no stars by day, or when rain clouds cover the sky
  if (sky !== "night" || weather?.kind === "rain" || weather?.kind === "storm") return null;
  return (
    <div className="only-persona">
      <div className="p5-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className="p5-star"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
          >
            <path d="M10 0 L12.2 7.8 L20 10 L12.2 12.2 L10 20 L7.8 12.2 L0 10 L7.8 7.8 Z" fill={s.red ? "#e60012" : "#fff"} />
          </svg>
        ))}
      </div>
    </div>
  );
}
