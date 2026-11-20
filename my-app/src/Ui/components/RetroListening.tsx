// Retro theme, Work section (design P5): the second piece of the same stereo as the Skills receiver: the same
// walnut case and dark faceplate. A turntable on the left plays the picked project (its logo on the label,
// the tonearm on the record while the music plays) over a "Now playing" readout and back / next knobs; the
// faceplate on the right holds the track list (Side A client work, Side B team and study projects) and the
// project's notes, lit like the receiver's screen. Every project's notes and label are always there, stacked,
// and only the picked one shows, so changing track never empties a panel or changes the height.
// ← → change track. Styles: .retro-hf* in src/retro.css.
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Github } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Project } from "../data/projects";
import { setRoomTrack } from "../retroRoomBus";
import { iconOf, kindOf, LABELS, TECH_ICONS } from "../retroWork";
import { play } from "../sound";

export function RetroListening({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  // Side A first, then Side B: the order the tracks are played in
  const sideA = projects.filter((p) => p.categories.includes("client"));
  const sideB = projects.filter((p) => !p.categories.includes("client"));
  const order = [...sideA, ...sideB];
  const [pickedId, setPickedId] = useState(order[0]?.id);
  const [shot, setShot] = useState(0); // which of the playing project's screens shows
  const labelRef = useRef<HTMLSpanElement>(null);
  const armRef = useRef<HTMLSpanElement>(null);
  const lastId = useRef(pickedId);
  const k = Math.max(0, order.findIndex((p) => p.id === pickedId));
  const cur = order[k];
  // the 3D room's record shows the picked project on its label (RetroRoom reads it)
  useEffect(() => {
    setRoomTrack(cur ? { title: cur.title, side: cur.categories.includes("client") ? "Side A" : "Side B" } : null);
    return () => setRoomTrack(null);
  }, [cur]);

  // A track change is a needle drop: the arm lifts off and comes back, the label turns once (the Web
  // Animations API on two small parts: no re-mount, nothing else moves)
  useEffect(() => {
    if (!cur || lastId.current === cur.id) return;
    lastId.current = cur.id;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    labelRef.current?.animate([{ rotate: "0deg" }, { rotate: "360deg" }], {
      duration: 900,
      easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    });
    armRef.current?.animate(
      [
        { transform: "none" },
        { transform: "rotate(-16deg) translateY(-3px)", offset: 0.35 },
        { transform: "rotate(-16deg) translateY(-3px)", offset: 0.55 },
        { transform: "none" },
      ],
      { duration: 1000, easing: "ease-in-out" },
    );
  }, [cur]);

  // The playing project's screens take turns on the faceplate
  const screens = cur ? cur.images.slice(0, 4).length : 0;
  useEffect(() => {
    if (screens < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setShot((i) => i + 1), 3200);
    return () => window.clearInterval(t);
  }, [screens, pickedId]);

  if (!cur) return null;

  const trackNo = (p: Project) => {
    const i = order.indexOf(p);
    return i < sideA.length ? `A${i + 1}` : `B${i - sideA.length + 1}`;
  };

  const go = (i: number) => {
    const next = order[(i + order.length) % order.length];
    if (next.id === cur.id) return;
    play("tick");
    setPickedId(next.id);
    setShot(0);
  };

  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(k + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(k - 1);
    else return;
    e.preventDefault();
  };

  const side = (label: string, list: Project[]) =>
    list.length > 0 && (
      <div className="retro-hf-side">
        <p className="retro-hf-label">{label}</p>
        <ol>
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="retro-hf-track"
                aria-pressed={p.id === cur.id}
                onClick={() => go(order.indexOf(p))}
                data-cursor="Play"
              >
                <span className="retro-hf-no">{trackNo(p)}</span>
                <span className="retro-hf-name">{p.title}</span>
                {p.status && <span className="retro-hf-status">{p.status}</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
    );

  return (
    <div className="retro-hf" onKeyDown={onKey}>
      {/* The turntable */}
      <div className="retro-hf-deck">
        <div className="retro-hf-platter" aria-hidden="true">
          <span className="retro-hf-record">
            <span className="retro-hf-label-disc" ref={labelRef}>
              {order.map((p) => {
                const icon = iconOf(p);
                return (
                  <span
                    key={p.id}
                    className="retro-hf-face"
                    data-on={p.id === cur.id}
                    style={{ background: LABELS[p.id] ?? LABELS.hrm }}
                  >
                    {icon && <img src={icon} alt="" loading="lazy" />}
                  </span>
                );
              })}
            </span>
          </span>
          <span className="retro-hf-pivot" />
          <span className="retro-hf-arm" ref={armRef} />
        </div>

        <div className="retro-hf-readout" aria-live="polite">
          <span className="retro-hf-label">Now playing</span>
          <b>{trackNo(cur)}</b>
          <span className="retro-hf-readout-name">{cur.title}</span>
          <span className="retro-hf-vu" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>

        <div className="retro-hf-knobs">
          <button type="button" className="retro-rx-knob" onClick={() => go(k - 1)} aria-label="Previous track">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className="retro-hf-label" aria-hidden="true">
            Track
          </span>
          <button type="button" className="retro-rx-knob" onClick={() => go(k + 1)} aria-label="Next track">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* The faceplate: track list and notes */}
      <div className="retro-hf-plate">
        <nav className="retro-hf-tracks" aria-label="Projects">
          {side("Side A · Client work", sideA)}
          {side("Side B · Team & study", sideB)}
        </nav>

        <div className="retro-hf-screen">
          {order.map((p) => {
            const shots = p.images.slice(0, 4);
            const on = p.id === cur.id ? shot % Math.max(1, shots.length) : 0;
            return (
              <article
                key={p.id}
                className="retro-hf-notes"
                data-on={p.id === cur.id}
                aria-hidden={p.id !== cur.id}
                aria-label={p.title}
              >
                <div className="retro-hf-notes-text">
                  <p className="retro-hf-label">
                    {p.role} · {p.year} · {kindOf(p) || "Client work"}
                    {p.status ? ` · ${p.status}` : ""}
                  </p>
                  <h3 className="retro-hf-title">{p.title}</h3>
                  <p className="retro-hf-client">{p.client}</p>
                  {/* the short summary beside the highlights; with none, the full description fills the space */}
                  <p className="retro-hf-desc">{p.highlights.length > 0 ? p.summary : p.description}</p>
                  {p.highlights.length > 0 && (
                    <ul className="retro-hf-highlights">
                      {p.highlights.slice(0, 3).map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  <ul className="retro-hf-tech" aria-label="Built with">
                    {p.tech.map((t) => {
                      const Icon = TECH_ICONS[t];
                      return (
                        <li key={t} className="retro-rx-logo" title={t}>
                          {Icon ? <Icon aria-hidden="true" /> : <span aria-hidden="true">{t.slice(0, 2)}</span>}
                          <span className="sr-only">{t}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="retro-hf-actions">
                    <button type="button" className="retro-hf-open" onClick={() => onOpen(p.id)}>
                      See the full project
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                    {p.githubUrl && (
                      <a className="retro-hf-link" href={p.githubUrl} target="_blank" rel="noreferrer">
                        <Github size={16} aria-hidden="true" />
                        Code
                      </a>
                    )}
                    {p.demoUrl && (
                      <a className="retro-hf-link" href={p.demoUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} aria-hidden="true" />
                        Live
                      </a>
                    )}
                  </div>
                </div>
                {shots.length > 0 && (
                  <div className="retro-hf-shotcol">
                    <button
                      type="button"
                      className="retro-hf-shot"
                      onClick={() => onOpen(p.id)}
                      aria-label={`${p.title}: open the project`}
                      data-cursor="Open"
                    >
                      {shots.map((src, i) => (
                        <img key={src} src={src} alt="" loading="lazy" data-on={i === on} />
                      ))}
                    </button>
                    {shots.length > 1 && (
                      <span className="retro-hf-dots" aria-hidden="true">
                        {shots.map((src, i) => (
                          <i key={src} data-on={i === on} />
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
