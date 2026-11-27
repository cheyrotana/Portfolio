// Retro theme, Work: "Screens" (design P6: the app first): the track list on the left; in the middle the
// project's real screens in a phone (or a wide frame for web and game screens) as a carousel, two more fanned behind and a small record behind it;
// short notes on the right. Every project's notes are always there, stacked, so nothing jumps on a change.
// Styles: .retro-sc* in styles/work.css.
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Github, Play } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Project } from "../../data/projects";
import { setRoomTrack } from "./retroRoomBus";
import { iconOf, kindOf, LABELS, sides, TECH_ICONS } from "./retroWorkData";
import { play } from "../../lib/sound";

export function RetroWork({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  return (
    <div className="retro-wk">
      <RetroScreens projects={projects} onOpen={onOpen} />
    </div>
  );
}

// is a cover colour light (so its text goes dark)?
const isLight = (hex?: string) => {
  const m = hex?.match(/^#([0-9a-f]{6})$/i);
  if (!m) return false;
  const v = parseInt(m[1], 16);
  return 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255) > 170;
};

function RetroScreens({ projects, onOpen }: { projects: Project[]; onOpen: (id: string) => void }) {
  const { sideA, sideB, order, trackNo } = sides(projects);
  const [pickedId, setPickedId] = useState(order[0]?.id);
  const [shot, setShot] = useState(0);
  const [wide, setWide] = useState<Record<string, boolean>>({}); // landscape screens (web, games): a wide frame
  const recordRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(pickedId);
  const k = Math.max(0, order.findIndex((p) => p.id === pickedId));
  const cur = order[k];
  const isWide = cur ? (wide[cur.id] ?? false) : false;
  // a wide project (web, game) opens on a cover (its logo and name on its own colour), then four screens
  const shots = cur ? cur.images.slice(0, isWide ? 4 : 5) : [];
  const n = Math.max(1, shots.length + (isWide ? 1 : 0));
  const on = shot % n;

  useEffect(() => {
    setRoomTrack(cur ? { title: cur.title, side: cur.categories.includes("client") ? "Side A" : "Side B" } : null);
    return () => setRoomTrack(null);
  }, [cur]);

  // a new track: the little record behind the phone turns once
  useEffect(() => {
    if (!cur || lastId.current === cur.id) return;
    lastId.current = cur.id;
    // on narrower screens the list is one row you swipe: bring the playing track to the middle of it
    // (the row's own scroll only, never the page's)
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>('.retro-sc-track[aria-pressed="true"]');
    if (list && chip && list.scrollWidth > list.clientWidth + 1) {
      const left = chip.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
      list.scrollTo({ left: left - (list.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    recordRef.current?.animate([{ rotate: "0deg" }, { rotate: "360deg" }], {
      duration: 900,
      easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    });
  }, [cur]);

  // on narrower screens the list is a row: a mouse wheel scrolls it sideways, and once it reaches either end
  // the wheel goes back to scrolling the page (the smooth scroll listens on the window, so it's held back
  // only while the row itself moves)
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onWheel = (e: WheelEvent) => {
      const max = list.scrollWidth - list.clientWidth;
      if (max <= 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // not a row, or already a sideways swipe
      const d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      if ((d < 0 && list.scrollLeft <= 0) || (d > 0 && list.scrollLeft >= max - 1)) return;
      e.preventDefault();
      e.stopPropagation();
      list.scrollLeft += d;
    };
    list.addEventListener("wheel", onWheel, { passive: false });
    return () => list.removeEventListener("wheel", onWheel);
  }, []);

  // the screens take turns on their own (a click on the arrows or dots restarts the wait)
  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setShot((i) => i + 1), 3600);
    return () => window.clearInterval(t);
  }, [n, pickedId, shot]);

  if (!cur) return null;

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

  const side = (label: string, what: string, list: Project[]) =>
    list.length > 0 && (
      <>
        <p className="retro-sc-side">
          {label}
          <span> · {what}</span>
        </p>
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
                {p.id === cur.id ? (
                  <span className="retro-sc-eq" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <Play className="retro-sc-play" size={14} aria-hidden="true" />
                )}
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
        <p className="retro-sc-hint">Pick a track to play it</p>
        <div className="retro-sc-tracks" ref={listRef}>
          {side("Side A", "Client work", sideA)}
          {side("Side B", "Team & study", sideB)}
        </div>
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
          {isWide && (
            <span className="retro-sc-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <b>{cur.title}</b>
            </span>
          )}
          <span className="retro-sc-screen">
            {isWide && cur.cover && <img src={cur.cover} alt="" data-on={on === 0} />}
            {isWide && !cur.cover && (
              <span
                className="retro-sc-cover"
                data-on={on === 0}
                data-light={isLight(cur.splash?.bg) || undefined}
                style={{ background: cur.splash?.bg ?? "#1a110b" }}
              >
                {(cur.splash?.logo ?? icon) && <img src={cur.splash?.logo ?? icon} alt="" />}
                <strong>{cur.title}</strong>
                <small>{cur.summary}</small>
              </span>
            )}
            {shots.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                data-on={(isWide ? i + 1 : i) === on}
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
          </span>
        </button>
        {n > 1 && (
          <div className="retro-sc-controls">
            <button type="button" className="retro-sc-arrow" onClick={() => setShot(on - 1 + n)} aria-label="Previous screen">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="retro-sc-dots">
              {Array.from({ length: n }, (_, i) => (
                <button key={i} type="button" data-on={i === on} onClick={() => setShot(i)} aria-label={`Screen ${i + 1}`} />
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
