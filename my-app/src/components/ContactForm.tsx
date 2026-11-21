import emailjs from "@emailjs/browser";
import avatar from "../assets/me/avatar.jpg";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { RotateCcw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { unlock } from "../lib/achievements";
import { play } from "../lib/sound";
import { MetroTicketPrompt, MetroTicketSlot, type PrintedTicket } from "../themes/metro/MetroTicket";

// EmailJS settings (unchanged from the original contact form).
const SERVICE_ID = "service_n31f1lt";
const TEMPLATE_ID = "template_jh510rc";
const PUBLIC_KEY = "zuC8j77Q0CqjMRaNQ";

export type Step = "name" | "email" | "message" | "confirm" | "sending" | "sent" | "failed";

/** What the chat is doing, for a theme that shows it (Retro's answering machine) */
export interface ChatActivity {
  yours: number; // lines the visitor has written
  typing: boolean; // Rotana is typing a reply
  step: Step;
}

interface Bubble {
  id: number;
  from: "me" | "you";
  text: string;
}

// Finds an email address anywhere in a reply ("sure, it's dara@mail.com")
const EMAIL_IN = /[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}/i;

const GREETING = /^(?:hi+|hello|hey+|yo|hiya|howdy|good\s+(?:morning|afternoon|evening)|sua\s*s(?:dei|day))\b(?:\s+there)?[\s,!.]*/i;
const INTRO =
  /^(?:(?:my\s+)?name(?:'s|\s+is)|i'?m|i\s+am|it'?s|this\s+is|(?:you\s+can\s+)?call\s+me|they\s+call\s+me)\s+/i;
const NOT_A_NAME = /^(?:hi|hello|hey|yes|yeah|no|ok|okay|sure|thanks|idk|none|nothing|why|what)$/i;

/** Pulls the name out of a reply like "hi, my name is dara" → "Dara". null when there isn't one. */
function parseName(raw: string): string | null {
  let t = raw.trim().replace(GREETING, "").trim();
  const introduced = INTRO.test(t);
  t = t.replace(INTRO, "");
  // stop at the end of the name: "Dara, nice to meet you" / "Dara and I'm a recruiter"
  t = t.split(/[,.!?;:()]|\s+(?:and|but|here|from|nice|i'?m|im|i\s+am|a|an|the)\b/i)[0];
  t = t.replace(/[^\p{L}\p{M}'\- ]/gu, "").trim();
  const words = t.split(/\s+/).filter(Boolean);
  // a long sentence with no "my name is" is probably not a name
  if (!words.length || (!introduced && words.length > 4)) return null;
  if (words.length === 1 && NOT_A_NAME.test(words[0])) return null;
  return words
    .slice(0, 3)
    .map((w) => w.charAt(0).toLocaleUpperCase() + w.slice(1))
    .join(" ");
}

// Bubbles pop in from their own side with a soft spring; the rows above slide up to make room (layout),
// and the typing dots leave the flow at once (popLayout) so the reply takes their place without a jump.
const BUBBLE_IN = { opacity: 0, y: 14, scale: 0.94 };
const BUBBLE_SHOWN = { opacity: 1, y: 0, scale: 1 };
const SPRING = { type: "spring", stiffness: 520, damping: 36, mass: 0.7 } as const;
const FADE_ONLY = { opacity: 0 };

// A contact form that feels like a chat: one question at a time.
function ContactForm({ onActivity }: { onActivity?: (a: ChatActivity) => void } = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const counter = useRef(0);
  const started = useRef(false);
  const timers = useRef<number[]>([]);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step>("name");
  const [input, setInput] = useState("");
  const [data, setData] = useState({ name: "", email: "", message: "" });
  const [ticket, setTicket] = useState<PrintedTicket | null>(null); // Metro: the ticket the machine prints

  const yours = bubbles.filter((b) => b.from === "you").length;
  useEffect(() => {
    onActivity?.({ yours, typing, step });
  }, [onActivity, yours, typing, step]);

  const add = (from: Bubble["from"], text: string) =>
    setBubbles((b) => [...b, { id: ++counter.current, from, text }]);

  // "Me" replies after a short typing pause. Pending replies are cancelled on a restart.
  const say = useCallback((texts: string[], then?: () => void) => {
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    let delay = 0;
    texts.forEach((text, i) => {
      delay += 450 + Math.min(900, text.length * 12);
      later(() => setTyping(true), delay - 420);
      later(() => {
        setTyping(false);
        setBubbles((b) => [...b, { id: ++counter.current, from: "me", text }]);
        play("pop");
        if (i === texts.length - 1) then?.();
      }, delay);
    });
  }, []);

  // Start the conversation once the chat scrolls into view.
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    say(["Hi! I'm Rotana.", "What's your name?"]);
  }, [inView, say]);

  // keep the newest message in view (one scroll per change, after the new row is laid out)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [bubbles, typing, step, reduceMotion]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const restart = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current.length = 0;
    setTyping(false);
    setBubbles([]);
    setData({ name: "", email: "", message: "" });
    setTicket(null);
    setStep("name");
    setInput("");
    say(["Let's start again.", "What's your name?"]);
  };

  const send = async (payload = data) => {
    setStep("sending");
    setTyping(true);
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        { from_name: payload.name, from_email: payload.email, message: payload.message },
        PUBLIC_KEY,
      );
      setTyping(false);
      setStep("sent");
      setTicket({
        no: 1 + Math.floor(Math.random() * 9998),
        name: payload.name,
        message: payload.message,
        when: new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Phnom_Penh",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      });
      play("send");
      unlock("penpal");
      say([`Sent! Thanks, ${payload.name}. I'll reply to ${payload.email} soon.`]);
    } catch (err) {
      // EmailJS rejects with { status, text }, e.g. 412 "Gmail_API: Invalid grant" when the Gmail link
      // in the EmailJS dashboard needs reconnecting, or 426 when the monthly quota is used up
      const e = err as { status?: number; text?: string };
      console.error("[contact] EmailJS send failed:", e?.status, e?.text ?? err);
      setTyping(false);
      setStep("failed");
      say(["Hmm, that didn't go through. Want to try again?"]);
    }
  };

  const submit = () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    add("you", text);
    play("click");

    if (step === "name") {
      const name = parseName(text);
      if (!name) {
        say([
          EMAIL_IN.test(text)
            ? "Thanks! I'll ask for that next. First, what should I call you?"
            : "Hi! And what should I call you?",
        ]);
        return;
      }
      setData((d) => ({ ...d, name }));
      setStep("email");
      say([`Nice to meet you, ${name}!`, "What's your email, so I can write back?"]);
    } else if (step === "email") {
      const email = text.match(EMAIL_IN)?.[0].replace(/\.$/, "");
      if (!email) {
        say(["Hmm, I couldn't find an email address in that — mind checking it?"]);
        return;
      }
      setData((d) => ({ ...d, email }));
      setStep("message");
      say(["Got it.", "What would you like to talk about? An internship, a role, a project — anything."]);
    } else if (step === "message") {
      setData((d) => ({ ...d, message: text }));
      setStep("confirm");
      say(["Thanks! Ready for me to send this?"]);
    }
  };

  const placeholder =
    step === "name" ? "Your name…" : step === "email" ? "you@example.com" : step === "message" ? "Type your message…" : "";
  const canType = step === "name" || step === "email" || step === "message";

  return (
    <>
      <MetroTicketPrompt step={step} />
      <div ref={rootRef} className="chat card flex flex-col h-[480px] overflow-hidden">
        {/* Header */}
        <div className="chat-head flex items-center gap-3 px-5 py-3.5 border-b border-line">
          <span className="chat-head-text flex-1 min-w-0">
            <span className="chat-head-tag" aria-hidden="true">
              Direct line
            </span>
            <span className="chat-title block font-semibold text-fg">Chat with Rotana</span>
            <span className="chat-status flex items-center gap-1.5 text-xs text-muted">
              <span className="chat-online w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Messages go straight to my inbox
            </span>
          </span>
          {bubbles.length > 2 && (
            <button
              type="button"
              className="chat-restart icon-btn !w-9 !h-9"
              onClick={restart}
              aria-label="Start over"
              data-cursor="Restart"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
  
        {/* Conversation */}
        <motion.div
          ref={scrollRef}
          layoutScroll
          className="relative flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-2.5"
          aria-live="polite"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {bubbles.map((b, i) => (
              <motion.div
                key={b.id}
                layout={reduceMotion ? false : "position"}
                className={`chat-row flex items-start gap-2 ${b.from === "you" ? "justify-end is-you" : "justify-start is-me"}`}
                style={{ transformOrigin: b.from === "you" ? "100% 100%" : "0% 100%" }}
                initial={reduceMotion ? FADE_ONLY : BUBBLE_IN}
                animate={BUBBLE_SHOWN}
                transition={reduceMotion ? { duration: 0.2 } : SPRING}
              >
                {/* my face beside the first of my messages in a row (shown in Persona) */}
                {b.from === "me" && (
                  <span className={`chat-pic chat-face ${bubbles[i - 1]?.from === "me" ? "is-hidden" : ""}`}>
                    <img src={avatar} alt="" />
                  </span>
                )}
                <span className="chat-shape">
                  <p className={`chat-bubble ${b.from === "you" ? "chat-you" : "chat-me"} whitespace-pre-wrap`}>{b.text}</p>
                </span>
              </motion.div>
            ))}
  
            {step === "confirm" && !typing && (
              <motion.div
                key="summary"
                layout={reduceMotion ? false : "position"}
                className="flex justify-start"
                style={{ transformOrigin: "0% 100%" }}
                initial={reduceMotion ? FADE_ONLY : BUBBLE_IN}
                animate={BUBBLE_SHOWN}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={reduceMotion ? { duration: 0.2 } : SPRING}
              >
                <div className="chat-summary chat-bubble chat-me w-full max-w-[90%] space-y-1">
                  <p className="text-xs text-muted">From</p>
                  <p className="font-semibold">
                    {data.name} · {data.email}
                  </p>
                  <p className="text-xs text-muted pt-1">Message</p>
                  <p className="whitespace-pre-wrap">{data.message}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button type="button" className="btn btn-primary !py-2" onClick={() => void send()}>
                      Send it <Send size={14} />
                    </button>
                    <button type="button" className="btn btn-ghost !py-2" onClick={restart}>
                      Start over
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
  
            {typing && (
              <motion.div
                key="typing"
                layout={reduceMotion ? false : "position"}
                className="chat-row is-me flex items-start gap-2 justify-start"
                style={{ transformOrigin: "0% 100%" }}
                initial={reduceMotion ? FADE_ONLY : BUBBLE_IN}
                animate={BUBBLE_SHOWN}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                transition={reduceMotion ? { duration: 0.2 } : SPRING}
              >
                <span className={`chat-pic chat-face ${bubbles[bubbles.length - 1]?.from === "me" ? "is-hidden" : ""}`}>
                  <img src={avatar} alt="" />
                </span>
                <span className="chat-shape">
                  <span className="chat-bubble chat-me flex items-center gap-1 !py-3" aria-label="Typing">
                    {/* bob in CSS (index.css .chat-dot), not three JS animations */}
                    <span className="chat-dot w-1.5 h-1.5 rounded-full bg-muted" />
                    <span className="chat-dot w-1.5 h-1.5 rounded-full bg-muted" />
                    <span className="chat-dot w-1.5 h-1.5 rounded-full bg-muted" />
                  </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
  
        {/* Input */}
        <div className="chat-foot border-t border-line p-3">
          {step === "failed" ? (
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary flex-1" onClick={() => void send()}>
                Try again
              </button>
              <button type="button" className="btn btn-ghost" onClick={restart}>
                Start over
              </button>
            </div>
          ) : step === "sent" ? (
            <button type="button" className="btn btn-ghost w-full" onClick={restart}>
              Send another message
            </button>
          ) : (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={step === "message" ? 3 : 1}
                placeholder={canType ? placeholder : "…"}
                // read-only, never disabled: a disabled field drops focus, and keys typed then would
                // reach the page's shortcuts ("t" cycles the theme). Typing ahead during a reply is
                // fine; sending waits for it (submit checks `typing`).
                readOnly={!canType}
                aria-disabled={!canType || undefined}
                className="chat-field field resize-none flex-1 !py-2.5"
                aria-label={placeholder || "Message"}
                autoComplete={step === "email" ? "email" : step === "name" ? "name" : "off"}
              />
              <button
                type="submit"
                className="chat-send btn btn-primary !px-3.5 !py-2.5"
                disabled={!canType || typing || !input.trim()}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          )}
          {step === "message" && <p className="mt-1.5 text-[11px] text-muted">Enter to send · Shift + Enter for a new line</p>}
        </div>
      </div>
      <MetroTicketSlot ticket={ticket} />
    </>
  );
}

export default ContactForm;
