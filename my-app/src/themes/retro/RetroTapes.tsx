// Retro theme, Skills (design S4): the whole section is one 70s hi-fi receiver, like the one in the room.
// The amber dial is the group picker ("All tools" first) and a red needle slides to the group you pick; the
// screen says what you're tuned to and lists each tool (its real logo) with the projects it was used in (each
// opens that project); the receiver's display strip at the bottom scrolls every tool's logo. Arrow keys work
// on the dial. Styles: .retro-rx* in styles/skills.css.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { track } from "../../lib/achievements";
import { skillGroups, type Skill } from "../../data/profile";
import { projects, type Project } from "../../data/projects";
import { openProject } from "../../lib/events";
import { play } from "../../lib/sound";

// Where each tool was actually used, from the project data (no made-up skill levels).
const usedIn = (skill: Skill) => projects.filter((p) => p.tech.includes(skill.name));

// A project's app icon (HRM's comes from its first build); none: a tile with its initials
const iconOf = (p: Project) => p.logo ?? p.apps?.[0]?.logo;
const initials = (title: string) =>
  title
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

const allTools = skillGroups.flatMap((g) => g.skills);
// The dial, left to right: "all", then each group by index
const STATIONS: ("all" | number)[] = ["all", ...skillGroups.map((_, i) => i)];
// Short names on the dial (the screen shows the full name)
const dialName = (title: string) => title.split(" ")[0];
// Each station's spot on the FM band (the dial's numbers and the readout), and its signal: how full it is
const FREQ = ["88.1", "91.5", "95.3", "99.7", "103.9", "107.1"];
const MAX_TOOLS = Math.max(...skillGroups.map((g) => g.skills.length));

