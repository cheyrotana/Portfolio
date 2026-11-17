import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import unifinder0 from "../../assets/Unifinder pictures/0.png";
import unifinder1 from "../../assets/Unifinder pictures/1.png";
import unifinder2 from "../../assets/Unifinder pictures/2.png";
import unifinder3 from "../../assets/Unifinder pictures/3.png";
import unifinder4 from "../../assets/Unifinder pictures/4.png";
import unifinder5 from "../../assets/Unifinder pictures/5.png";
import unifinder6 from "../../assets/Unifinder pictures/6.png";
import unifinder7 from "../../assets/Unifinder pictures/7.png";
import unifinder8 from "../../assets/Unifinder pictures/8.png";
import unifinder9 from "../../assets/Unifinder pictures/9.png";
import unifinder10 from "../../assets/Unifinder pictures/10.png";
import unifinder11 from "../../assets/Unifinder pictures/11.png";
import unifinder12 from "../../assets/Unifinder pictures/12.png";
import frostGuard1 from "../../assets/Frost Guard/1.png";
import frostGuard2 from "../../assets/Frost Guard/2.png";
import frostGuard3 from "../../assets/Frost Guard/3.png";
import frostGuard4 from "../../assets/Frost Guard/4.png";
import frostGuard5 from "../../assets/Frost Guard/5.png";
import modula1 from "../../assets/Modula/1.png";
import modula2 from "../../assets/Modula/2.png";
import modula3 from "../../assets/Modula/3.png";
import modula4 from "../../assets/Modula/4.png";
import modula5 from "../../assets/Modula/5.png";
import modula6 from "../../assets/Modula/6.png";
import modula7 from "../../assets/Modula/7.png";
import modula8 from "../../assets/Modula/8.png";
import modula9 from "../../assets/Modula/9.png";
import modula10 from "../../assets/Modula/10.png";
import modula11 from "../../assets/Modula/11.png";
import modula12 from "../../assets/Modula/12.png";
import hrmMlmupc1 from "../../assets/HRM/mlmupc-1.jpg";
import hrmMlmupc2 from "../../assets/HRM/mlmupc-2.jpg";
import hrmMlmupc3 from "../../assets/HRM/mlmupc-3.jpg";
import hrmMlmupc4 from "../../assets/HRM/mlmupc-4.jpg";
import hrmMlmupc5 from "../../assets/HRM/mlmupc-5.jpg";
import hrmNis1 from "../../assets/HRM/nis-1.jpg";
import hrmNis2 from "../../assets/HRM/nis-2.jpg";
import faceScan1 from "../../assets/FaceScan/1.jpg";
import phumiYerng1 from "../../assets/PhumiYerng/1.jpg";
import phumiYerng2 from "../../assets/PhumiYerng/2.jpg";
import phumiYerng3 from "../../assets/PhumiYerng/3.jpg";
import phumiYerng4 from "../../assets/PhumiYerng/4.jpg";
import phumiYerng5 from "../../assets/PhumiYerng/5.jpg";

const hrmImages = [
  hrmMlmupc1, hrmMlmupc2, hrmMlmupc3, hrmMlmupc4, hrmMlmupc5, hrmNis1, hrmNis2,
];

const faceScanImages = [faceScan1];

const phumiYerngImages = [
  phumiYerng1, phumiYerng2, phumiYerng3, phumiYerng4, phumiYerng5,
];

const unifinderImages = [
  unifinder0, unifinder1, unifinder2, unifinder3, unifinder4,
  unifinder5, unifinder6, unifinder7, unifinder8,
  unifinder9, unifinder10, unifinder11, unifinder12,
];

const frostGuardImages = [
  frostGuard1, frostGuard2, frostGuard3, frostGuard4, frostGuard5,
];

const modulaImages = [
  modula1, modula2, modula3, modula4, modula5, modula6,
  modula7, modula8, modula9, modula10, modula11, modula12,
];

// ── Photo Viewer Modal ───────────────────────────────────────────────────────

interface PhotoViewerProps {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}

function PhotoViewer({ images, startIndex, alt, onClose }: PhotoViewerProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
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

function ImageSlideshow({ images, alt, onImageClick }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
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

  useEffect(() => {
    if (hovered || pageCount < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i % pageCount + 1) % pageCount);
    }, 3200);
    return () => clearInterval(timer);
  }, [pageCount, hovered]);

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

// ── Placeholder ──────────────────────────────────────────────────────────────

function PlaceholderImage({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-stone-200 flex flex-col items-center justify-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-stone-300 flex items-center justify-center">
        <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <span className="text-stone-400 text-sm font-medium">{label}</span>
    </div>
  );
}

// ── Projects data ────────────────────────────────────────────────────────────

interface Project {
  id: number;
  title: string;
  alt: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  images?: string[];
}

