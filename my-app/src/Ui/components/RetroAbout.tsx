// Retro theme, About (design A3): the polaroid pinned to the wood on the left; beside it a short story,
// four facts as labels and two chunky keys (journey, terminal). Styles: .retro-about* in src/retro.css.
import { ArrowRight, SquareTerminal } from "lucide-react";
import { profile } from "../data/profile";
import { openTerminalWindow } from "../events";
import { Reveal, SectionHeader } from "./Reveal";
import { RetroPolaroid } from "./RetroPolaroid";

const facts = [
  { k: "Based in", v: profile.location.split(",")[0] },
  { k: "Studying", v: "CADT · Year 4" },
  { k: "Internship", v: "3 months · MLMUPC" },
  { k: "Focus", v: "Apps, dashboards, APIs" },
];

export function RetroAbout({ greeting }: { greeting: string }) {
  return (
    <div className="retro-about">
      <Reveal className="retro-about-photo">
        <RetroPolaroid />
      </Reveal>

      <div>
        <SectionHeader index="01" eyebrow="About" title="A little about me" />
        <Reveal>
          <p className="retro-about-lead">
            {greeting}! I'm {profile.name.split(" ")[1]}. I turn messy, real-world processes into apps that feel simple.
          </p>
          <p className="retro-about-body">
            Fourth-year Computer Science student at CADT. During a three-month internship with the Digital Revolution
            team at MLMUPC I built Flutter apps, Angular dashboards, NestJS services and a Raspberry Pi face-scan
            connector.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="retro-about-facts">
            {facts.map((f) => (
              <li key={f.k}>
                <span className="retro-cond">{f.k}</span>
                {f.v}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.12} className="retro-about-keys">
          <a href="#journey" className="btn btn-primary" data-cursor="Fly">
            Fly through my journey
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <button type="button" className="btn" onClick={openTerminalWindow} data-cursor="Hack">
            <SquareTerminal size={18} aria-hidden="true" />
            Open my terminal
            <kbd>Alt+T</kbd>
          </button>
        </Reveal>
      </div>
    </div>
  );
}