export function RetroTapes() {
  const [pos, setPos] = useState(0); // "All tools" first, like the other themes
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const n = STATIONS.length;

  const tune = (to: number, focus = false) => {
    const next = (to + n) % n;
    const s = STATIONS[next];
    if (s !== "all") track("skill-groups", skillGroups[s].title, skillGroups.length, "juggler");
    if (next === pos) return;
    play("tick");
    setPos(next);
    if (focus) tabsRef.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const next = forward ? pos + 1 : back ? pos - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (next === null) return;
    e.preventDefault();
    tune(next, true);
  };

  return (
    <div className="retro-rx">
      <div className="retro-rx-face">
        {/* The dial */}
        <div className="retro-rx-dial" style={{ "--at": (pos + 0.5) / n } as CSSProperties}>
          <span className="retro-rx-mhz" aria-hidden="true">
            {FREQ.map((f) => (
              <span key={f}>{Math.round(Number(f))}</span>
            ))}
          </span>
          <span className="retro-rx-scale" aria-hidden="true" />
          <div className="retro-rx-stations" role="tablist" aria-label="Skill groups" onKeyDown={onKeyDown}>
            {STATIONS.map((s, i) => (
              <button
                key={s === "all" ? "all" : skillGroups[s].title}
                ref={(el) => {
                  tabsRef.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`rx-tab-${i}`}
                aria-selected={i === pos}
                aria-controls="rx-panel"
                tabIndex={i === pos ? 0 : -1}
                className="retro-rx-station"
                onClick={() => tune(i)}
                data-cursor="Tune"
              >
                {s === "all" ? "All tools" : dialName(skillGroups[s].title)}
              </button>
            ))}
          </div>
          <span className="retro-rx-needle" aria-hidden="true" />
        </div>

        <div className="retro-rx-main">
          {/* What it's tuned to */}
          <div
            className="retro-rx-info"
            style={
              {
                "--sig": STATIONS[pos] === "all" ? 1 : skillGroups[STATIONS[pos] as number].skills.length / MAX_TOOLS,
                "--turn": `${pos * 54 - 135}deg`,
              } as CSSProperties
            }
          >
            <div className="retro-rx-lamps" aria-hidden="true">
              <span className="retro-rx-lamp is-tuned">Tuned</span>
              <span className="retro-rx-lamp is-stereo">Stereo</span>
            </div>
            <p className="retro-rx-freq" aria-hidden="true">
              <small>FM</small>
              {FREQ[pos]}
              <small>MHz</small>
            </p>
            <p className="retro-rx-label">Now tuned to</p>
            <div className="retro-rx-stack">
              {STATIONS.map((s, i) => {
                const g = s === "all" ? null : skillGroups[s];
                return (
                  <div key={i} className="retro-rx-layer" data-on={i === pos} aria-hidden={i !== pos}>
                    <h3 className="retro-rx-title">{g ? g.title : "All tools"}</h3>
                    <p className="retro-rx-blurb">{g ? g.blurb : "Everything I work with, in one view."}</p>
                    <p className="retro-rx-count">
                      {g ? `${g.skills.length} tools` : `${allTools.length} tools · ${skillGroups.length} groups`}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="retro-rx-meter" aria-hidden="true">
              <span className="retro-rx-meter-face">
                <span className="retro-rx-meter-needle" />
              </span>
              <span className="retro-rx-label">Signal</span>
            </div>
            <div className="retro-rx-tuning">
              <button type="button" className="retro-rx-knob" onClick={() => tune(pos - 1)} aria-label="Previous group">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span className="retro-rx-knobwrap" aria-hidden="true">
                {STATIONS.map((_, i) => (
                  <span
                    key={i}
                    className="retro-rx-tick"
                    data-on={i === pos}
                    style={{ "--a": `${i * 54 - 135}deg` } as CSSProperties}
                  />
                ))}
                <span className="retro-rx-dialknob">
                  <span />
                </span>
              </span>
              <button type="button" className="retro-rx-knob" onClick={() => tune(pos + 1)} aria-label="Next group">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
              <span className="retro-rx-label" aria-hidden="true">
                Tuning
              </span>
            </div>
          </div>

          {/* The screen */}
          <div className="retro-rx-screen" id="rx-panel" role="tabpanel" aria-labelledby={`rx-tab-${pos}`}>
            <div className="retro-rx-stack">
              {STATIONS.map((s, i) => {
                const group = s === "all" ? null : skillGroups[s];
                return (
              <div key={i} className="retro-rx-layer" data-on={i === pos} aria-hidden={i !== pos}>
                {group ? (
                  <>
                    <p className="retro-rx-cols retro-rx-label" aria-hidden="true">
                      <span>Tool</span>
                      <span>Used in</span>
                    </p>
                    <ul className="retro-rx-tools">
                      {group.skills.map((skill) => {
                        const { name, icon: Icon } = skill;
                        const used = usedIn(skill);
                        return (
                          <li key={name}>
                            <span className="retro-rx-tool">
                              <span className="retro-rx-logo" aria-hidden="true">
                                <Icon />
                              </span>
                              {name}
                            </span>
                            <span className="retro-rx-used">
                              {skill.everywhere ? (
                                <span className="retro-rx-every">
                                  <span className="retro-rx-every-icons" aria-hidden="true">
                                    {projects.map((p) => {
                                      const icon = iconOf(p);
                                      return (
                                        <span key={p.id} className="retro-rx-app-icon" title={p.title}>
                                          {icon ? <img src={icon} alt="" loading="lazy" /> : initials(p.title)}
                                        </span>
                                      );
                                    })}
                                  </span>
                                  <span className="retro-rx-app-name">Every project</span>
                                </span>
                              ) : used.length > 0 ? (
                                used.map((p) => {
                                  const icon = iconOf(p);
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="retro-rx-app"
                                      onClick={() => openProject(p.id)}
                                      data-cursor="Open"
                                      aria-label={`${name} was used in ${p.title}: open the project`}
                                    >
                                      <span className="retro-rx-app-icon" aria-hidden="true">
                                        {icon ? <img src={icon} alt="" loading="lazy" /> : initials(p.title)}
                                      </span>
                                      <span className="retro-rx-app-name">{p.title}</span>
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="retro-rx-none" aria-label="Not in a listed project">
                                  —
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <ul className="retro-rx-all">
                    {skillGroups.map((g) => (
                      <li key={g.title}>
                        <span className="retro-rx-label">{g.title}</span>
                        <span className="retro-rx-tags">
                          {g.skills.map(({ name, icon: Icon }) => (
                            <span key={name} className="retro-rx-tag">
                              <span className="retro-rx-logo is-small" aria-hidden="true">
                                <Icon />
                              </span>
                              {name}
                            </span>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* The display strip: every tool's logo */}
        <div className="retro-rx-strip" aria-hidden="true">
          <div className="retro-rx-marquee">
            {[0, 1].map((copy) => (
              <span key={copy} className="retro-rx-run">
                {allTools.map(({ name, icon: Icon }) => (
                  <span key={name} className="retro-rx-logo" title={name}>
                    <Icon />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
