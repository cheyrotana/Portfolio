// Retro theme, Work: "Screens" (design P6: the app first). The "Turntable" layout (P5, RetroListening) is
// commented out below. P6: the track list on the left; in the middle the project's real screens in a phone (or a
// wide frame for web and game screens) as a carousel, two more fanned behind and a small record behind it;
// short notes on the right. Every project's notes are always there, stacked, so nothing jumps on a change.
// Styles: .retro-wk* / .retro-sc* in src/retro.css.
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Github } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Project } from "../data/projects";
import { setRoomTrack } from "../retroRoomBus";
import { iconOf, kindOf, LABELS, sides, TECH_ICONS } from "../retroWork";
import { play } from "../sound";
// The turntable layout (design P5) is parked: Screens was picked. To bring it back as an option, restore the
// switch below and this import.
// import { RetroListening } from "./RetroListening";
//
// type View = "turntable" | "screens";
// const KEY = "retro-work-view";
//
// function readView(): View {
//   try {
//     return localStorage.getItem(KEY) === "screens" ? "screens" : "turntable";
//   } catch {
//     return "turntable";
//   }
// }
//
// (in RetroWork)
//   const [view, setView] = useState<View>(readView);
//   const pick = (v: View) => {
//     if (v === view) return;
//     play("tick");
//     setView(v);
//     try {
//       localStorage.setItem(KEY, v);
//     } catch {
//       /* private mode: just this visit */
//     }
//   };
//   ...
//       <div className="retro-wk-switch" role="group" aria-label="Work layout">
//         <span className="retro-wk-switch-label">View</span>
//         <button type="button" aria-pressed={view === "turntable"} onClick={() => pick("turntable")}>Turntable</button>
//         <button type="button" aria-pressed={view === "screens"} onClick={() => pick("screens")}>Screens</button>
//       </div>
//       {view === "turntable" ? <RetroListening projects={projects} onOpen={onOpen} /> : <RetroScreens ... />}

