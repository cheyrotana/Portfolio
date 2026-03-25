interface Skill {
  name: string;
  image: string;
}

interface TechStackSectionProps {
  skills: Skill[];
}

function TechStackSection({ skills }: TechStackSectionProps) {
  // Repeat skills enough times so one copy always fills the widest screen
  const repeatedSkills = Array(5).fill(skills).flat();

  return (
    <section className="text-center bg-white text-stone-800 py-8 sm:py-12 lg:py-16 overflow-hidden">
      <header className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-5 sm:mb-6 lg:mb-8 text-stone-900">
        <h1>Tech Stacks</h1>
      </header>

      <div className="relative overflow-hidden">
        <div className="animate-marquee">
          {[0, 1].map((copyIdx) => (
            <div key={copyIdx} className="flex gap-6 lg:gap-8 pr-6 lg:pr-8 flex-shrink-0">
              {repeatedSkills.map((skill, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center gap-2 lg:gap-3 p-4 lg:p-5 xl:p-6 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-stone-100 hover:shadow-md transition-all duration-300 min-w-[90px] lg:min-w-[120px] xl:min-w-[140px] flex-shrink-0"
                >
                  <img
                    src={skill.image}
                    alt={skill.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 xl:w-14 xl:h-14 object-contain"
                  />
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-stone-600">
                    {skill.name}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TechStackSection;
