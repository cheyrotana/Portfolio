import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
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

function ImageSlideshow({ images, alt, onImageClick }: SlideshowProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [images.length, paused]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-stone-900 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Images */}
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} screenshot ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 cursor-zoom-in ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => onImageClick(index)}
        />
      ))}

      {/* Prev arrow */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        onClick={prev}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        onClick={next}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Expand button */}
      <button
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        onClick={() => onImageClick(index)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setIndex(i); }}
            className={`rounded-full transition-all duration-300 ${
              i === index ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
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

const projects = [
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
              <div className="md:w-1/2 h-72 sm:h-80 md:h-auto md:min-h-[320px] lg:min-h-[360px] xl:min-h-[400px]">
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
                className="md:w-1/2 flex flex-col justify-center p-5 sm:p-6 lg:p-8 text-left items-start"
              >
                <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-stone-900 mb-2 lg:mb-3">
                  {project.title}
                </h2>
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-stone-600 leading-relaxed mb-4 lg:mb-5">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
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
