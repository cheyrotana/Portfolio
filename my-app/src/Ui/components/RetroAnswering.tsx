// Retro theme, Contact (design C7): an answering machine, the third piece of the stereo set (the Skills
// receiver's walnut case and dark faceplate). The deck on the left has a MESSAGES counter and a REC lamp, a
// cassette whose reels turn while the chat is going, and the socials as speed-dial buttons; the chat itself
// (ContactForm, unchanged) fills the faceplate on the right and reports what it's doing so the deck can show
// it. Styles: .retro-am* in src/retro.css.
import { ArrowUpRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { socials } from "../data/profile";
import ContactForm, { type ChatActivity } from "./ContactForm";

const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export function RetroAnswering() {
  const [act, setAct] = useState<ChatActivity>({ yours: 0, typing: false, step: "name" });
  const [taken, setTaken] = useState(0); // messages sent from here, this visit
  const lastStep = useRef(act.step);

  const onActivity = useCallback((a: ChatActivity) => {
    if (a.step === "sent" && lastStep.current !== "sent") setTaken((n) => n + 1);
    lastStep.current = a.step;
    setAct(a);
  }, []);

  const sent = act.step === "sent";
  const recording = !sent && act.step !== "failed" && act.yours > 0;
  const lamp = sent ? "sent" : recording ? "rec" : "ready";
  const running = act.typing || recording;

  return (
    <div className="retro-am">
      <p className="retro-am-intro">
        Have an internship, a role or a project in mind, or just want to say hi? Leave a message after the tone and
        I'll get back to you.
      </p>

      <div className="retro-am-case">
        {/* The deck */}
        <div className="retro-am-deck">
          <div className="retro-am-counter" aria-hidden="true">
            <span className="retro-am-label">Messages</span>
            <b>{String(taken).padStart(2, "0")}</b>
            <span className="retro-am-lamp" data-state={lamp}>
              {lamp === "sent" ? "Sent" : lamp === "rec" ? "Rec" : "Ready"}
            </span>
          </div>

          <div className="retro-am-tapewell" aria-hidden="true">
            <span className="retro-am-tape" data-run={running}>
              <span className="retro-am-label">Incoming · Side A</span>
              <span className="retro-am-reels">
                <i />
                <i />
              </span>
            </span>
          </div>

          <p className="retro-am-label">Speed dial</p>
          <ul className="retro-am-dial">
            {socials.map(({ name, url, icon: Icon }, i) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noopener noreferrer" data-cursor="Visit">
                  <span className="retro-am-key" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="retro-am-who">
                    <b>
                      <Icon size={15} aria-hidden="true" />
                      {name}
                    </b>
                    <span>{shortUrl(url)}</span>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* The faceplate: the chat */}
        <div className="retro-am-plate">
          <p className="retro-am-head">
            <span className="retro-am-title">Leave a message</span>
          </p>
          <ContactForm onActivity={onActivity} />
        </div>
      </div>
    </div>
  );
}
