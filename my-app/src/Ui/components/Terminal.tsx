import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ACHIEVEMENTS, getUnlocked, unlock } from "../achievements";
import { profile, skillGroups, socials } from "../data/profile";
import { projects } from "../data/projects";
import { goTo, openProject, setJourneyVehicle, spinSlotMachine } from "../events";
import { play, setSound } from "../sound";
import { THEMES, type ThemeId } from "../theme";

interface Line {
  id: number;
  kind: "in" | "out" | "err";
  content: ReactNode;
}

interface TerminalProps {
  open: boolean;
  onClose: () => void;
  onThemeChange: (theme: ThemeId) => void;
}

const COMMANDS: { name: string; usage?: string; about: string }[] = [
  { name: "help", about: "list commands" },
  { name: "whoami", about: "who I am" },
  { name: "about", about: "a short intro" },
  { name: "skills", about: "what I build with" },
  { name: "projects", about: "list my projects" },
  { name: "open", usage: "open <project>", about: "open a project's case study" },
  { name: "journey", about: "jump to my journey" },
  { name: "spin", about: "pull the slot machine's lever" },
  { name: "theme", usage: "theme [name]", about: "list or switch themes" },
  { name: "vehicle", usage: "vehicle <plane|car>", about: "choose the Journey vehicle" },
  { name: "socials", about: "where to find me" },
  { name: "hire", about: "get in touch" },
  { name: "achievements", about: "your progress" },
  { name: "sound", usage: "sound <on|off>", about: "UI sounds" },
  { name: "clear", about: "clear the screen" },
  { name: "exit", about: "close the terminal" },
];

const PROMPT = (
  <>
    <span className="term-user">visitor@rotana</span>
    <span className="term-dim">:</span>
    <span className="term-path">~</span>
    <span className="term-dim">$</span>
  </>
);

