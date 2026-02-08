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
      className="flex flex-col min-h-screen bg-green-500 text-white overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.3 }}
    >
      {/* HEADER - Responsive Navigation */}
      <motion.header
        className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-10 shadow-lg rounded-full bg-white w-fit"
        initial={{ y: -100, opacity: 0 }}
        animate={hidden ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.nav
          className="flex gap-3 sm:gap-4 md:gap-6 px-4 sm:px-6 md:px-8 py-3 sm:py-4 justify-center items-center"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          <motion.a
            href="#home"
            className={`text-xs sm:text-sm md:text-base font-medium transition-colors ${activeSection === "home" ? "text-green-500 font-bold" : "text-gray-700 hover:text-green-500"}`}
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            Home
          </motion.a>
          <motion.a
            href="#about"
            className={`text-xs sm:text-sm md:text-base font-medium transition-colors ${activeSection === "about" ? "text-green-500 font-bold" : "text-gray-700 hover:text-green-500"}`}
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            About
          </motion.a>
          <motion.a
            href="#projects"
            className={`text-xs sm:text-sm md:text-base font-medium transition-colors ${activeSection === "projects" ? "text-green-500 font-bold" : "text-gray-700 hover:text-green-500"}`}
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            Projects
          </motion.a>
          <motion.a
            href="#contact"
            className={`text-xs sm:text-sm md:text-base font-medium transition-colors ${activeSection === "contact" ? "text-green-500 font-bold" : "text-gray-700 hover:text-green-500"}`}
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            Contact
          </motion.a>
        </motion.nav>
      </motion.header>

      {/* HERO CONTENT */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8">
        <motion.div
          className="max-w-5xl w-full"
          variants={{
            hidden: { opacity: 0, y: -100 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, ease: "easeOut" },
            },
          }}
        >
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 text-center uppercase break-words leading-tight">
            <b>{name}</b>
          </h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-center px-4"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { delay: 0.5, duration: 0.7, ease: "easeOut" },
              },
            }}
          >
            Welcome to my portfolio
          </motion.p>
        </motion.div>
      </div>

      {/* BOTTOM INFO - Location and Education */}
      <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 flex justify-between items-end px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Location - Bottom Left */}
        <motion.div
          className="flex flex-col items-start"
          variants={{
            hidden: { opacity: 0, x: -50 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { delay: 0.8, duration: 0.7, ease: "easeOut" },
            },
          }}
        >
          <span className="text-xs sm:text-sm text-white/60 uppercase tracking-wider mb-1">
            Based in
          </span>
          <span className="text-sm sm:text-base md:text-lg font-semibold">
            Phnom Penh, Cambodia
          </span>
        </motion.div>

        {/* Education - Bottom Right */}
        <motion.div
          className="flex flex-col items-end text-right"
          variants={{
            hidden: { opacity: 0, x: 50 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { delay: 0.8, duration: 0.7, ease: "easeOut" },
            },
          }}
        >
          <span className="text-xs sm:text-sm text-white/60 uppercase tracking-wider mb-1">
            Education
          </span>
          <span className="text-sm sm:text-base md:text-lg font-semibold max-w-xs">
            Bachelor of Computer Science
          </span>
          <span className="text-xs sm:text-sm text-white/80">CADT</span>
        </motion.div>
      </div>

      {/* SCROLL INDICATOR */}
      <motion.div
        className="flex items-center justify-center pb-6 sm:pb-8 text-white cursor-pointer"
        onClick={() =>
          document
            .getElementById("about")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { delay: 0.5, ease: "easeInOut" },
          },
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ArrowDown size={32} className="sm:w-10 sm:h-10 md:w-11 md:h-11" />
      </motion.div>
    </motion.section>
  );
}

export default HeroSection;
