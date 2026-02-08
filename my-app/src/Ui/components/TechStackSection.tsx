import { motion } from "framer-motion";

interface Skill {
  name: string;
  image: string;
}

interface TechStackSectionProps {
  skills: Skill[];
}

function TechStackSection({ skills }: TechStackSectionProps) {
  return (
    <section className="text-center bg-red-500 text-white py-8 sm:py-12 overflow-hidden">
      <header className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
        <h1>Tech Stacks</h1>
      </header>

      <div className="relative">
        <motion.div
          className="flex gap-8 pb-8 sm:pb-12"
          animate={{
            x: ["0%", `-${100 / 3}%`], // Divide by number of repetitions
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 10, // Increase duration for wider screens
              ease: "linear",
            },
          }}
        >
          {/* Repeat 4 times to ensure coverage */}
          {Array(4)
            .fill(skills)
            .flat()
            .map((skill, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 min-w-[140px] flex-shrink-0"
              >
                <img
                  src={skill.image}
                  alt={skill.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded-xl"
                />
                <p className="text-sm sm:text-base md:text-lg font-medium">
                  {skill.name}
                </p>
              </div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}

export default TechStackSection;
