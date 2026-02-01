import Profile from "./assets/Profile.png";
import { useEffect, useState } from "react";
import "./index.css";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useScroll, useMotionValueEvent } from "framer-motion";

function App() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (previous !== undefined && latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "projects", "contact"];
      const scrollY = window.scrollY + 100; // offset for navbar height
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const name = "Chey Rotana";
  const skills = [
    { name: "Flutter", image: Profile },
    { name: "Dart", image: Profile },
    { name: "React", image: Profile },
    { name: "TypeScript", image: Profile },
  ];

  const socialMedia = [
    {
      name: "LinkedIn",
      url: "https://linkedin.com/in/your-profile",
      image: Profile,
    },
    { name: "GitHub", url: "https://github.com/your-username", image: Profile },
    {
      name: "Facebook",
      url: "https://facebook.com/your-profile",
      image: Profile,
    },
  ];

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* HERO SECTION - Responsive */}
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

      {/* ABOUT SECTION - Responsive */}
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
              Flutter, Dart, React, and TypeScript. I love creating beneficial
              and functional applications that solve real-world problems.
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

      {/* TECH STACK SECTION - Responsive */}
      <section className="text-center bg-red-500 text-white py-8 sm:py-12">
        <header className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
          <h1>Tech Stacks</h1>
        </header>
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-6 sm:px-8 md:px-12 pb-8 sm:pb-12">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <img
                src={skill.image}
                alt={skill.name}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 object-cover rounded-xl"
              />
              <p className="text-sm sm:text-base md:text-lg font-medium">
                {skill.name}
              </p>
            </motion.div>
          ))}
        </section>
      </section>

      {/* PROJECTS SECTION - Responsive */}
      <section id="projects" className="bg-pink-500 text-center py-8 sm:py-12">
        <header className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8">
          <h1>Projects</h1>
        </header>

        <div className="flex flex-col gap-8 sm:gap-10 md:gap-12 px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-12">
          {/* Project 1 */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              Project 1
            </h2>
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl">
              <div className="flex-shrink-0">
                <img
                  src={Profile}
                  alt="Project 1"
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-cover rounded-xl shadow-lg"
                />
              </div>
              <div className="flex-1 text-white text-left">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nostrum, in aperiam animi fugit minima aliquam ratione odit
                  molestiae qui? Sed autem sit sunt suscipit sapiente
                  dignissimos natus libero cum mollitia!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Project 2 */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              Project 2
            </h2>
            <div className="flex flex-col md:flex-row-reverse gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl">
              <div className="flex-shrink-0">
                <img
                  src={Profile}
                  alt="Project 2"
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-cover rounded-xl shadow-lg"
                />
              </div>
              <div className="flex-1 text-white text-left md:text-right">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nostrum, in aperiam animi fugit minima aliquam ratione odit
                  molestiae qui? Sed autem sit sunt suscipit sapiente
                  dignissimos natus libero cum mollitia!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Project 3 */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              Project 3
            </h2>
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl">
              <div className="flex-shrink-0">
                <img
                  src={Profile}
                  alt="Project 3"
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-cover rounded-xl shadow-lg"
                />
              </div>
              <div className="flex-1 text-white text-left">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nostrum, in aperiam animi fugit minima aliquam ratione odit
                  molestiae qui? Sed autem sit sunt suscipit sapiente
                  dignissimos natus libero cum mollitia!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER - Responsive */}
      <footer
        id="contact"
        className="flex flex-col lg:flex-row min-h-screen lg:min-h-[600px]"
      >
        <div className="flex-1 flex flex-col justify-center bg-gradient-to-br from-green-400 to-green-600 gap-4 sm:gap-6 p-6 sm:p-8 md:p-12">
          <h3 className="text-white text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-4">
            Connect With Me
          </h3>
          <div className="flex flex-col gap-3 sm:gap-4 max-w-md mx-auto w-full">
            {socialMedia.map((sMedia, index) => (
              <a
                key={index}
                href={sMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              >
                <img
                  src={sMedia.image}
                  alt={sMedia.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-md border-2 border-white/30 group-hover:border-white transition-colors"
                />
                <span className="text-white text-sm sm:text-base font-medium group-hover:text-yellow-200 transition-colors">
                  {sMedia.name}
                </span>
              </a>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-yellow-500 flex items-center justify-center">
          <ContactForm />
        </div>
      </footer>
    </>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [error, setError] = useState("");

  interface ChangeEventType extends React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement
  > {}

  const handleChange = (e: ChangeEventType) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.");
      return;
    }

    setError("");
    console.log("Form submitted:", formData);

    // Reset form
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 ">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col gap-6 bg-yellow-500 p-8 rounded-2xl "
      >
        <h3 className="text-white text-2xl font-bold text-center mb-2">
          Get In Touch
        </h3>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-white px-4 py-2 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Message</label>
            <textarea
              name="message"
              placeholder="Tell me about your project..."
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-white text-yellow-600 font-bold py-3 px-6 rounded-lg hover:bg-yellow-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}

const images = [Profile, Profile, Profile];

function Carousel() {
  const [active, setActive] = useState(0);
  const [paused, setpaused] = useState(false);
  const intervalDuration = 1000;

  const next = () => setActive((prev) => (prev + 1) % images.length);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, intervalDuration);
    return () => clearInterval(interval);
  }, [paused, intervalDuration]);

  const getPosition = (index: number) => {
    if (index === active) return "center";
    if (index === (active - 1 + images.length) % images.length) return "left";
    if (index === (active + 1) % images.length) return "right";
    return "hidden";
  };

  return (
    <div
      className="relative w-full h-[300px] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setpaused(true)}
      onMouseLeave={() => setpaused(false)}
    >
      {images.map((img, index) => {
        const position = getPosition(index);

        return (
          <img
            key={index}
            src={img}
            className={`
              absolute transition-all duration-800 ease-out w-[200px] h-[250px] object-cover 
              ${position === "center" && "scale-100 z-20 opacity-100"}
              ${position === "left" && "-translate-x-25 scale-75 opacity-50 z-10 -rotate-10"}
              ${position === "right" && "translate-x-25 scale-75 opacity-50 z-10 rotate-10"}
              ${position === "hidden" && "opacity-0 scale-50"}
            `}
          />
        );
      })}
    </div>
  );
}

// export default ContactForm;
export default App;