export function Terminal({ open, onClose, onThemeChange }: TerminalProps) {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const history = useRef<string[]>([]);
  const historyPos = useRef(-1);
  const counter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (kind: Line["kind"], content: ReactNode) =>
    setLines((l) => [...l, { id: ++counter.current, kind, content }]);

  // Greeting the first time it opens; focus the prompt every time.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (counter.current === 0) {
        push("out", <span className="term-accent">Welcome to rotana.sh — type <b>help</b> to see what I can do.</span>);
      }
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Close the terminal, then do something on the page.
  const thenClose = (action: () => void) => {
    window.setTimeout(() => {
      onClose();
      window.setTimeout(action, 80);
    }, 500);
  };

  const execute = (raw: string) => {
    const text = raw.trim();
    push("in", text);
    if (!text) return;
    history.current = [text, ...history.current.filter((h) => h !== text)].slice(0, 30);
    historyPos.current = -1;
    unlock("hacker");

    const [cmd, ...args] = text.split(/\s+/);
    const arg = args.join(" ").toLowerCase();

    switch (cmd.toLowerCase()) {
      case "help":
        push(
          "out",
          <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-0.5">
            {COMMANDS.map((c) => (
              <span key={c.name} className="contents">
                <span className="term-accent">{c.usage ?? c.name}</span>
                <span className="term-dim">{c.about}</span>
              </span>
            ))}
          </div>,
        );
        break;
      case "whoami":
        push("out", `${profile.name} — ${profile.role}, ${profile.location}.`);
        break;
      case "about":
        push(
          "out",
          <>
            {profile.education}, {profile.year.toLowerCase()}. {profile.currently}.
            <br />I build Flutter apps, Angular dashboards and NestJS services — and once, a Raspberry Pi face-scanner connector.
          </>,
        );
        break;
      case "skills":
        push(
          "out",
          <div>
            {skillGroups.map((g) => (
              <div key={g.title}>
                <span className="term-accent">{g.title.padEnd(16, " ")}</span>
                {g.skills.map((s) => s.name).join(", ")}
              </div>
            ))}
          </div>,
        );
        break;
      case "projects":
      case "ls":
        push(
          "out",
          <div>
            {projects.map((p) => (
              <div key={p.id}>
                <span className="term-accent">{p.id.padEnd(13, " ")}</span>
                {p.title} <span className="term-dim">— {p.role}, {p.year}</span>
              </div>
            ))}
            <div className="term-dim mt-1">Try: open hrm</div>
          </div>,
        );
        break;
      case "open":
      case "cat": {
        const p = projects.find((x) => x.id === arg || x.title.toLowerCase() === arg || x.title.toLowerCase().startsWith(arg));
        if (!arg) push("err", "usage: open <project>   (see: projects)");
        else if (!p) push("err", `open: no project called "${arg}"   (see: projects)`);
        else {
          push("out", `Opening ${p.title}…`);
          thenClose(() => openProject(p.id));
        }
        break;
      }
      case "journey":
        push("out", "Boarding now ✈");
        thenClose(() => goTo("journey"));
        break;
      case "spin":
        push("out", "Pulling the lever… 🎰");
        thenClose(spinSlotMachine);
        break;
      case "theme": {
        if (!arg) {
          push("out", `Themes: ${THEMES.map((t) => t.id).join(", ")}   (usage: theme <name>)`);
          break;
        }
        const t = THEMES.find((x) => x.id === arg || x.name.toLowerCase() === arg);
        if (!t) push("err", `theme: unknown theme "${arg}"`);
        else {
          push("out", `Switching to ${t.name}…`);
          onThemeChange(t.id);
        }
        break;
      }
      case "vehicle":
        if (arg === "plane" || arg === "paper plane" || arg === "car") {
          const v = arg === "car" ? "car" : "plane";
          setJourneyVehicle(v);
          push("out", v === "car" ? "Car ready on the Journey 🚗" : "Paper plane folded and ready ✈");
        } else push("err", "usage: vehicle <plane|car>");
        break;
      case "socials":
      case "links":
        push(
          "out",
          <div>
            {socials.map((s) => (
              <div key={s.name}>
                <span className="term-accent">{s.name.padEnd(10, " ")}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {s.url}
                </a>
              </div>
            ))}
          </div>,
        );
        break;
      case "hire":
      case "contact":
        push("out", "Great choice 😄 Taking you to the chat…");
        thenClose(() => goTo("contact"));
        break;
      case "achievements": {
        const got = getUnlocked();
        push(
          "out",
          <div>
            <div>
              {got.length}/{ACHIEVEMENTS.length} unlocked
            </div>
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className={got.includes(a.id) ? "" : "term-dim"}>
                {got.includes(a.id) ? `${a.emoji} ${a.title}` : `🔒 ${a.hint}`}
              </div>
            ))}
          </div>,
        );
        break;
      }
      case "sound":
        if (arg === "on" || arg === "off") {
          setSound(arg === "on");
          push("out", `Sounds ${arg}.`);
        } else push("err", "usage: sound <on|off>");
        break;
      case "date":
        push("out", new Date().toString());
        break;
      case "echo":
        push("out", args.join(" "));
        break;
      case "sudo":
        push("err", "Nice try 😄 Permission denied — but you can always type: hire");
        break;
      case "rm":
        push("err", "Whoa, not today. This portfolio took a while to build 😅");
        break;
      case "coffee":
        push("out", "☕ Brewing… Flutter builds go faster with coffee.");
        break;
      case "clear":
        setLines([]);
        break;
      case "exit":
      case "quit":
        onClose();
        break;
      default:
        play("error");
        push("err", `command not found: ${cmd}   (type help)`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "`") {
      // The same key that opened the terminal closes it.
      e.preventDefault();
      onClose();
      return;
    }
    play("type");
    if (e.key === "Enter") {
      execute(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(history.current.length - 1, historyPos.current + 1);
      if (next >= 0) {
        historyPos.current = next;
        setInput(history.current[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyPos.current - 1;
      historyPos.current = Math.max(-1, next);
      setInput(next >= 0 ? history.current[next] : "");
    } else if (e.key === "Tab") {
      // Autocomplete a command, or a project after "open ".
      e.preventDefault();
      const [cmd, rest] = input.split(/\s+(.*)/);
      if (rest === undefined) {
        const match = COMMANDS.find((c) => c.name.startsWith(cmd.toLowerCase()));
        if (match) setInput(`${match.name} `);
      } else if (cmd === "open") {
        const match = projects.find((p) => p.id.startsWith(rest.toLowerCase()));
        if (match) setInput(`open ${match.id}`);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Terminal"
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="terminal relative w-full max-w-2xl h-[min(70vh,520px)] flex flex-col overflow-hidden"
            initial={{ y: 30, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="terminal-bar flex items-center gap-2 px-4 py-2.5">
              <button type="button" className="w-3 h-3 rounded-full bg-[#ff5f57]" onClick={onClose} aria-label="Close terminal" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="flex-1 text-center text-xs font-mono opacity-70">visitor@rotana: ~</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
              {lines.map((l) => (
                <div key={l.id} className={`whitespace-pre-wrap break-words ${l.kind === "err" ? "term-err" : ""}`}>
                  {l.kind === "in" ? (
                    <>
                      {PROMPT} <span>{l.content}</span>
                    </>
                  ) : (
                    l.content
                  )}
                </div>
              ))}
              <label className="flex items-center gap-2">
                <span className="whitespace-nowrap">{PROMPT}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="flex-1 min-w-0 bg-transparent caret-[var(--accent)]"
                  style={{ outline: "none" }}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-label="Terminal input"
                />
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
