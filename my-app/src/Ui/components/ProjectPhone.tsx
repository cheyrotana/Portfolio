import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Smartphone, Snowflake, type LucideIcon } from "lucide-react";
import { useEffect, useState, type UIEvent } from "react";
import { unlock } from "../achievements";
import { APPS, type PhoneApp } from "../data/apps";
import type { Project } from "../data/projects";
import { TechLabel } from "./TechChip";

// The Projects section's browser: every project is an app on a phone. Tapping one launches it like
// a real app (a splash with its logo), then shows its store-style page inside the phone: logo,
// facts, a swipeable row of screenshots, what I built and the tools. The list beside the phone is
// the same apps, so either can launch them. State lives in ProjectsSection.

// For apps without a logo image: an icon on the app's colour
const LOGOS: Record<string, { icon: LucideIcon; bg: string }> = {
  "frost-guard": { icon: Snowflake, bg: "#38bdf8" },
};

export function AppLogo({ app, className = "" }: { app: PhoneApp; className?: string }) {
  if (app.logo) return <img src={app.logo} alt="" className={`app-logo ${className}`} />;
  const { icon: Icon, bg } = LOGOS[app.id] ?? { icon: Smartphone, bg: "var(--accent)" };
  return (
    <span className={`app-logo ${className}`} style={{ background: bg }} aria-hidden="true">
      <Icon strokeWidth={2.2} />
    </span>
  );
}

const fmt = (opts: Intl.DateTimeFormatOptions) => () =>
  new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "Asia/Phnom_Penh" }).format(new Date());
const phnomPenhTime = fmt({ hour: "2-digit", minute: "2-digit" });
const phnomPenhDate = fmt({ weekday: "long", day: "numeric", month: "long" });

