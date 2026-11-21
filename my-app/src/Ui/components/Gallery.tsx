import { useEffect, useState, useCallback, useMemo } from "react";

// ── Photo Viewer Modal ───────────────────────────────────────────────────────

interface PhotoViewerProps {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}

export function PhotoViewer({ images, startIndex, alt, onClose }: PhotoViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [loaded, setLoaded] = useState<boolean[]>(new Array(images.length).fill(false));
  const thumbRefs = useState<(HTMLButtonElement | null)[]>(new Array(images.length).fill(null))[0];

  const markLoaded = (i: number) =>
    setLoaded((prev) => { const next = [...prev]; next[i] = true; return next; });

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") prev();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    thumbRefs[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index, thumbRefs]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col sm:flex-row w-full max-w-6xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#1a1a1a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Main photo ── */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Gallery</p>
              <h3 className="text-white font-semibold text-sm leading-tight">{alt}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">{index + 1} / {images.length}</span>
              <button
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                onClick={onClose}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="relative flex-1 min-h-[200px]">
            {!loaded[index] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            )}
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${alt} ${i + 1}`}
                onLoad={() => markLoaded(i)}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                  i === index && loaded[i] ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex items-center justify-center gap-3 py-3 border-t border-white/10 flex-shrink-0">
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={prev}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={next}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Thumbnail row — small screens */}
          <div className="sm:hidden flex gap-2 px-3 pb-3 overflow-x-auto flex-shrink-0">
            {images.map((src, i) => (
              <button
                key={i}
                ref={(el) => { thumbRefs[i] = el; }}
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Sidebar — large screens ── */}
        <div className="hidden sm:flex flex-col w-1/4 min-w-[110px] max-w-[150px] border-l border-white/10 overflow-y-auto">
          <p className="text-white/40 text-[10px] uppercase tracking-widest px-3 pt-3 pb-2 flex-shrink-0">Photos</p>
          <div className="flex flex-col gap-2 px-2 pb-3">
            {images.map((src, i) => (
              <button
                key={i}
                ref={(el) => { thumbRefs[i] = el; }}
                onClick={() => setIndex(i)}
                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                  i === index ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 text-white/60 text-[9px]">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Images narrower than this (width / height) are phone screenshots; up to three share a page.
const PORTRAIT_MAX_RATIO = 0.8;
const PHONES_PER_SLIDE = 3;

// ── Case-study gallery ───────────────────────────────────────────────────────
// One calm stage: a wide screenshot on its own, or up to three phone screens standing side by side (no
// tilt, no auto-play). Arrows and a counter on the stage, a strip of thumbnails under it to jump anywhere,
// and a click on a screen opens the full-screen viewer.

interface CaseGalleryProps {
  images: string[];
  alt: string;
  onOpen: (index: number) => void;
}

export function CaseGallery({ images, alt, onOpen }: CaseGalleryProps) {
  const [ratios, setRatios] = useState<(number | undefined)[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled || !img.naturalHeight) return;
        setRatios((prev) => {
          const next = [...prev];
          next[i] = img.naturalWidth / img.naturalHeight;
          return next;
        });
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [images]);

  const portrait = useCallback((i: number) => (ratios[i] ?? 1) < PORTRAIT_MAX_RATIO, [ratios]);

  // runs of phone screens share a page, three at a time; every wide image gets its own
  const pages = useMemo(() => {
    const out: number[][] = [];
    let i = 0;
    while (i < images.length) {
      if (!portrait(i)) {
        out.push([i]);
        i++;
        continue;
      }
      const run: number[] = [];
      while (i < images.length && portrait(i)) run.push(i++);
      for (let k = 0; k < run.length; k += PHONES_PER_SLIDE) out.push(run.slice(k, k + PHONES_PER_SLIDE));
    }
    return out;
  }, [images.length, portrait]);

  const count = Math.max(1, pages.length);
  const cur = Math.min(page, count - 1);
  const go = (p: number) => setPage(((p % count) + count) % count);
  const pageOf = (i: number) => Math.max(0, pages.findIndex((pg) => pg.includes(i)));

  return (
    <div className="case-gallery">
      <div className="case-stage">
        {pages.map((pg, p) => (
          <div key={pg.join("-")} className="case-slide" data-on={p === cur} aria-hidden={p !== cur}>
            {pg.map((i) => (
              <button
                key={i}
                type="button"
                className="case-shot"
                data-portrait={portrait(i) || undefined}
                onClick={() => onOpen(i)}
                tabIndex={p === cur ? 0 : -1}
                aria-label={`Open ${alt} screenshot ${i + 1}`}
              >
                <img src={images[i]} alt={`${alt} screenshot ${i + 1}`} loading={p < 2 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>
        ))}

        {count > 1 && (
          <>
            <button type="button" className="case-arrow is-prev" onClick={() => go(cur - 1)} aria-label="Previous screens">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="button" className="case-arrow is-next" onClick={() => go(cur + 1)} aria-label="Next screens">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="case-count">
              {cur + 1} / {count}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="case-strip" role="tablist" aria-label={`${alt} screens`}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              className="case-thumb"
              aria-selected={pageOf(i) === cur}
              onClick={() => go(pageOf(i))}
              aria-label={`Screen ${i + 1}`}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
