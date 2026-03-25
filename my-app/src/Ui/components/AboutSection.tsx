import { motion } from "framer-motion";
import Profile from "../../assets/Profile.png";
// import Carousel from "./Carousel";

interface SocialMedia {
  name: string;
  url: string;
  image: string;
}

interface AboutSectionProps {
  greeting: string;
  name: string;
  socialMedia: SocialMedia[];
}

function AboutSection({ greeting, name, socialMedia }: AboutSectionProps) {
  return (
    <section
      id="about"
      className="flex flex-col lg:flex-row items-center justify-center gap-0 lg:gap-4 min-h-screen lg:min-h-[70vh] bg-stone-50 py-8 lg:py-0 overflow-hidden"
    >
      {/* Title — only visible above image on mobile */}
      <h2 className="lg:hidden text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 text-center order-1 px-6 pt-2 pb-0">
        About Me
      </h2>

      <div className="flex-1 text-stone-800 px-6 sm:px-8 md:px-12 lg:px-10 mb-4 lg:mb-0 order-3 lg:order-1">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="hidden lg:block text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 break-words text-center text-stone-900">
            About Me
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg mb-4 lg:mb-5 leading-relaxed break-words text-center max-w-3xl mx-auto text-stone-600">
            {greeting}, I'm <b className="text-stone-800">{name}</b>, a third-year Computer Science
            student at <b className="text-stone-800">CADT</b> (Cambodia Academy of Digital Technology),
            based in <b className="text-stone-800">Phnom Penh, Cambodia</b>. I have experience building
            mobile and web applications with Flutter, Dart, React, and TypeScript, and I love creating
            beneficial, functional apps that solve real-world problems.
          </p>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-4 lg:mb-5">
            <span className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-full font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Phnom Penh, Cambodia
            </span>
            <span className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-full font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              B.Sc. Computer Science · Year 3
            </span>
            <span className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-full font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              CADT
            </span>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={socialMedia[1].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold py-1.5 px-3 sm:py-2 sm:px-4 lg:py-2.5 lg:px-5 rounded-lg hover:bg-stone-800 transition-all duration-300 text-xs sm:text-sm lg:text-sm"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href={socialMedia[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-stone-900 text-stone-900 font-semibold py-1.5 px-3 sm:py-2 sm:px-4 lg:py-2.5 lg:px-5 rounded-lg hover:bg-stone-100 transition-all duration-300 text-xs sm:text-sm lg:text-sm"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>
      <div className="flex-1 flex justify-center items-center p-4 sm:p-6 w-full order-2 lg:order-2">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-[150px] sm:max-w-[180px] lg:max-w-[220px] xl:max-w-[260px]"
        >
          <img
            src={Profile}
            alt="Profile"
            className="w-full aspect-[3/4] object-cover rounded-2xl shadow-2xl"
          />
          {/* <Carousel /> */}
        </motion.div>
      </div>
    </section>
  );
}

export default AboutSection;
