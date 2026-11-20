// Retro theme, the opening. The 3D room (RetroRoom) starts close on the record's label — my name, "Portfolio" —
// and pulls back into the listening room as you scroll; the hero's words fade in beside it. A tall section
// with a pinned stage, so the scroll has room to drive the camera. Styles: .room-hero* in src/retro-room.css.
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, Pause, Play } from "lucide-react";
import { useRef } from "react";
import { setBgm } from "../bgm";
import { profile, socials } from "../data/profile";
import { projects } from "../data/projects";
import { showProject } from "../events";
import { useBgmOn } from "../hooks/interactive";
import { play } from "../sound";

export function RetroMusicKey({ className = "" }: { className?: string }) {
  const playing = useBgmOn();
  return (
    <button
      type="button"
      className={`room-key ${className}`}
      onClick={() => {
        play("click");
        setBgm(!playing);
      }}
      aria-pressed={playing}
      aria-label={playing ? "Pause the music" : "Play the music"}
      data-cursor={playing ? "Pause" : "Play"}
    >
      {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      <span>{playing ? "Pause" : "Music"}</span>
    </button>
  );
}

export function RetroRoomHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const cue = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const cueEvents = useTransform(cue, (v) => (v > 0.4 ? "auto" : "none"));
  const copy = useTransform(scrollYProgress, [0.28, 0.5], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.28, 0.5], [36, 0]);
  const copyEvents = useTransform(copy, (v) => (v > 0.5 ? "auto" : "none"));
  const newest = projects[0];

  return (
    <section id="home" ref={ref} className="room-hero relative" aria-label="Introduction">
      <div className="room-hero-stage">
        {/* the first screen: just the record, and how to go in */}
        <motion.div className="room-cue" style={{ opacity: cue, pointerEvents: cueEvents }}>
          <p className="room-cue-hint">
            <ArrowDown size={16} aria-hidden="true" className="room-bob" /> Scroll to step into the room
          </p>
          <div className="room-cue-keys">
            <RetroMusicKey />
            <a href="#about" className="room-key is-quiet" data-jump>
              Skip in <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </motion.div>

        {/* once the room is in view */}
        <motion.div className="room-hero-copy" style={{ opacity: copy, y: copyY, pointerEvents: copyEvents }}>
          <p className="room-kicker">Portfolio · {profile.location}</p>
          <h1 className="room-hero-name">
            Chey
            <br />
            Rotana
          </h1>
          <p className="room-hero-role">{profile.role}</p>
          <p className="room-hero-now">
            {profile.currently} · {profile.internship}
          </p>
          <div className="room-hero-actions">
            <a href="#work" className="btn btn-primary" data-jump>
              See my work <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#contact" className="btn" data-jump>
              Get in touch
            </a>
            <span className="room-hero-socials">
              {socials.map(({ name, url, icon: Icon }) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}>
                  <Icon size={18} />
                </a>
              ))}
            </span>
          </div>
          {newest && (
            <button
              type="button"
              className="room-now-playing"
              onClick={() => {
                play("tick");
                showProject(newest.id);
              }}
              data-cursor="Open"
            >
              <span className="room-now-disc" aria-hidden="true" />
              <span>
                <span className="room-cond">Now playing · newest work</span>
                <b>{newest.title}</b>
                {newest.stat && (
                  <span className="room-now-stat">
                    {newest.stat.value} {newest.stat.label}
                  </span>
                )}
              </span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
