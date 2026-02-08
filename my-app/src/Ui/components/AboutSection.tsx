import { motion } from "framer-motion";
import Carousel from "./Carousel";

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
      className="flex flex-col lg:flex-row items-center justify-center min-h-screen lg:min-h-[70vh] bg-blue-500 py-12 lg:py-0"
    >
      <div className="flex-1 text-white px-6 sm:px-8 md:px-12 lg:px-20 mb-8 lg:mb-0 lg:order-1 order-2">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 break-words text-center">
            About Me
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 leading-relaxed break-words text-center max-w-2xl mx-auto">
            {greeting}, I'm <b>{name}</b>, a developer with experience in
            Flutter, Dart, React, and TypeScript. I love creating beneficial and
            functional applications that solve real-world problems.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={socialMedia[1].url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-500 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm sm:text-base"
            >
              GitHub
            </a>
            <a
              href={socialMedia[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-500 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm sm:text-base"
            >
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>
      <div className="flex-1 flex justify-center items-center p-6 sm:p-8 w-full lg:order-2 order-1">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Carousel />
        </motion.div>
      </div>
    </section>
  );
}

export default AboutSection;
