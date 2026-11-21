import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, ExternalLink, Images, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FaGithub, FaYoutube } from "react-icons/fa";
import type { Project } from "../data/projects";
import { CaseGallery, PhotoViewer } from "./Gallery";
import { TechLabel } from "./TechChip";

interface ProjectModalProps {
  project: Project;
  position: string; // e.g. "2 / 6"
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ProjectModal({ project, position, onClose, onPrev, onNext }: ProjectModalProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Keyboard: Esc closes, ← → switch projects. The photo viewer handles keys itself while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewerIndex !== null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerIndex, onClose, onPrev, onNext]);

  // Lock page scroll behind the modal. The page scrolls on <html> (smooth scrolling), so lock that as well as
  // the body, or the wheel still moved the page underneath.
  useEffect(() => {
    const root = document.documentElement;
    const prev = [root.style.overflow, document.body.style.overflow];
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev[0];
      document.body.style.overflow = prev[1];
    };
  }, []);

  const facts = [
    { icon: UserRound, label: "Role", value: project.role },
    { icon: CalendarDays, label: "Year", value: project.year },
    { icon: ExternalLink, label: "For", value: project.client },
    ...(project.builtAt ? [{ icon: Building2, label: "Built at", value: project.builtAt }] : []),
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.article
        key={project.id}
        className="project-modal card relative w-full max-w-5xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto overscroll-contain!rounded-b-none sm:!rounded-b-[var(--radius)]"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-surface/90 backdrop-blur-md border-b border-line">
          <div className="flex items-center gap-2">
            <button className="icon-btn !w-9 !h-9" onClick={onPrev} aria-label="Previous project">
              <ArrowLeft size={16} />
            </button>
            <button className="icon-btn !w-9 !h-9" onClick={onNext} aria-label="Next project">
              <ArrowRight size={16} />
            </button>
            <span className="ml-1 font-mono text-xs text-muted">{position}</span>
          </div>
          <button className="icon-btn !w-9 !h-9" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Gallery */}
        <div className="border-b border-line" data-cursor="Zoom">
          <CaseGallery images={project.images} alt={project.title} onOpen={(i) => setViewerIndex(i)} />
        </div>

        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-10 p-5 sm:p-8">
          {/* Story */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {project.status && <span className="chip !text-accent !border-accent/50">{project.status}</span>}
              {project.categories.map((c) => (
                <span key={c} className="chip capitalize">{c === "client" ? "Client work" : c}</span>
              ))}
            </div>
            <h2 className="heading mt-4 text-4xl sm:text-5xl text-fg">{project.title}</h2>
            <p className="mt-4 text-muted leading-relaxed">{project.description}</p>

            {project.highlights.length > 0 && (
              <>
                <h3 className="eyebrow mt-8 mb-4">What I did</h3>
                <ul className="space-y-3">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-fg/90 leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Facts */}
          <aside className="space-y-6">
            {project.stat && (
              <div className="card !shadow-none p-5 bg-surface-2">
                <p className="heading text-5xl text-accent">{project.stat.value}</p>
                <p className="mt-1 text-sm text-muted">{project.stat.label}</p>
              </div>
            )}

            <dl className="space-y-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon size={16} className="text-accent mt-1 flex-shrink-0" />
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="font-medium text-fg">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted mb-2">Built with</p>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span key={t} className="chip tech-chip">
                    <TechLabel name={t} />
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <FaGithub size={16} /> Code
                </a>
              )}
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <FaYoutube size={16} /> Demo
                </a>
              )}
              <button className="btn btn-ghost" onClick={() => setViewerIndex(0)}>
                <Images size={16} /> {project.images.length} photos
              </button>
            </div>
            {!project.githubUrl && (
              <p className="text-xs text-muted">Client project — source code is private.</p>
            )}
          </aside>
        </div>
      </motion.article>

      {viewerIndex !== null && (
        <PhotoViewer
          images={project.images}
          startIndex={viewerIndex}
          alt={project.title}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </motion.div>
  );
}