const projects: Project[] = [
  {
    id: 4,
    title: "HRM System (MLMUPC, NIS) – Mobile & Web Developer",
    alt: "HRM System",
    description:
      "A government HR management platform used by the Ministry of Land Management, Urban Planning and Construction (MLMUPC) and the National Institute of Statistics (NIS). In the Flutter mobile app I built attendance tracking and reports, mission and leave requests, organization admin screens and a Telegram Mini App with automatic sign-in. In the Angular web app I worked on officer CVs and profiles, organization statistics, attendance timelines and settings.",
    images: hrmImages,
  },
  {
    id: 5,
    title: "Face Scan Connector for HRM – Full-Stack Developer",
    alt: "Face Scan Connector",
    description:
      "Connects Raspberry Pi face-scanner machines and Dahua face terminals to the HRM system. A Python connector on the Pi registers the device and shows a pairing QR code. Admins pair it and assign staff from the web app, then a NestJS worker syncs their face photos to the Dahua scanner so each scan is recorded as attendance automatically.",
    images: faceScanImages,
  },
  {
    id: 6,
    title: "PhumiYerng – Mobile Developer",
    alt: "PhumiYerng",
    description:
      "PhumiYerng (ភូមិយើង, \"Our Village\") is a marketplace and community-tourism platform for rural communities in Cambodia's LASED III land program. I'm building the Flutter mobile app (MVVM) from the ground up: OTP sign-in, product shop, cart and checkout, trips and homestays, community pages and live notifications. Currently in development.",
    images: phumiYerngImages,
  },
  {
    id: 1,
    title: "UniFinder – Frontend Developer",
    alt: "UniFinder",
    description:
      "A Flutter mobile application that helps students, especially those living in rural areas of Cambodia, find their best-fit university majors and plan their academic futures — 100% offline.",
    githubUrl: "https://github.com/Ra-Fat/UniFinder.git",
    demoUrl: "https://youtu.be/luuqpryOJ3g?si=PzYM49oHuPeBR9P_",
    images: unifinderImages,
  },
  {
    id: 2,
    title: "Modula – Frontend Developer",
    alt: "Modula",
    description:
      "Modula is a modular POS designed to help small F&B businesses manage daily operations efficiently.",
    githubUrl: "https://github.com/Zorng/ModulaFrontend.git",
    demoUrl: "https://youtu.be/JI82H8Xl9lM",
    images: modulaImages,
  },
  {
    id: 3,
    title: "Frost Guard – Game Developer",
    alt: "Frost Guard",
    description:
      "The Winter Siege is a tower defense strategy game where players defend their castle from waves of enemies in a magical, endless winter world. Players place and upgrade towers, manage resources, and plan strategically to survive increasingly difficult enemy waves.",
    githubUrl: "https://github.com/Ra-Fat/Frost-Guard.git",
    demoUrl: "https://youtu.be/mIUvftuUees?si=5U4Ct_zm97CKRLN2",
    images: frostGuardImages,
  },
];

// ── Section ──────────────────────────────────────────────────────────────────

function ProjectsSection() {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; alt: string } | null>(null);

  return (
    <section id="projects" className="bg-stone-50 text-center py-10 sm:py-12 lg:py-16 overflow-hidden">
      <header className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 sm:mb-8 lg:mb-10 px-4">
        <h1>Projects</h1>
      </header>

      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 px-8 sm:px-16 lg:px-28 xl:px-40 pb-6 sm:pb-8">
        {projects.map((project, index) => {
          return (
            <motion.div
              key={project.id}
              className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-lg border border-stone-200 hover:shadow-xl transition-shadow duration-300 w-full"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="md:w-[55%] md:flex-shrink-0 aspect-video md:aspect-auto md:min-h-[320px] lg:min-h-[360px] xl:min-h-[400px]">
                {project.images ? (
                  <ImageSlideshow
                    images={project.images}
                    alt={project.alt}
                    onImageClick={(i) => setLightbox({ images: project.images!, index: i, alt: project.alt })}
                  />
                ) : (
                  <PlaceholderImage label={project.alt} />
                )}
              </div>
              <div
                className="md:flex-1 flex flex-col justify-center p-5 sm:p-6 lg:p-8 text-left items-start"
              >
                <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-stone-900 mb-2 lg:mb-3">
                  {project.title}
                </h2>
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-stone-600 leading-relaxed mb-4 lg:mb-5">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold py-2 px-4 lg:py-2.5 lg:px-5 rounded-lg hover:bg-stone-800 transition-all duration-300 text-xs sm:text-sm lg:text-base"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    View on GitHub
                  </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-stone-900 text-stone-900 font-semibold py-2 px-4 lg:py-2.5 lg:px-5 rounded-lg hover:bg-stone-100 transition-all duration-300 text-xs sm:text-sm lg:text-base"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                      </svg>
                      Watch Demo
                    </a>
                  )}
                  {project.images && (
                    <button
                      onClick={() => setLightbox({ images: project.images!, index: 0, alt: project.alt })}
                      className="inline-flex items-center gap-2 bg-stone-100 border border-stone-300 text-stone-700 font-semibold py-2 px-4 lg:py-2.5 lg:px-5 rounded-lg hover:bg-stone-200 transition-all duration-300 text-xs sm:text-sm lg:text-base"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      View Photos
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {lightbox && (
        <PhotoViewer
          images={lightbox.images}
          startIndex={lightbox.index}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}

export default ProjectsSection;
