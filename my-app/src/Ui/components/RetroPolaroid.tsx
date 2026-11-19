// Retro theme, About: my photo as a polaroid pinned to the wall. It hangs from the pin and swings like the
// real thing: brushing past it with the cursor, clicking it, dragging it or scrolling the page gives it a
// push, and it sways back and forth until it settles. (A small damped pendulum, run only while it moves.)
// The photo is cut just above the shoes and never filtered. Styles: .retro-swing* in src/retro.css.
import { useEffect, useRef } from "react";
import portrait from "../../assets/me/ta-prohm.jpg";
import { profile } from "../data/profile";
import { play } from "../sound";

const STIFF = 38; // how strongly it swings back towards hanging straight
const DAMP = 4.6; // how quickly the swing dies down
const MAX = 10; // degrees: the most it ever swings

export function RetroPolaroid() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const kickRef = useRef<(deg: number) => void>(() => {});

  useEffect(() => {
    const btn = btnRef.current;
    const card = cardRef.current;
    if (!btn || !card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let angle = 0; // degrees, + = swung to the right
    let speed = 0; // degrees per second
    let raf = 0;
    let last = 0;
    let drag: { id: number; moved: boolean } | null = null;
    let lastX = 0;
    let lastT = 0;

    const draw = () => {
      card.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    };
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (!drag) {
        speed += (-STIFF * angle - DAMP * speed) * dt;
        angle = Math.max(-MAX, Math.min(MAX, angle + speed * dt));
      }
      draw();
      if (drag || Math.abs(angle) > 0.05 || Math.abs(speed) > 0.05) raf = requestAnimationFrame(tick);
      else {
        angle = speed = 0;
        draw();
        raf = 0;
      }
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const kick = (deg: number) => {
      speed = Math.max(-60, Math.min(60, speed + deg));
      wake();
    };
    kickRef.current = kick;

    // the angle from the pin to the pointer, for dragging it around
    const pointerAngle = (x: number, y: number) => {
      const r = btn.getBoundingClientRect();
      const px = r.left + r.width / 2;
      const py = r.top + 12;
      return (Math.atan2(px - x, y - py) * 180) / Math.PI;
    };

    // brushing past it pushes it along
    const onMove = (e: PointerEvent) => {
      const dt = Math.max(1, e.timeStamp - lastT);
      const v = ((e.clientX - lastX) / dt) * 1000; // px per second
      lastX = e.clientX;
      lastT = e.timeStamp;
      if (drag && e.pointerId === drag.id) {
        const a = Math.max(-MAX, Math.min(MAX, pointerAngle(e.clientX, e.clientY)));
        speed = ((a - angle) / dt) * 1000;
        angle = a;
        drag.moved = true;
        wake();
      } else if (e.pointerType === "mouse" && Math.abs(v) > 200) {
        kick(Math.max(-3, Math.min(3, v * 0.002)));
      }
    };
    const onEnter = (e: PointerEvent) => {
      lastX = e.clientX;
      lastT = e.timeStamp;
    };
    const onDown = (e: PointerEvent) => {
      drag = { id: e.pointerId, moved: false };
      btn.setPointerCapture(e.pointerId);
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      speed = Math.max(-60, Math.min(60, speed));
      if (!moved) kick(angle >= 0 ? 30 : -30); // a tap: give it a push
      wake();
    };
    // scrolling the page sways it a little, as if the wall moved
    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      const r = btn.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) kick(Math.max(-2, Math.min(2, dy * 0.03)));
    };

    btn.addEventListener("pointerenter", onEnter);
    btn.addEventListener("pointermove", onMove);
    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      btn.removeEventListener("pointerenter", onEnter);
      btn.removeEventListener("pointermove", onMove);
      btn.removeEventListener("pointerdown", onDown);
      btn.removeEventListener("pointerup", onUp);
      btn.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="retro-swing">
      <button
        ref={btnRef}
        type="button"
        className="retro-swing-btn"
        aria-label="Give the photo a push"
        data-cursor="Swing"
        onClick={(e) => {
          // keyboard (Enter / Space): pointer clicks are handled by the pointer events above
          if (e.detail === 0) {
            play("tick");
            kickRef.current(32);
          }
        }}
      >
        <span ref={cardRef} className="retro-swing-card">
          <img
            src={portrait}
            alt={`${profile.name} among the ruins of Ta Prohm temple`}
            width={853}
            height={1280}
            loading="lazy"
            draggable={false}
          />
          <span className="retro-swing-strip" aria-hidden="true" />
        </span>
        <span className="retro-swing-pin" aria-hidden="true" />
      </button>
    </div>
  );
}
