import { useEffect } from "react";

// Smooth wheel scrolling (Lenis) while `on`. A mouse wheel moves the page in ~100px jumps; with a 3D scene
// that eases after the page (the Retro room), the two drift apart and it looks jerky. Lenis glides the
// page itself, so the content and the scene move together. Trackpads and touch keep their native feel,
// nested scroll areas (the chat, menus) still scroll on their own, and reduced motion turns it off.
// Loaded only when used.
const gateHolding = () => {
  const d = document.documentElement.dataset;
  return d.gate === "in" || performance.now() < Number(d.gateHold || 0);
};

export function useSmoothScroll(on: boolean) {
  useEffect(() => {
    if (!on || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let dead = false;
    let stop = () => {};
    import("lenis").then(({ default: Lenis }) => {
      if (dead) return;
      const lenis = new Lenis({
        autoRaf: true,
        lerp: 0.1,
        anchors: true,
        allowNestedScroll: true,
        // not while Retro's opening plays its move (or swallows the tail of the fling after it): the page holds still
        prevent: (node) => gateHolding() || !!node.closest?.('[role="dialog"], [data-lenis-prevent]'),
      });
      stop = () => lenis.destroy();
    });
    return () => {
      dead = true;
      stop();
    };
  }, [on]);
}
