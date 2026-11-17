import emailjs from "@emailjs/browser";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { RotateCcw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { unlock } from "../achievements";
import { play } from "../sound";

// EmailJS settings (unchanged from the original contact form).
const SERVICE_ID = "service_n31f1lt";
const TEMPLATE_ID = "template_jh510rc";
const PUBLIC_KEY = "zuC8j77Q0CqjMRaNQ";

type Step = "name" | "email" | "message" | "confirm" | "sending" | "sent" | "failed";

interface Bubble {
  id: number;
  from: "me" | "you";
  text: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A contact form that feels like a chat: one question at a time.
function ContactForm() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.4 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const counter = useRef(0);
  const started = useRef(false);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step>("name");
  const [input, setInput] = useState("");
  const [data, setData] = useState({ name: "", email: "", message: "" });

  const add = (from: Bubble["from"], text: string) =>
    setBubbles((b) => [...b, { id: ++counter.current, from, text }]);

  // "Me" replies after a short typing pause.
  const say = useCallback((texts: string[], then?: () => void) => {
    let delay = 0;
    texts.forEach((text, i) => {
      delay += 450 + Math.min(900, text.length * 12);
      window.setTimeout(() => setTyping(true), delay - 420);
      window.setTimeout(() => {
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
    say(["Hi! 👋 I'm Rotana.", "What's your name?"]);
  }, [inView, say]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, typing]);

  const restart = () => {
    setBubbles([]);
    setData({ name: "", email: "", message: "" });
    setStep("name");
    setInput("");
    say(["Let's start again 🙂", "What's your name?"]);
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
      play("send");
      unlock("penpal");
      say([`Sent! 🎉 Thanks, ${payload.name.split(" ")[0]} — I'll reply to ${payload.email} soon.`]);
    } catch {
      setTyping(false);
      setStep("failed");
      say(["Hmm, that didn't go through 😕 Want to try again?"]);
    }
  };

  const submit = () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    add("you", text);
    play("click");

    if (step === "name") {
      setData((d) => ({ ...d, name: text }));
      setStep("email");
      say([`Nice to meet you, ${text.split(" ")[0]}!`, "What's your email, so I can write back?"]);
    } else if (step === "email") {
      if (!EMAIL_RE.test(text)) {
        say(["Hmm, that doesn't look like an email address — mind checking it?"]);
        return;
      }
      setData((d) => ({ ...d, email: text }));
      setStep("message");
      say(["Got it 👍", "What would you like to talk about? An internship, a role, a project — anything."]);
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
    <div ref={rootRef} className="chat card flex flex-col h-[480px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line">
        <span className="chat-avatar grid place-items-center w-10 h-10 heading text-sm">CR</span>
        <span className="flex-1">
          <span className="block font-semibold text-fg">Chat with Rotana</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Messages go straight to my inbox
          </span>
        </span>
        {bubbles.length > 2 && (
          <button type="button" className="icon-btn !w-9 !h-9" onClick={restart} aria-label="Start over" data-cursor="Restart">
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-2.5" aria-live="polite">
        <AnimatePresence initial={false}>
          {bubbles.map((b) => (
            <motion.div
              key={b.id}
              className={`flex ${b.from === "you" ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <p className={`chat-bubble ${b.from === "you" ? "chat-you" : "chat-me"} whitespace-pre-wrap`}>{b.text}</p>
            </motion.div>
          ))}

          {step === "confirm" && !typing && (
            <motion.div key="summary" className="flex justify-start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="chat-bubble chat-me w-full max-w-[90%] space-y-1">
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
            <motion.div key="typing" className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="chat-bubble chat-me flex items-center gap-1 !py-3" aria-label="Typing">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-line p-3">
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
              disabled={!canType || typing}
              className="field resize-none flex-1 !py-2.5"
              aria-label={placeholder || "Message"}
              autoComplete={step === "email" ? "email" : step === "name" ? "name" : "off"}
            />
            <button
              type="submit"
              className="btn btn-primary !px-3.5 !py-2.5"
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
  );
}

export default ContactForm;
