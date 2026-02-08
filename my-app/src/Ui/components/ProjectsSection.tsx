import { motion } from "framer-motion";
import Profile from "../../assets/Profile.png";

const projects = [
  {
    id: 1,
    title: "Uni-Finder – Frontend Development",
    alt: "Uni-Finder",
    description:
      "A web application designed to help students explore and compare universities. I was responsible for building responsive user interfaces, implementing navigation flows, and integrating frontend components to ensure a smooth user experience. This project strengthened my skills in UI design, component-based development, and frontend logic.",
    githubUrl: "https://github.com/your-username/uni-finder",
    reverse: false,
  },
  {
    id: 2,
    title: "Modula – Full Stack Application",
    alt: "Modula",
    description:
      "A full stack project focused on building a modular application with both frontend and backend functionality. I worked across the stack, developing backend services, handling business logic, designing RESTful APIs, and integrating them with the frontend. This project gave me hands-on experience with end-to-end application development and system architecture.",
    githubUrl: "https://github.com/your-username/modula",
    reverse: true,
  },
  {
    id: 3,
    title: "Expense Tracker – Backend Development",
    alt: "Expense Tracker",
    description:
      "An expense tracking application designed to manage and analyze personal spending. I focused on backend development, including implementing core business logic, managing database operations, and supporting CRUD functionalities. This project improved my understanding of data modeling, backend workflows, and API-driven applications.",
    githubUrl: "https://github.com/your-username/expense-tracker",
    reverse: false,
  },
];

function ProjectsSection() {
  return (
    <section id="projects" className="bg-pink-500 text-center py-8 sm:py-12">
      <header className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8">
        <h1>Projects</h1>
      </header>

      <div className="flex flex-col gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-12">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className="flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              {project.title}
            </h2>
            <div
              className={`flex flex-col ${project.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl`}
            >
              <div className="flex-shrink-0">
                <img
                  src={Profile}
                  alt={project.alt}
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-cover rounded-xl shadow-lg"
                />
              </div>
              <div
                className={`flex-1 text-white ${project.reverse ? "md:text-right" : "text-left"}`}
              >
                <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-4">
                  {project.description}
                </p>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-pink-500 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default ProjectsSection;
