import { useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { skillGroups } from "../../data/profile";
import { projects } from "../../data/projects";
import { showProject } from "../../lib/events";

// Metro theme: the Skills section as a network map. Every skill group is a coloured line leaving
// "Rotana Central"; every tool is a station on it. Pick a station (click, tap or Enter) to see which
// projects call there; a little train rides the line you're looking at. Phones get the same lines
// as straight strips.

type Dir = "E" | "W" | "NE" | "SE" | "SW" | "NW";
const STEP: Record<Dir, [number, number]> = {
  E: [96, 0],
  W: [-96, 0],
  NE: [62, -62],
  SE: [62, 62],
  SW: [-62, 62],
  NW: [-62, -62],
};

// The shape of each line, in skill-group order: legs of [direction, stations on that leg]
const LAYOUT: { color: string; ink: string; legs: [Dir, number][] }[] = [
  { color: "#2457d6", ink: "#fff", legs: [["E", 2]] }, // Mobile
  { color: "#b0154f", ink: "#fff", legs: [["NE", 2], ["E", 3]] }, // Frontend
  { color: "#0e7c86", ink: "#fff", legs: [["SE", 2], ["E", 3]] }, // Backend & Data
  { color: "#1f7a45", ink: "#fff", legs: [["SW", 2], ["W", 2]] }, // Hardware & Games
  { color: "#d99a00", ink: "#141414", legs: [["NW", 2], ["W", 2]] }, // Tools
];

const W = 900;
const H = 380;
const CX = 430;
const CY = 190;

interface Station {
  name: string;
  x: number;
  y: number;
  label: "above" | "below" | "left" | "right";
  projects: { id: string; title: string }[];
}

interface Line {
  title: string;
  blurb: string;
  color: string;
  ink: string;
  d: string;
  stations: Station[];
}

function buildLines(): Line[] {
  return skillGroups.map((group, gi) => {
    const layout = LAYOUT[gi % LAYOUT.length];
    let x = CX;
    let y = CY;
    const points: [number, number][] = [[x, y]];
    const legOf: Dir[] = [];
    for (const [dir, count] of layout.legs) {
      for (let k = 0; k < count; k++) {
        x += STEP[dir][0];
        y += STEP[dir][1];
        points.push([x, y]);
        legOf.push(dir);
      }
    }
    const stations = group.skills.map((s, i) => {
      const [sx, sy] = points[Math.min(i + 1, points.length - 1)];
      const diagonal = legOf[i] !== "E" && legOf[i] !== "W" && Math.abs(sy - CY) < 124;
      const label: Station["label"] = diagonal ? (sx > CX ? "right" : "left") : sy < CY ? "above" : "below";
      return {
        name: s.name,
        x: sx,
        y: sy,
        label,
        projects: projects.filter((p) => p.tech.includes(s.name)).map((p) => ({ id: p.id, title: p.title })),
      };
    });
    return {
      title: group.title,
      blurb: group.blurb,
      color: layout.color,
      ink: layout.ink,
      d: "M" + points.map(([px, py]) => `${px} ${py}`).join(" L"),
      stations,
    };
  });
}

function labelProps(s: Station) {
  switch (s.label) {
    case "above":
      return { x: s.x, y: s.y - 20, textAnchor: "middle" as const };
    case "below":
      return { x: s.x, y: s.y + 32, textAnchor: "middle" as const };
    case "left":
      return { x: s.x - 18, y: s.y + 5, textAnchor: "end" as const };
    default:
      return { x: s.x + 18, y: s.y + 5, textAnchor: "start" as const };
  }
}

// The map never changes, so it's laid out once
const LINES = buildLines();
const BUSIEST = LINES.flatMap((l) => l.stations).reduce((a, b) => (b.projects.length > a.projects.length ? b : a));

export function MetroSkillMap() {
  const lines = LINES;
  const busiest = BUSIEST;
  const [pick, setPick] = useState<{ line: number; station: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInView(ref, { once: true, amount: 0.3 });

  const line = pick ? lines[pick.line] : null;
  const station = pick && line ? line.stations[pick.station] : null;
  const choose = (li: number, si: number) => setPick((p) => (p && p.line === li && p.station === si ? null : { line: li, station: si }));
  const onKey = (e: KeyboardEvent, li: number, si: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(li, si);
    }
  };
  const stationCount = lines.reduce((n, l) => n + l.stations.length, 0);

  return (
    <div ref={ref} className="metro-map" data-in={shown ? "true" : undefined} data-focus={line ? line.title : undefined}>
      <div className="metro-map-board">
        {/* Desktop and tablet: the network map */}
        <svg className="metro-map-svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Network map of my skills: one line per skill group">
          {lines.map((l, li) => (
            <g key={l.title} className={`mm-line ${line === l ? "is-focus" : ""}`} style={{ ["--d" as string]: `${li * 0.18}s` }}>
              <path className="mm-track" d={l.d} pathLength={1} stroke={l.color} />
              {line === l && (
                <rect className="mm-train" x="-11" y="-6" width="22" height="12" rx="5" fill="#141414">
                  <animateMotion dur="5s" repeatCount="indefinite" path={l.d} rotate="auto" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear" />
                </rect>
              )}
              {l.stations.map((s, si) => {
                const selected = pick?.line === li && pick.station === si;
                const interchange = s.projects.length >= 2;
                return (
                  <g
                    key={s.name}
                    className={`mm-station ${selected ? "is-selected" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`${s.name}, ${l.title} line, ${s.projects.length} project${s.projects.length === 1 ? "" : "s"}`}
                    onClick={() => choose(li, si)}
                    onKeyDown={(e) => onKey(e, li, si)}
                    style={{ ["--s" as string]: `${li * 0.18 + 0.35 + si * 0.08}s` }}
                  >
                    <circle className="mm-hit" cx={s.x} cy={s.y} r="22" />
                    {selected && <circle className="mm-ring" cx={s.x} cy={s.y} r="14" stroke={l.color} />}
                    <circle
                      className="mm-dot"
                      cx={s.x}
                      cy={s.y}
                      r={interchange ? 11 : 9}
                      fill={selected ? l.color : "#fff"}
                      stroke={interchange ? "#141414" : l.color}
                      strokeWidth={interchange ? 4.5 : 4}
                    />
                    <text className="mm-label" {...labelProps(s)}>
                      {s.name}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
          {/* Rotana Central: the interchange every line leaves from */}
          <g className="mm-central">
            <rect x={CX - 18} y={CY - 18} width="36" height="36" rx="18" />
            <text x={CX} y={CY + 5} textAnchor="middle" className="mm-central-r">
              R
            </text>
            <text x={CX - 30} y={CY + 5} textAnchor="end" className="mm-central-label">
              Rotana Central
            </text>
          </g>
        </svg>

        {/* Phones: each line as a strip of stations */}
        <ul className="metro-map-list">
          {lines.map((l, li) => (
            <li key={l.title} className="mm-strip" style={{ ["--c" as string]: l.color }}>
              <span className="mm-strip-name">
                <span className="mm-strip-dot" aria-hidden="true" />
                {l.title} line
              </span>
              <span className="mm-strip-stops">
                {l.stations.map((s, si) => (
                  <button
                    key={s.name}
                    type="button"
                    className={`mm-strip-stop ${pick?.line === li && pick.station === si ? "is-selected" : ""}`}
                    aria-pressed={pick?.line === li && pick.station === si}
                    onClick={() => choose(li, si)}
                  >
                    {s.name}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* What calls at the chosen station */}
      <aside className="metro-map-panel" aria-live="polite">
        {station && line ? (
          <>
            <p className="mm-panel-kicker">
              <span className="mm-panel-line" style={{ background: line.color, color: line.ink }}>
                {line.title} line
              </span>
            </p>
            <h3 className="mm-panel-title">{station.name}</h3>
            <p className="mm-panel-text">{line.blurb}</p>
            {station.projects.length ? (
              <>
                <p className="mm-panel-sub">
                  {station.projects.length} project{station.projects.length === 1 ? "" : "s"} call here
                </p>
                <ul className="mm-panel-projects">
                  {station.projects.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="mm-panel-project" onClick={() => showProject(p.id)} data-cursor="Board">
                        {p.title}
                        <ArrowRight size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mm-panel-sub">Part of my everyday toolkit, not tied to one featured project.</p>
            )}
          </>
        ) : (
          <>
            <p className="mm-panel-kicker">Network map</p>
            <h3 className="mm-panel-title">Rotana Central</h3>
            <p className="mm-panel-text">
              {lines.length} lines, {stationCount} stations. Pick any station to see which projects call there.
            </p>
            <p className="mm-panel-sub">
              Busiest interchange: <b>{busiest.name}</b>, {busiest.projects.length} projects
            </p>
            <ul className="mm-legend">
              {lines.map((l, li) => (
                <li key={l.title}>
                  <button type="button" className="mm-legend-item" onClick={() => choose(li, 0)}>
                    <span className="mm-legend-swatch" style={{ background: l.color }} aria-hidden="true" />
                    {l.title}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
