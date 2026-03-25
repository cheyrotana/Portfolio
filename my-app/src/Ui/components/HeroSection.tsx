import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  name: string;
  activeSection: string;
  hidden: boolean;
}

function HeroSection({ name, activeSection, hidden }: HeroSectionProps) {
  return (
    <motion.section
      id="home"
      className="flex flex-col min-h-screen bg-stone-900 text-white overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* HEADER - Responsive Navigation */}
      <motion.header
        className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-stone-900/90 backdrop-blur-md border border-white/15 shadow-xl shadow-black/30"
        style={{ width: "max-content" }}
        initial={{ y: -60, opacity: 0 }}
        animate={hidden ? { y: -60, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.nav
          className="flex gap-1 px-6 sm:px-8 py-3 sm:py-4 justify-center items-center"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
          initial="hidden"
          animate="visible"
        >
          {(["home", "about", "projects", "contact"] as const).map((section) => (
            <motion.a
              key={section}
              href={`#${section}`}
              className={`relative text-sm sm:text-base md:text-lg font-semibold px-4 sm:px-5 py-2 rounded-full transition-all duration-300 whitespace-nowrap ${
                activeSection === section
                  ? "text-emerald-400 bg-emerald-500/15"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              variants={{
                hidden: { opacity: 0, y: -12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
              }}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
              {activeSection === section && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
            </motion.a>
          ))}
        </motion.nav>
      </motion.header>

      {/* HERO CONTENT */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8">
        <motion.div
          className="max-w-5xl w-full"
          variants={{
            hidden: { opacity: 0, y: -30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 text-center uppercase break-words leading-tight">
            <b>{name}</b>
          </h1>

          <motion.p
            className="text-base sm:text-xl md:text-2xl text-center px-4 text-white/70"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { delay: 0.3, duration: 0.5, ease: "easeOut" },
              },
            }}
          >
            Welcome To My Portfolio
          </motion.p>
        </motion.div>
      </div>

      {/* BOTTOM INFO + SCROLL */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-6 sm:pb-8 flex flex-col gap-4">
        {/* <div className="flex gap-3 sm:gap-4 justify-between">
          <motion.div
            className="w-fit flex flex-col gap-1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          >
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-white/40 uppercase tracking-widest">
              Based in
            </span>
            <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
              Phnom Penh, Cambodia
            </span>
          </motion.div>

          <motion.div
            className="w-fit flex flex-col gap-1 items-end text-right"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
          >
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-white/40 uppercase tracking-widest">
              Education
            </span>
            <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
              Bachelor of Computer Science
            </span>
            <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-white/60 leading-snug">
              CADT (Cambodia Academy of Digital Technology)
            </span>
          </motion.div>
        </div> */}

        {/* SCROLL INDICATOR */}
        <motion.div
          className="flex items-center justify-center text-white cursor-pointer"
          onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown size={32} className="sm:w-10 sm:h-10 md:w-11 md:h-11" />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default HeroSection;