export function RetroWork({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  return (
    <div className="retro-wk">
      <RetroScreens projects={projects} onOpen={onOpen} />
    </div>
  );
}

function RetroScreens({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const { sideA, sideB, order, trackNo } = sides(projects);
  const [pickedId, setPickedId] = useState(order[0]?.id);
  const [shot, setShot] = useState(0);
  const [wide, setWide] = useState<Record<string, boolean>>({}); // landscape screens (web, games): a wide frame
  const recordRef = useRef<HTMLSpanElement>(null);
  const lastId = useRef(pickedId);
  const k = Math.max(0, order.findIndex((p) => p.id === pickedId));
  const cur = order[k];
  const shots = cur ? cur.images.slice(0, 5) : [];
  const n = Math.max(1, shots.length);
  const on = shot % n;

  useEffect(() => {
    setRoomTrack(cur ? { title: cur.title, side: cur.categories.includes("client") ? "Side A" : "Side B" } : null);
    return () => setRoomTrack(null);
  }, [cur]);

  // a new track: the little record behind the phone turns once
  useEffect(() => {
    if (!cur || lastId.current === cur.id) return;
    lastId.current = cur.id;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    recordRef.current?.animate([{ rotate: "0deg" }, { rotate: "360deg" }], {
      duration: 900,
      easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    });
  }, [cur]);

  // the screens take turns on their own (a click on the arrows or dots restarts the wait)
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setShot((i) => i + 1), 3600);
    return () => window.clearInterval(t);
  }, [n, pickedId, shot]);

  if (!cur) return null;
  const isWide = wide[cur.id] ?? false;

  const go = (i: number) => {
    const next = order[(i + order.length) % order.length];
    if (next.id === cur.id) return;
    play("tick");
    setPickedId(next.id);
    setShot(0);
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowDown") go(k + 1);
    else if (e.key === "ArrowUp") go(k - 1);
    else if (e.key === "ArrowRight") setShot(on + 1);
    else if (e.key === "ArrowLeft") setShot(on - 1 + n);
    else return;
    e.preventDefault();
  };

  const side = (label: string, list: Project[]) =>
    list.length > 0 && (
      <>
        <p className="retro-sc-side">{label}</p>
        <ol>
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="retro-sc-track"
                aria-pressed={p.id === cur.id}
                onClick={() => go(order.indexOf(p))}
                data-cursor="Play"
              >
                <span className="retro-sc-no">{trackNo(p)}</span>
                <span className="retro-sc-name">{p.title}</span>
                {p.status && <span className="retro-sc-status">In dev</span>}
              </button>
            </li>
          ))}
        </ol>
      </>
    );

  const icon = iconOf(cur);

  return (
    <div className="retro-sc" onKeyDown={onKey}>
      <nav className="retro-sc-list" aria-label="Projects">
        {side("Side A · Client work", sideA)}
        {side("Side B · Team & study", sideB)}
      </nav>

      {/* The stage: the app's screens */}
      <div className="retro-sc-stage" data-wide={isWide}>
        <span className="retro-sc-record" ref={recordRef} aria-hidden="true">
          <span style={{ background: LABELS[cur.id] ?? LABELS.hrm }}>{icon && <img src={icon} alt="" />}</span>
        </span>
        {!isWide && shots.length > 2 && (
          <>
            <img className="retro-sc-fan is-left" src={shots[(on + 1) % n]} alt="" aria-hidden="true" />
            <img className="retro-sc-fan is-right" src={shots[(on + 2) % n]} alt="" aria-hidden="true" />
          </>
        )}
        <button
          type="button"
          className="retro-sc-device"
          onClick={() => onOpen(cur.id)}
          aria-label={`${cur.title}, screen ${on + 1} of ${n}: open the project`}
          data-cursor="Open"
        >
          {shots.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              data-on={i === on}
              onLoad={
                i === 0
                  ? (e) => {
                      const img = e.currentTarget;
                      const w = img.naturalWidth > img.naturalHeight;
                      setWide((m) => (m[cur.id] === w ? m : { ...m, [cur.id]: w }));
                    }
                  : undefined
              }
            />
          ))}
        </button>
        {n > 1 && (
          <div className="retro-sc-controls">
            <button type="button" className="retro-sc-arrow" onClick={() => setShot(on - 1 + n)} aria-label="Previous screen">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="retro-sc-dots">
              {shots.map((src, i) => (
                <button key={src} type="button" data-on={i === on} onClick={() => setShot(i)} aria-label={`Screen ${i + 1}`} />
              ))}
            </span>
            <button type="button" className="retro-sc-arrow" onClick={() => setShot(on + 1)} aria-label="Next screen">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* The notes */}
      <div className="retro-sc-notes">
        {order.map((p) => {
          const pIcon = iconOf(p);
          return (
            <article key={p.id} data-on={p.id === cur.id} aria-hidden={p.id !== cur.id} aria-label={p.title}>
              <p className="retro-sc-kicker">
                {trackNo(p)} · {p.role} · {p.year}
              </p>
              <h3 className="retro-sc-title">
                {pIcon && <img src={pIcon} alt="" loading="lazy" />}
                {p.title}
              </h3>
              <p className="retro-sc-client">
                {p.client}
                {p.status ? ` · ${p.status}` : ""} · {kindOf(p) || "Client work"}
              </p>
              <p className="retro-sc-desc">{p.highlights.length > 0 ? p.summary : p.description}</p>
              {p.highlights.length > 0 && (
                <ul className="retro-sc-highlights">
                  {p.highlights.slice(0, 3).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              <ul className="retro-sc-tech" aria-label="Built with">
                {p.tech.map((t) => {
                  const Icon = TECH_ICONS[t];
                  return (
                    <li key={t} title={t}>
                      {Icon ? <Icon aria-hidden="true" /> : <span aria-hidden="true">{t.slice(0, 2)}</span>}
                      <span className="sr-only">{t}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="retro-sc-actions">
                <button type="button" className="retro-sc-open" onClick={() => onOpen(p.id)}>
                  See the full project
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noreferrer" aria-label={`${p.title} code on GitHub`}>
                    <Github size={16} aria-hidden="true" />
                  </a>
                )}
                {p.demoUrl && (
                  <a href={p.demoUrl} target="_blank" rel="noreferrer" aria-label={`${p.title} live`}>
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
