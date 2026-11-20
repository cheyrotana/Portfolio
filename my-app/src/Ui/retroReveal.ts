// Retro: things inside each section play a short entrance (the section name sweeps across, the title rises,
// the content is uncovered from the bottom up) each time they come into view, one after another within a group.
// Time-based, not tied to the scroll, so it's smooth however you scroll. The looks are in retro.css (`html[data-rfx]`, `[data-in]`).
const SEL = [
  ":is(#about, #skills, #work, #contact) .section-header",
  ".retro-about-photo",
  ".retro-about-lead",
  ".retro-about-body",
  ".retro-about-facts > *",
  ".retro-about-keys > *",
  ".retro-rx",
  ".retro-hf",
  ".retro-sc > *",
  "#journey .rt-head > *",
  "#journey .rt-sun",
  "#journey .rt-van",
  "#journey .rt-strip",
  "#contact .card",
]
  .map((s) => `${s}:not([data-rfx-seen])`)
  .join(",");

export function startRetroReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  document.documentElement.dataset.rfx = "on";

  // Observer entries arrive a little late, and in a fast or jumpy scroll one can describe a place the element
  // has already left (the reset below then hid things that were back on screen, for good). So both check
  // where the element is now before acting.
  const onScreen = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight * 0.92;
  };
  const wellOff = (el: Element) => {
    const r = el.getBoundingClientRect();
    const h = window.innerHeight;
    return r.bottom < -h * 0.25 || r.top > h * 1.25;
  };

  // plays when it's properly on screen (not at the very edge)
  const io = new IntersectionObserver(
    (entries) => {
      const hits = entries
        .filter((e) => e.isIntersecting && !("in" in (e.target as HTMLElement).dataset) && onScreen(e.target))
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      hits.forEach((e, i) => {
        const el = e.target as HTMLElement;
        el.style.setProperty("--rfx-i", String(Math.min(i, 8))); // things arriving together go one after another
        el.dataset.in = "";
      });
    },
    // (a little above the bottom edge; not more, or things low on the last screen of the page never get there)
    { rootMargin: "0px 0px -8% 0px" },
  );

  // ...and plays again next time: it's reset only once it's well off screen (a quarter of a screen past the
  // edge), so the reset itself is never seen. (Replays used to flicker when a framer-motion entrance ran on
  // the same element too; in Retro, Reveal is a plain div now.)
  const out = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting && wellOff(e.target)) delete (e.target as HTMLElement).dataset.in;
      });
    },
    { rootMargin: "25% 0px 25% 0px" },
  );

  const scan = () => {
    document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
      el.dataset.rfxSeen = "";
      io.observe(el);
      out.observe(el);
    });
  };
  scan();

  // sections mount later (lazy parts, theme switches): look again once per frame when the page changes
  let queued = 0;
  new MutationObserver((muts) => {
    // only new elements matter; text that changes every frame (scrambles, clocks) must not trigger a rescan
    if (queued || !muts.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1))) return;
    queued = requestAnimationFrame(() => {
      queued = 0;
      scan();
    });
  }).observe(document.body, { childList: true, subtree: true });
}
