import { ArrowUp, ArrowUpRight } from "lucide-react";
import { profile, socials } from "../data/profile";
import ContactForm from "./ContactForm";
import { Reveal, SectionHeader } from "./Reveal";

function ContactSection() {
  return (
    <footer id="contact" className="relative overflow-hidden">
      <div className="bg-decor absolute inset-0 pointer-events-none rotate-180" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-24 sm:py-32">
        <SectionHeader
          index="05"
          eyebrow="Contact"
          title={
            <>
              Let's build something <span className="accent-text">together</span>.
            </>
          }
        />

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
          <Reveal>
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
                    <span className="flex-1">
                      <span className="block font-semibold text-fg">{name}</span>
                      <span className="block text-sm text-muted truncate">{url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
                    </span>
                    <ArrowUpRight size={18} className="text-muted transition-transform group-hover:rotate-45 group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </div>

      <div className="relative border-t border-line [[data-theme=pop]_&]:border-t-[2.5px]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>
            &copy; {new Date().getFullYear()} {profile.name}. Built with React, Tailwind CSS &amp; Framer Motion.
          </p>
          <a href="#home" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
            Back to top <ArrowUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default ContactSection;
