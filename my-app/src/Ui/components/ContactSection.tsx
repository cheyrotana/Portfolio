import { ArrowUp, ArrowUpRight } from "lucide-react";
import { NAV_SECTIONS } from "../data/sections";
import { profile, socials } from "../data/profile";
import ContactForm from "./ContactForm";
import { P5Burst, P5Slab } from "./PersonaDecor";
import { P5Clouds } from "./Weather";
import { Ransom } from "./Ransom";
import { Reveal, SectionHeader } from "./Reveal";
import { RetroEq } from "./RetroDecor";
import { RetroAnswering } from "./RetroAnswering";
import { useThemeAttr } from "../hooks/interactive";
import { RETRO_ROOM } from "../retroRoomBus";

function ContactSection() {
  // Retro: the answering machine, the third piece of the stereo set (components/RetroAnswering.tsx)
  const machine = useThemeAttr() === "retro" && !RETRO_ROOM;
  return (
    <footer id="contact" className="relative overflow-hidden">
      <div className="bg-decor absolute inset-0 pointer-events-none rotate-180 not-persona-block" aria-hidden="true" />
      <P5Slab side="right" />
      <P5Clouds count={5} seed={6} />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-24 sm:py-32">
        <SectionHeader
          index="05"
          eyebrow="Contact"
          title={
            <>
              <span className="not-persona">
                Let's build something <span className="accent-text">together</span>.
              </span>
              <span className="only-persona">
                <Ransom text="Send me a calling card" seed={5} />
              </span>
            </>
          }
        />

        {machine ? (
          <RetroAnswering />
        ) : (
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
          <Reveal className="min-w-0">
            <p className="text-lg text-muted leading-relaxed">
              Have an internship, a role or a project in mind — or just want to say hi? Send a message and I'll get
              back to you.
            </p>

            <ul className="mt-8 space-y-3">
              {socials.map(({ name, url, icon: Icon }) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card card-hover tilt group flex items-center gap-4 px-5 py-4"
                    data-cursor="Visit"
                  >
                    <span className="icon-btn !w-11 !h-11 group-hover:!text-accent">
                      <Icon size={20} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-fg">{name}</span>
                      <span className="block text-sm text-muted truncate">{url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
                    </span>
                    <ArrowUpRight size={18} className="text-muted transition-transform group-hover:rotate-45 group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="calling-card">
            <P5Burst className="p5-burst-corner p5-burst-br" />
            <span className="only-persona">
              <span className="calling-card-tag" aria-hidden="true">Calling card</span>
            </span>
            <span className="only-retro">
              <span className="retro-jukebox-top" aria-hidden="true">
                <span className="retro-jukebox-arch">
                  <RetroEq className="retro-jukebox-eq" />
                </span>
                <span className="retro-request-head">
                  <span className="retro-request-code">05</span>
                  <span className="retro-request-title">
                    <small>Contact</small>
                    Send me a message
                  </span>
                </span>
              </span>
            </span>
            <span className="only-metro">
              <span className="metro-tm-head" aria-hidden="true">
                <span className="metro-badge">R</span>
                <span className="metro-tm-title">
                  <small>Rotana Line</small>
                  Tickets &amp; messages
                </span>
                <span className="metro-tm-service">
                  <span className="metro-live-dot" />
                  In service
                </span>
              </span>
            </span>
            <ContactForm />
          </Reveal>
        </div>
        )}
      </div>

      {/* Bottom strip: name, section links, back to top */}
      <div className="site-foot relative">
        <span className="site-foot-slab" aria-hidden="true" />
        <div className="site-foot-inner relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="site-foot-sign">
            <p className="site-foot-name">
              {profile.name}
              <span className="site-foot-year">&copy; {new Date().getFullYear()}</span>
            </p>
          </div>

          <nav className="site-foot-links" aria-label="Footer">
            {NAV_SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="site-foot-link">
                {s.label}
              </a>
            ))}
          </nav>

          <a href="#home" className="site-foot-top" data-cursor="Top">
            <span>Back to top</span>
            <ArrowUp size={16} strokeWidth={2.6} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default ContactSection;
