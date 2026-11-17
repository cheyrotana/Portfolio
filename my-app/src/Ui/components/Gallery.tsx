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

// ── Image Slideshow ──────────────────────────────────────────────────────────

interface SlideshowProps {
  images: string[];
  alt: string;
  onImageClick: (index: number) => void;
  // "always": cycles on its own and pauses while hovered (default).
  // "hover": stays still and cycles only while hovered — for grids of many slideshows.
  autoPlay?: "always" | "hover";
  // Highlights the stage as if hovered, e.g. while a parent card is hovered.
  active?: boolean;
}

// Images narrower than this (width / height) are phone screenshots; up to three
// are fanned out together on one slide.
const PORTRAIT_MAX_RATIO = 0.8;
const PHONES_PER_SLIDE = 3;

type RGB = [number, number, number];

interface ImageMeta {
  ratio: number;
  tint: RGB; // the image's average colour, used to tint the stage behind it
}

const DEFAULT_TINT: RGB = [120, 113, 108]; // stone

function readImageMeta(img: HTMLImageElement): ImageMeta {
  const ratio = img.naturalWidth / img.naturalHeight;
  let tint = DEFAULT_TINT;
  try {
    const size = 16;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      const sum = [0, 0, 0];
      for (let o = 0; o < data.length; o += 4) {
        sum[0] += data[o]; sum[1] += data[o + 1]; sum[2] += data[o + 2];
      }
      const n = data.length / 4;
      tint = [sum[0] / n, sum[1] / n, sum[2] / n].map(Math.round) as RGB;
    }
  } catch {
    // Canvas unavailable: keep the neutral tint.
  }
  return { ratio, tint };
}

const mix = (c: RGB, target: number, t: number): string =>
  `rgb(${c.map((v) => Math.round(v + (target - v) * t)).join(",")})`;

const stageBackground = (tint: RGB) => {
  // Near-white images would turn the stage a dull grey, so darken them less.
  const light = 0.299 * tint[0] + 0.587 * tint[1] + 0.114 * tint[2] > 200;
  const edge = light ? 0.18 : 0.45;
  return `radial-gradient(130% 130% at 20% 10%, ${mix(tint, 255, 0.6)} 0%, ${mix(tint, 0, light ? 0.03 : 0.1)} 55%, ${mix(tint, 0, edge)} 100%)`;
};

const DOT_GRID: React.CSSProperties = {
  backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)",
  backgroundSize: "18px 18px",
};

// Where each phone sits in a fan: horizontal shift (% of its width), rotation, scale.
const FAN_LAYOUTS: Record<number, { x: number; r: number; s: number; z: number }[]> = {
  1: [{ x: 0, r: 0, s: 1, z: 1 }],
  2: [{ x: -32, r: -6, s: 0.94, z: 1 }, { x: 32, r: 6, s: 0.94, z: 2 }],
  3: [{ x: -62, r: -9, s: 0.86, z: 1 }, { x: 0, r: 0, s: 1, z: 3 }, { x: 62, r: 9, s: 0.86, z: 2 }],
};

