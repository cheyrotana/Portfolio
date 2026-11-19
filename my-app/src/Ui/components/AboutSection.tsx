import { ArrowRight, Briefcase, GraduationCap, MapPin, Plane, Sparkles, SquareTerminal } from "lucide-react";
import { useEffect, useState } from "react";
import { journey, profile } from "../data/profile";
import { openTerminalWindow } from "../events";
import { P5Burst, P5Skyline, P5Slab } from "./PersonaDecor";
import { P5Clouds } from "./Weather";
import { Reveal, SectionHeader } from "./Reveal";
import { RetroCredits } from "./RetroDecor";
import { RetroPolaroid } from "./RetroPolaroid";

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
    <section id="about" className="has-skyline relative py-24 sm:py-32 bg-bg-alt overflow-hidden">
      <P5Slab side="left" />
      <P5Clouds count={5} to={72} seed={2} />
      <P5Skyline />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader index="01" eyebrow="About" title="A little about me" />

        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
          {/* Quick facts */}
          <Reveal className="relative">
            <P5Burst className="p5-burst-corner p5-burst-tl" />
            <span className="only-retro">
              <RetroPolaroid />
              <RetroCredits />
            </span>
            <dl className="card relative p-6 grid gap-5 max-w-md mx-auto lg:mx-0 not-retro-block">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon size={18} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="text-base font-medium text-fg">{value}</dd>
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
                three-month internship with the Digital Revolution team at MLMUPC I worked across the whole stack: Flutter apps that officers use to check in and
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
                    <kbd className="font-mono">Alt</kbd>+<kbd className="font-mono">T</kbd> anywhere.
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