function useClock() {
  const [time, setTime] = useState(phnomPenhTime);
  useEffect(() => {
    const id = window.setInterval(() => setTime(phnomPenhTime()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

// The logo on the launch screen: the app's own splash image, or its icon's glyph in white
function SplashLogo({ app }: { app: PhoneApp }) {
  if (app.splash?.logo) return <img src={app.splash.logo} alt="" className="ph-splash-img" />;
  const Icon = LOGOS[app.id]?.icon;
  return Icon ? <Icon className="ph-splash-glyph" strokeWidth={1.8} /> : <AppLogo app={app} className="ph-splash-icon" />;
}

// "Mobile & Web Developer" → "Mobile & Web"
const shortRole = (p: Project) => p.role.replace(/\s*Developer$/, "");

// An app's store-style page, shown inside the phone once it has launched
function AppPage({ app, onBack, onOpen }: { app: PhoneApp; onBack: () => void; onOpen: (id: string) => void }) {
  const project = app.project;
  const stat = app.stat; // per app (HRM's NIS figure only belongs to the NIS build)

  // Swiping to the last screenshot unlocks an achievement
  const onShotsScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (app.images.length > 1 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) unlock("tester");
  };

  return (
    <div className="ph-page">
      <div className="ph-page-bar">
        <button type="button" onClick={onBack} aria-label="Back to the home screen">
          <ChevronLeft size={18} aria-hidden="true" /> Apps
        </button>
      </div>

      <div className="ph-page-head">
        <AppLogo app={app} className="ph-page-logo" />
        <div className="min-w-0">
          <p className="ph-page-title">{app.title}</p>
          <p className="ph-page-sub">{app.client}</p>
          <button type="button" className="ph-get" onClick={() => onOpen(project.id)} data-cursor="Open">
            Case study
          </button>
        </div>
      </div>

      <dl className="ph-facts">
        <div>
          <dt>Year</dt>
          <dd>{project.year}</dd>
        </div>
        {stat && (
          <div>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        )}
        <div>
          <dt>My role</dt>
          <dd>{shortRole(project)}</dd>
        </div>
      </dl>

      <div className="ph-shots" onScroll={onShotsScroll}>
        {app.images.map((src, i) => (
          <button key={src} type="button" className="ph-shot" onClick={() => onOpen(project.id)} data-cursor="Open">
            <img src={src} alt={`${app.title}, screen ${i + 1}`} loading="lazy" draggable={false} />
          </button>
        ))}
      </div>

      <section className="ph-page-section">
        <h4>About</h4>
        <p>{project.summary}</p>
        {project.status && <p className="ph-page-status">{project.status}</p>}
      </section>

      <section className="ph-page-section">
        <h4>What I built</h4>
        <ul>
          {project.highlights.slice(0, 3).map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <section className="ph-page-section">
        <h4>Built with</h4>
        <div className="ph-page-tags">
          {project.tech.map((t) => (
            <span key={t} className="tech-chip">
              <TechLabel name={t} />
            </span>
          ))}
        </div>
      </section>

      <button type="button" className="ph-page-more" onClick={() => onOpen(project.id)} data-cursor="Open">
        Read the full case study <ArrowUpRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ProjectPhoneProps {
  appId: string | null;
  visible: Project[]; // what the current filter shows
  highlighted: boolean;
  onLaunch: (id: string) => void;
  onHome: () => void;
  onOpen: (id: string) => void;
}

export function ProjectPhone({ appId, visible, highlighted, onLaunch, onHome, onOpen }: ProjectPhoneProps) {
  const reduceMotion = useReducedMotion();
  const time = useClock();
  const app = APPS.find((a) => a.id === appId) ?? null;
  const shownApps = APPS.filter((a) => visible.some((v) => v.id === a.project.id));

  // The app grows out of its icon: work out where that icon sits (3 columns)
  const at = app ? APPS.indexOf(app) : 0;
  const origin = `${18 + (at % 3) * 32}% ${34 + Math.floor(at / 3) * 14}%`;

  return (
    <div id="project-phone" className={`ph card p-5 sm:p-8 ${highlighted ? "project-highlight" : ""}`}>
      <div className="ph-phone">
        <div className="ph-screen">
          <div className="ph-status">
            <span>{time}</span>
            <span aria-hidden="true">▮▮▮</span>
          </div>

          <div className="ph-home" aria-hidden={app ? true : undefined}>
            <div className="ph-clock">
              <span className="ph-clock-time">{time}</span>
              <span className="ph-clock-date">{phnomPenhDate()} · Phnom Penh</span>
            </div>
            <ul className="ph-grid">
              {APPS.map((a) => (
                <li key={a.id} className={shownApps.includes(a) ? "" : "is-dim"}>
                  <button
                    type="button"
                    className="ph-icon"
                    onClick={() => onLaunch(a.id)}
                    tabIndex={app ? -1 : 0}
                    data-cursor="Launch"
                    aria-label={`Launch ${a.title}`}
                  >
                    <AppLogo app={a} />
                    <span>{a.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <AnimatePresence>
            {app && (
              <motion.div
                key={app.id}
                className="ph-app"
                style={{ transformOrigin: origin }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.15 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.15 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <AppPage app={app} onBack={onHome} onOpen={onOpen} />
                {/* Launch screen, like the app's native splash: its colour and logo, held for a
                    moment, then the app appears */}
                {!reduceMotion && (
                  <motion.div
                    className="ph-splash"
                    style={{ background: app.splash?.bg ?? LOGOS[app.id]?.bg ?? "var(--bg)" }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 1.1, duration: 0.25 }}
                    aria-hidden="true"
                  >
                    <SplashLogo app={app} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {app ? (
            <button type="button" className="ph-homebar is-button" onClick={onHome} aria-label="Go to the home screen" />
          ) : (
            <span className="ph-homebar" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="ph-info">
        <span className="eyebrow">Try it</span>
        <h3 className="heading mt-4 text-3xl sm:text-4xl text-fg">My work, as apps</h3>
        <p className="mt-3 max-w-lg text-muted leading-relaxed">
          Launch a project on the phone, or from this list, to see its screens and what I built.
        </p>
        <ul className="ph-index mt-6">
          {shownApps.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`ph-index-row ${a.id === appId ? "is-active" : ""}`}
                onClick={() => (a.id === appId ? onHome() : onLaunch(a.id))}
                aria-pressed={a.id === appId}
                data-cursor="Launch"
              >
                <AppLogo app={a} className="ph-index-logo" />
                <span className="min-w-0">
                  <span className="block font-semibold text-fg truncate">{a.title}</span>
                  <span className="block text-xs text-muted truncate">
                    {a.project.role} · {a.project.year}
                  </span>
                </span>
                {a.stat && (
                  <span className="ph-index-stat hidden sm:block text-xs text-muted text-right">
                    <span className="text-accent font-semibold">{a.stat.value}</span> {a.stat.label}
                  </span>
                )}
                <ChevronRight size={16} className="text-muted flex-shrink-0" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
