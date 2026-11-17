import { motion } from "framer-motion";
import { useRef } from "react";
import { unlock } from "../achievements";
import { skillGroups } from "../data/profile";
import { play } from "../sound";
import { Reveal, SectionHeader } from "./Reveal";

// Bento layout: the first two groups get wider tiles on large screens.
const spans = ["lg:col-span-2", "lg:col-span-4", "lg:col-span-3", "lg:col-span-3", "lg:col-span-6"];

// A box of tool chips you can grab and throw around; they bounce off the walls.
function Playground() {
  const boxRef = useRef<HTMLDivElement>(null);
  const throws = useRef(0);
  const tools = skillGroups.flatMap((g) => g.skills);

  return (
    <Reveal className="mt-5">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="heading text-xl text-fg">Playground</h3>
          <p className="text-sm text-muted">Grab a tool and throw it 🤹</p>
        </div>
        <div
          ref={boxRef}
          className="playground relative mt-4 h-60 sm:h-64 overflow-hidden rounded-[var(--radius-sm)] bg-surface-2 border border-line"
        >
          {tools.map(({ name, icon: Icon, color }, i) => (
            <motion.div
              key={name}
              drag
              dragConstraints={boxRef}
              dragElastic={0.35}
              dragTransition={{ bounceStiffness: 260, bounceDamping: 14, power: 0.4, timeConstant: 280 }}
              whileHover={{ scale: 1.06 }}
              whileDrag={{ scale: 1.15, rotate: i % 2 ? 8 : -8, zIndex: 20 }}
              onDragEnd={() => {
                throws.current += 1;
                play("pop");
                if (throws.current >= 5) unlock("juggler");
              }}
              className="playground-chip absolute flex items-center gap-2 px-3 py-2 text-sm font-semibold text-fg cursor-grab active:cursor-grabbing select-none touch-none"
              style={{ left: `${4 + ((i * 23) % 78)}%`, top: `${6 + ((i * 37) % 72)}%` }}
              data-cursor="Throw"
            >
              <Icon size={18} style={{ color: color ?? "currentColor" }} />
              {name}
            </motion.div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function SkillsSection() {
  const all = skillGroups.flatMap((g) => g.skills);

  return (
    <section id="skills" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          index="03"
          eyebrow="Skills"
          title="Tools I build with"
          intro="From the phone in an officer's hand to the database behind it — these are the tools I reach for."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
          {skillGroups.map((group, gi) => (
            <Reveal key={group.title} delay={gi * 0.06} className={spans[gi]}>
              <div className="card card-hover tilt h-full p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="heading text-xl text-fg">{group.title}</h3>
                  <span className="font-mono text-xs text-muted">{String(group.skills.length).padStart(2, "0")}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{group.blurb}</p>
                <ul className="mt-5 flex flex-wrap gap-2.5">
                  {group.skills.map(({ name, icon: Icon, color }) => (
                    <li
                      key={name}
                      className="group/skill flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-surface-2 border border-line text-sm font-medium text-fg transition-transform hover:-translate-y-0.5 [[data-theme=pop]_&]:border-2"
                    >
                      <Icon
                        size={18}
                        className="transition-colors [[data-theme=editorial]_&]:!text-fg [[data-theme=editorial]_&]:group-hover/skill:!text-accent"
                        style={{ color: color ?? "currentColor" }}
                      />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Playground />
      </div>

      {/* Scrolling strip of every tool */}
      <div className="mt-16 border-y border-line py-5 overflow-hidden [[data-theme=pop]_&]:bg-accent-2 [[data-theme=pop]_&]:border-y-[2.5px] [[data-theme=pop]_&]:-rotate-1 [[data-theme=persona]_&]:bg-accent [[data-theme=persona]_&]:border-y-[3px] [[data-theme=persona]_&]:-rotate-2 [[data-theme=persona]_&]:scale-105">
        <div className="animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10 pr-10 flex-shrink-0" aria-hidden={copy === 1}>
              {[...all, ...all].map(({ name, icon: Icon }, i) => (
                <span
                  key={`${name}-${i}`}
                  className="flex items-center gap-3 heading text-2xl sm:text-3xl text-muted whitespace-nowrap [[data-theme=pop]_&]:text-white [[data-theme=persona]_&]:text-white"
                >
                  <Icon size={26} />
                  {name}
                  <span className="text-accent [[data-theme=pop]_&]:text-white [[data-theme=persona]_&]:text-black">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SkillsSection;