export function ImageSlideshow({ images, alt, onImageClick, autoPlay = "always", active }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [mouseOver, setHovered] = useState(false);
  const hovered = mouseOver || !!active;
  const [meta, setMeta] = useState<(ImageMeta | undefined)[]>([]);

  // Measure every image up front so slides can be laid out before they are shown.
  useEffect(() => {
    let cancelled = false;
    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled || !img.naturalHeight) return;
        const m = readImageMeta(img);
        setMeta((prev) => { const next = [...prev]; next[i] = m; return next; });
      };
      img.src = src;
    });
    return () => { cancelled = true; };
  }, [images]);

  const isPortrait = useCallback((i: number) => (meta[i]?.ratio ?? 1) < PORTRAIT_MAX_RATIO, [meta]);

  // Group runs of phone screenshots into fans; every other image gets its own slide.
  const pages = useMemo(() => {
    const out: number[][] = [];
    let i = 0;
    while (i < images.length) {
      if (!isPortrait(i)) { out.push([i]); i++; continue; }
      let j = i;
      while (j < images.length && isPortrait(j)) j++;
      const run = Array.from({ length: j - i }, (_, k) => i + k);
      const perPage = Math.min(run.length, PHONES_PER_SLIDE);
      for (let k = 0; k < run.length; k += perPage) {
        // Top up a short last fan by wrapping to the start of the run.
        out.push(Array.from({ length: perPage }, (_, n) => run[(k + n) % run.length]));
      }
      i = j;
    }
    return out;
  }, [images.length, isPortrait]);

  const pageCount = pages.length;
  const current = index % pageCount;

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((i) => (i % pageCount - 1 + pageCount) % pageCount); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((i) => (i % pageCount + 1) % pageCount); };

  const playing = autoPlay === "hover" ? hovered : !hovered;

  useEffect(() => {
    if (!playing || pageCount < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i % pageCount + 1) % pageCount);
    }, autoPlay === "hover" ? 1600 : 3200);
    return () => clearInterval(timer);
  }, [pageCount, playing, autoPlay]);

  const open = (i: number) => (e: React.MouseEvent) => { e.stopPropagation(); onImageClick(i); };

  const renderFan = (page: number[], active: boolean) => {
    const layout = FAN_LAYOUTS[page.length];
    const spread = hovered ? 1.15 : 1;
    return page.map((i, n) => {
      const f = layout[n];
      return (
        <img
          key={`${i}-${n}`}
          src={images[i]}
          alt={`${alt} screenshot ${i + 1}`}
          onClick={open(i)}
          className="absolute left-1/2 top-1/2 h-[86%] w-auto max-w-none rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/10 transition-transform duration-700 ease-out"
          style={{
            zIndex: f.z,
            transform: active
              ? `translate(-50%, -50%) translateX(${f.x * spread}%) rotate(${f.r * spread}deg) scale(${f.s})`
              : "translate(-50%, -44%) scale(0.85)",
          }}
        />
      );
    });
  };

  const renderPhoto = (i: number, active: boolean) => {
    // Another wide image peeks out from behind, like a stack of prints.
    const behind = images.length > 1 ? (i + 1) % images.length : null;
    const showBehind = behind !== null && behind !== i && !isPortrait(behind);
    const photo = "absolute left-1/2 top-1/2 w-auto h-auto max-w-[84%] max-h-[78%] rounded-lg sm:rounded-xl ring-1 ring-black/10 transition-transform duration-700 ease-out";
    return (
      <>
        {showBehind && (
          <img
            src={images[behind]}
            alt=""
            aria-hidden="true"
            className={`${photo} shadow-xl brightness-90`}
            style={{
              transform: active
                ? `translate(-50%, -50%) translate(6%, 5%) rotate(${hovered ? 6 : 4}deg) scale(0.94)`
                : "translate(-50%, -50%) scale(0.88)",
            }}
          />
        )}
        <img
          src={images[i]}
          alt={`${alt} screenshot ${i + 1}`}
          onClick={open(i)}
          className={`${photo} shadow-2xl`}
          style={{
            transform: active
              ? `translate(-50%, -50%) rotate(${hovered ? 0 : -2.5}deg) scale(${hovered ? 1.03 : 1})`
              : "translate(-50%, -44%) scale(0.9)",
          }}
        />
      </>
    );
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-stone-800 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Slides */}
      {pages.map((page, p) => {
        const active = p === current;
        return (
          <div
            key={page.join("-")}
            className={`absolute inset-0 transition-opacity duration-700 cursor-zoom-in ${
              active ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ background: stageBackground(meta[page[0]]?.tint ?? DEFAULT_TINT) }}
            onClick={open(page[0])}
          >
            <div className="absolute inset-0 opacity-40" style={DOT_GRID} />
            {page.length > 1 || isPortrait(page[0]) ? renderFan(page, active) : renderPhoto(page[0], active)}
          </div>
        );
      })}

      {/* Soft shade so the dots stay visible on light images */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none z-[5]" />

      {pageCount > 1 && (
        <>
          {/* Prev arrow */}
          <button
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            onClick={prev}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            onClick={next}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Expand button */}
      <button
        aria-label="Open gallery"
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        onClick={open(pages[current]?.[0] ?? 0)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Dots */}
      {pageCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {pages.map((_, p) => (
            <button
              key={p}
              aria-label={`Show slide ${p + 1}`}
              onClick={(e) => { e.stopPropagation(); setIndex(p); }}
              className={`rounded-full transition-all duration-300 ${
                p === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
