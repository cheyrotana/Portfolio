import type { CSSProperties } from "react";

// Ransom-note lettering: in the Persona theme every letter is its own cut-out tile with its own
// font, colours and tilt. Other themes show the same text as ordinary letters (see index.css).
// The pattern is fixed per `seed`, so the same word always looks the same.

const TILTS = [-7, 4, -3, 6, -5, 2, 8, -2];

export function Ransom({ text, seed = 0, className = "" }: { text: string; seed?: number; className?: string }) {
  let k = 0;
  const words = text.split(" ");

  return (
    <span className={`ransom ${className}`}>
      <span className="sr-only">{text}</span>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true">
          <span className="ransom-word">
            {[...word].map((ch) => {
              const i = k++;
              const style = {
                "--r": `${TILTS[(i + seed) % TILTS.length]}deg`,
                "--y": `${(((i * 13 + seed * 7) % 4) * 0.035).toFixed(3)}em`,
                "--s": (0.86 + ((i * 7 + seed * 3) % 5) * 0.06).toFixed(2),
                "--i": i,
              } as CSSProperties;
              return (
                <span key={i} className="ransom-tile" data-v={(i * 5 + seed * 2) % 6} data-f={(i * 4 + seed) % 6} style={style}>
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
