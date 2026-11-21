// Button prompts for the pause-style menus, like a game's controls bar: keycaps with a label.
// Touch screens have no keyboard, so they get a single "tap to choose" prompt instead.

export interface KeyHint {
  keys: string[];
  label: string;
}

const MENU_HINTS: KeyHint[] = [
  { keys: ["↑", "↓"], label: "Choose" },
  { keys: ["←", "→"], label: "Switch" },
  { keys: ["Enter"], label: "Select" },
  { keys: ["Esc"], label: "Close" },
];

export function KeyHints({ hints = MENU_HINTS }: { hints?: KeyHint[] }) {
  return (
    <div className="keyhints">
      <ul className="keyhints-keys" aria-label="Keyboard controls">
        {hints.map((h) => (
          <li key={h.label} className="keyhint">
            <span className="keyhint-caps">
              {h.keys.map((k) => (
                <kbd key={k} className={`keycap ${k.length > 1 ? "is-wide" : ""}`}>
                  {k}
                </kbd>
              ))}
            </span>
            <span className="keyhint-label">{h.label}</span>
          </li>
        ))}
      </ul>
      <p className="keyhints-touch">
        <span className="keycap is-wide" aria-hidden="true">
          Tap
        </span>
        <span className="keyhint-label">Choose</span>
      </p>
    </div>
  );
}
