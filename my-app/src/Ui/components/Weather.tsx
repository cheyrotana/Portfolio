import type React from "react";
import type { WeatherKind } from "../weather";
import { useWeather } from "../hooks/interactive";

// Bold, flat weather icons in the Persona palette (white shapes, black outlines, red accents).
const CLOUD = "M13 36h23a8.5 8.5 0 0 0 .6-17A11.5 11.5 0 0 0 15 16.5 9.8 9.8 0 0 0 13 36z";

const SUN_RAYS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const r = i % 2 === 0 ? 22 : 15;
  return `${(24 + r * Math.cos(a)).toFixed(1)},${(24 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

export function WeatherIcon({ kind, isDay, className = "" }: { kind: WeatherKind; isDay: boolean; className?: string }) {
  const stroke = { stroke: "#0b0b0b", strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {kind === "clear" &&
        (isDay ? (
          <>
            <polygon points={SUN_RAYS} fill="#e60012" {...stroke} />
            <circle cx="24" cy="24" r="9" fill="#fff" {...stroke} />
          </>
        ) : (
          <path d="M30 6a17 17 0 1 0 12 26A14 14 0 0 1 30 6z" fill="#fff" {...stroke} />
        ))}
      {kind === "cloudy" && (
        <>
          <path d="M26 30h14a6 6 0 0 0 .4-12A8 8 0 0 0 26 17a6.5 6.5 0 0 0 0 13z" fill="#e60012" {...stroke} />
          <path d={CLOUD} fill="#fff" {...stroke} />
        </>
      )}
      {(kind === "rain" || kind === "storm") && (
        <>
          <path d={CLOUD} transform="translate(0 -6)" fill="#fff" {...stroke} />
          {kind === "rain" ? (
            <g stroke="#e60012" strokeWidth="3.5" strokeLinecap="round">
              <line x1="17" y1="36" x2="14" y2="44" />
              <line x1="25" y1="36" x2="22" y2="44" />
              <line x1="33" y1="36" x2="30" y2="44" />
            </g>
          ) : (
            <polygon points="26,28 17,40 24,40 20,47 32,34 25,34 29,28" fill="#e60012" {...stroke} strokeWidth={2} />
          )}
        </>
      )}
      {kind === "fog" && (
        <g strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M8 18c5-4 9 4 14 0s9 4 18 0" stroke="#0b0b0b" />
          <path d="M6 27c5-4 9 4 14 0s9 4 20 0" stroke="#e60012" />
          <path d="M10 36c5-4 9 4 14 0s9 4 16 0" stroke="#0b0b0b" />
        </g>
      )}
    </svg>
  );
}

// Puffy cartoon cloud, drawn with a thick black outline like the rest of the Persona artwork
const PUFF =
  "M34 86 C12 86 6 66 22 58 C16 40 36 28 52 36 C58 14 88 8 102 26 C116 10 146 14 150 38 " +
  "C170 34 190 50 182 70 C196 76 190 92 172 90 L40 90 C36 90 34 88 34 86 Z";

const rand = (n: number) => {
  const x = Math.sin(n * 91.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Clouds are part of the Persona background in every section, whatever the weather: white with a
 * red shadow normally, grey when it rains, dark grey in a storm. Each section draws its own layer
 * (in the same layer as its red slab, so they show over the red too) and they drift slowly sideways.
 * In Journey the layer sits inside the pinned panel, so the clouds stay put while the plane flies.
 *
 * count: how many clouds; from/to: the vertical band they spread over (% of the section height);
 * seed: varies sizes, speeds and starting points between sections.
 */
export function P5Clouds({ count = 5, from = 4, to = 86, seed = 0 }: { count?: number; from?: number; to?: number; seed?: number }) {
  const weather = useWeather();
  const kind = weather?.kind ?? "clear";
  const clouds = Array.from({ length: count }, (_, i) => {
    const n = seed * 31 + i;
    return {
      top: from + ((to - from) * (i + rand(n) * 0.8)) / count,
      w: 140 + Math.round(rand(n + 50) * 120),
      dur: 70 + Math.round(rand(n + 100) * 60),
      at: rand(n + 150),
      // storms: every other cloud throws lightning, each at a random spot and on its own random rhythm
      bolt:
        (i + seed) % 2 === 0
          ? { x: Math.round((rand(n + 250) - 0.5) * 70), every: 4 + rand(n + 300) * 7, after: rand(n + 350) * 8 }
          : null,
    };
  });

  return (
    <div className="only-persona">
      <div className={`wx-back wx-back-${kind}`} aria-hidden="true">
        {clouds.map((c, i) => (
            <svg
              key={i}
              viewBox="0 0 200 100"
              className="wx-cloud"
              style={
                {
                  top: `${c.top}%`,
                  width: c.w,
                  animationDuration: `${c.dur}s`,
                  animationDelay: `${-c.at * c.dur}s`,
                  "--x": `${Math.round(c.at * 90)}vw`,
                } as React.CSSProperties
              }
            >
              {kind === "storm" && c.bolt && (
                // drawn first so it comes out from under the cloud
                <path
                  d="M100 78 L84 122 L101 122 L88 170 L124 108 L105 108 L118 78 Z"
                  className="wx-bolt"
                  transform={`translate(${c.bolt.x} 0)`}
                  style={{ animationDuration: `${c.bolt.every.toFixed(1)}s`, animationDelay: `${c.bolt.after.toFixed(1)}s` }}
                />
              )}
              <path d={PUFF} />
              <path d="M58 46 C64 34 80 32 90 40" className="wx-cloud-line" />
            </svg>
          ))}
      </div>
    </div>
  );
}

// Weather over the whole screen (Persona theme only): rain streaks and lightning.
// Fog has no page effect; it only shows on the calendar.
export function WeatherFx() {
  const weather = useWeather();
  if (!weather || (weather.kind !== "rain" && weather.kind !== "storm")) return null;
  const { kind } = weather;

  return (
    <div className="only-persona">
      <div className={`wx wx-${kind}`} aria-hidden="true">
        <div className="wx-rain" />
        {kind === "storm" && <div className="wx-flash" />}
      </div>
    </div>
  );
}
