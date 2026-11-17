import { ArrowRight, Briefcase, GraduationCap, MapPin, Plane, Sparkles, SquareTerminal } from "lucide-react";
import { useEffect, useState } from "react";
import Profile from "../../assets/Profile.png";
import { journey, profile } from "../data/profile";
import { openTerminalWindow } from "../events";
import { Reveal, SectionHeader } from "./Reveal";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const facts = [
  { icon: MapPin, label: "Based in", value: profile.location },
  { icon: GraduationCap, label: "Studying", value: `${profile.education} · ${profile.year}` },
  { icon: Briefcase, label: "Currently", value: profile.currently },
  { icon: Sparkles, label: "Focus", value: "Mobile apps, dashboards and the APIs behind them" },
];

function AboutSection() {
  const [greeting, setGreeting] = useState(() => greetingFor(new Date().getHours()));

  useEffect(() => {
    const id = setInterval(() => setGreeting(greetingFor(new Date().getHours())), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="about" className="relative py-24 sm:py-32 bg-bg-alt">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader index="01" eyebrow="About" title={<>A little about me</>} />

        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
          {/* Portrait + quick facts */}
          <Reveal>
            <div className="relative max-w-sm mx-auto lg:mx-0">
              <div className="only-persona">
                <div className="absolute inset-0 translate-x-4 translate-y-4 bg-accent" style={{ clipPath: "polygon(0 4%, 100% 0, 96% 100%, 3% 96%)" }} />
              </div>
              <div className="only-pop">
                <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[var(--radius)] bg-accent-2 border-[2.5px] border-line" />
              </div>
              <img
                src={Profile}
                alt={`Portrait of ${profile.name}`}
                className="relative w-full aspect-[4/5] object-cover rounded-[var(--radius)] [[data-theme=pop]_&]:border-[2.5px] [[data-theme=pop]_&]:border-line [[data-theme=editorial]_&]:grayscale-[35%] [[data-theme=persona]_&]:border-[3px] [[data-theme=persona]_&]:border-white [[data-theme=persona]_&]:-rotate-2"
              />
            </div>

            <dl className="card mt-8 p-5 grid gap-4 max-w-sm mx-auto lg:mx-0">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon size={18} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="text-sm font-medium text-fg">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Story + timeline */}
          <div>
            <Reveal>
              <p className="heading text-2xl sm:text-3xl text-fg !leading-snug !tracking-tight">
                {greeting}! I'm {profile.name.split(" ")[1]} — I like turning messy, real-world processes into apps
                that feel simple.
              </p>
              <p className="mt-5 text-muted leading-relaxed">
                I'm a fourth-year Computer Science student at the Cambodia Academy of Digital Technology. During my
                internship at MLMUPC I've worked across the whole stack: Flutter apps that officers use to check in and
                request leave, Angular dashboards for administrators, NestJS services, and even a Raspberry Pi
                connector that links face scanners to the HR system.
              </p>
              <p className="mt-4 text-muted leading-relaxed">
                I care about the details that make software pleasant to use — clear flows, fast screens, and interfaces
                in the language people actually speak.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-10">
              <a href="#journey" className="card card-hover tilt group flex items-center gap-4 p-5" data-cursor="Fly">
                <span className="icon-btn !w-12 !h-12 flex-shrink-0">
                  <Plane size={20} />
                </span>
                <span className="flex-1">
                  <span className="block heading text-xl sm:text-2xl text-fg">Fly through my journey</span>
                  <span className="block mt-1 text-sm text-muted">
                    From my first year at CADT to my internship at MLMUPC — {journey.length} stops along the way.
                  </span>
                </span>
                <ArrowRight size={18} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </a>
              <button
                type="button"
                onClick={openTerminalWindow}
                className="card card-hover tilt group mt-3 w-full flex items-center gap-4 p-5 text-left"
                data-cursor="Hack"
              >
                <span className="icon-btn !w-12 !h-12 flex-shrink-0">
                  <SquareTerminal size={20} />
                </span>
                <span className="flex-1">
                  <span className="block heading text-xl sm:text-2xl text-fg">Prefer the command line?</span>
                  <span className="block mt-1 text-sm text-muted">
                    Open my terminal and type <code className="font-mono text-accent">help</code> — or press the{" "}
                    <kbd className="font-mono">`</kbd> key anywhere.
                  </span>
                </span>
                <ArrowRight size={18} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
